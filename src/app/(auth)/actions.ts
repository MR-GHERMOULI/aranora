'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/error')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, subscription_status')
            .eq('id', user.id)
            .single()

        if (profile?.is_admin) {
            revalidatePath('/', 'layout')
            redirect('/admin')
        }

        if (profile?.subscription_status === 'affiliate') {
            revalidatePath('/', 'layout')
            redirect('/affiliates')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const country = formData.get('country') as string
    const promoCode = formData.get('promoCode') as string | null

    const { data: signupData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
                country: country
            }
        }
    })

    if (error) {
        console.error('Signup error:', error)
        redirect('/error')
    }

    // Handle promo code — extend trial if valid
    if (promoCode && signupData?.user) {
        try {
            const { createServerClient } = await import('@supabase/ssr')
            const serviceClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { cookies: { getAll() { return [] }, setAll() { } } }
            )

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
                    .eq('id', signupData.user.id)

                // Mark promo as used
                await serviceClient
                    .from('promo_invite_links')
                    .update({
                        times_used: promo.times_used + 1,
                        used_by: signupData.user.id,
                        is_active: false,
                    })
                    .eq('id', promo.id)
            }
        } catch (promoError) {
            console.error('Promo code error (non-blocking):', promoError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
