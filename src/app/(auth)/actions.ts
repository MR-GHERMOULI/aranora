'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateAndSendOtp } from '@/lib/otp'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Please provide both email and password.' }
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { error: 'Only Gmail addresses (@gmail.com) are allowed to sign in.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'Invalid email or password. Please try again.' }
        }
        if (error.message.includes('Email not confirmed')) {
            return { error: 'Please verify your email address before signing in.' }
        }
        return { error: error.message }
    }

    const user = data.user

    if (user) {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const mfaCookie = cookieStore.get('aranora_mfa_verified')

        // 1. Check if the user is already MFA verified on this device (e.g. "Remember me" is active)
        if (mfaCookie && mfaCookie.value === user.id) {
            // User is already verified, bypass OTP to save resources and improve UX
            revalidatePath('/', 'layout')
            redirect('/dashboard')
        }

        // 3. Generate and send a fresh OTP code via Resend email
        const otpResult = await generateAndSendOtp(user.email!)

        if (!otpResult.success) {
            console.error('Failed to send OTP:', otpResult.error)
            return { error: `Verification error: ${otpResult.error}` }
        }

        // 2b. Log access for security tracking
        try {
            const { headers } = await import('next/headers')
            const headerList = await headers()
            const ip = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
            const ua = headerList.get('user-agent') || 'unknown'
            
            const serviceClient = createAdminClient()
            
            await serviceClient.from('user_access_logs').insert({
                user_id: user.id,
                ip_address: ip,
                user_agent: ua
            })

            await serviceClient.from('profiles').update({
                last_ip: ip,
                last_ua: ua,
                last_login_at: new Date().toISOString()
            }).eq('id', user.id)
        } catch (logErr) {
            console.error('Failed to log access:', logErr)
        }

        revalidatePath('/', 'layout')
        redirect('/verify-otp')
    }

    // Fallback: if user is somehow not found but no error was thrown
    revalidatePath('/', 'layout')
    redirect('/verify-otp')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const country = formData.get('country') as string
    const promoCode = formData.get('promoCode') as string | null
    const formRefCode = formData.get('refCode') as string | null

    if (!email || !password || !fullName) {
        return { error: 'Please fill in all required fields.' }
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { error: 'Registration is limited to Gmail addresses (@gmail.com) only.' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long.' }
    }

    // Create service client upfront for fallback and profile verification
    const { createServerClient } = await import('@supabase/ssr')
    const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return [] }, setAll() { } } }
    )

    let userId: string | null = null

    // Helper: ensure a profile row exists for the given user
    async function ensureProfile(uid: string) {
        const { data: existingProfile } = await serviceClient
            .from('profiles')
            .select('id')
            .eq('id', uid)
            .single()

        if (!existingProfile) {
            const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'
            const suffix = Math.random().toString(36).substring(2, 6)
            const username = `${baseUsername}_${suffix}`

            await serviceClient.from('profiles').insert({
                id: uid,
                username,
                full_name: fullName,
                email,
                company_email: email,
                phone: phone || null,
                country: country || null,
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                subscription_status: 'trialing',
            })
        }
    }

    const { data: signupData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
                country: country
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aranora.com'}/api/auth/confirm`
        }
    })

    if (error) {
        if (error.message.includes('already registered')) {
            return { error: 'This email is already registered. Please sign in instead.' }
        }
        if (error.message.includes('password')) {
            return { error: 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.' }
        }

        // --- Database / trigger error fallback ---
        if (error.message.includes('Database error') || error.message.includes('saving new user')) {
            console.error('Signup trigger error:', error.message)

            try {
                // Check if user was partially created in auth.users
                const { data: existingUsersData } = await serviceClient.auth.admin.listUsers({
                    page: 1,
                    perPage: 1000,
                })
                let existingUser = existingUsersData?.users?.find(u => u.email === email)

                if (!existingUser) {
                    // User not found — try admin create
                    const { data: newUserData, error: createError } = await serviceClient.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: { full_name: fullName, phone, country },
                    })
                    if (createError || !newUserData?.user) {
                        console.error('Admin createUser failed:', createError?.message)
                        return { error: 'Registration failed. Please try again or contact support.' }
                    }
                    existingUser = newUserData.user
                } else {
                    // User exists but maybe unconfirmed — confirm + set password
                    await serviceClient.auth.admin.updateUserById(existingUser.id, {
                        email_confirm: true,
                        password: password,
                    })
                }

                userId = existingUser.id

                // Ensure profile row exists (trigger may have failed silently)
                await ensureProfile(userId)

                // Sign in to establish the browser session
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (signInError) {
                    console.error('Post-create signIn error:', signInError.message)
                    return { error: 'Account created successfully! Please sign in with your credentials.' }
                }

            } catch (fallbackError) {
                console.error('Signup fallback error:', fallbackError)
                return { error: 'An unexpected error occurred during registration. Please try again.' }
            }
        } else {
            return { error: error.message }
        }
    } else {
        // --- Signup succeeded ---
        userId = signupData?.user?.id || null

        // Belt-and-suspenders: verify the trigger created the profile.
        // If the trigger's EXCEPTION handler caught an error, the user exists
        // but the profile might be missing.
        if (userId) {
            try {
                await ensureProfile(userId)
            } catch (profileError) {
                console.error('Profile verification error (non-blocking):', profileError)
            }
        }

        if (!signupData?.session && signupData?.user) {
            return { needsEmailConfirmation: true, message: 'Account created! Please check your email to verify your account.' }
        }
    }

    // --- Handle promo code — extend trial if valid ---
    if (promoCode && userId) {
        try {
            // Validate promo code
            const { data: promo } = await serviceClient
                .from('promo_invite_links')
                .select('*')
                .eq('code', promoCode)
                .eq('is_active', true)
                .single()

            if (promo && promo.times_used < promo.max_uses) {
                // Extend trial based on promo free_months
                const extendedTrialEnd = new Date()
                extendedTrialEnd.setMonth(extendedTrialEnd.getMonth() + promo.free_months)

                await serviceClient
                    .from('profiles')
                    .update({ trial_ends_at: extendedTrialEnd.toISOString() })
                    .eq('id', userId)

                // Mark promo as used
                await serviceClient
                    .from('promo_invite_links')
                    .update({
                        times_used: promo.times_used + 1,
                        used_by: userId,
                        is_active: false,
                    })
                    .eq('id', promo.id)
            }
        } catch (promoError) {
            console.error('Promo code error (non-blocking):', promoError)
        }
    }

    // --- Track affiliate referral if ref cookie exists ---
    if (userId) {
        try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const refCode = formRefCode || cookieStore.get('aranora_ref')?.value || cookieStore.get('aranora_ref_code')?.value;

            if (refCode) {
                const { data: affiliate } = await serviceClient
                    .from('affiliates')
                    .select('id')
                    .eq('affiliate_code', refCode)
                    .in('status', ['active', 'pending'])
                    .single();

                if (affiliate) {
                    // Check if referral already exists
                    const { data: existingRef } = await serviceClient
                        .from('affiliate_referrals')
                        .select('id')
                        .eq('affiliate_id', affiliate.id)
                        .eq('referred_user_id', userId)
                        .single();

                    if (!existingRef) {
                        await serviceClient.from('affiliate_referrals').insert({
                            affiliate_id: affiliate.id,
                            referred_user_id: userId,
                            status: 'signed_up',
                        });

                        // Mark profile with referring affiliate
                        await serviceClient
                            .from('profiles')
                            .update({ referred_by_affiliate: refCode })
                            .eq('id', userId);
                    }
                }
            }
        } catch (refErr) {
            console.error('Referral tracking in signup (non-critical):', refErr);
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Please enter your email address.' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aranora.com'}/api/auth/callback?next=/update-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string

    if (!password || password.length < 8) {
        return { error: 'Password must be at least 8 characters long.' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    // We NO LONGER clear the MFA cookie on logout.
    // This allows the "Remember for 30 days" feature to persist across sessions
    // on the same device, satisfying the user request for once-a-month verification.
    
    redirect('/login')
}
