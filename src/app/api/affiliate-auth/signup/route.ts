import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );
}

async function ensureProfileExists(
    serviceClient: ReturnType<typeof createServiceClient>,
    userId: string,
    email: string,
    fullName: string
) {
    const { data: existingProfile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (existingProfile) return true;

    // Profile doesn't exist — create it manually
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
    const suffix = Math.random().toString(36).substring(2, 6);
    const username = `${baseUsername}_${suffix}`;

    const { error: insertError } = await serviceClient
        .from('profiles')
        .insert({
            id: userId,
            username,
            full_name: fullName,
            email,
            company_email: email,
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_status: 'trialing',
        });

    if (insertError) {
        console.error('Manual profile creation failed:', { userId, error: insertError.message });
        return false;
    }

    return true;
}

export async function POST(request: NextRequest) {
    try {
        const { fullName, email, password } = await request.json();

        if (!fullName || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const response = NextResponse.json({ success: true });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return request.cookies.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (error) {
            console.error('Affiliate signup auth error:', error.message);

            if (error.message.includes('already registered')) {
                return NextResponse.json(
                    { error: 'An account with this email already exists. Please sign in.' },
                    { status: 409 }
                );
            }

            // Handle the specific trigger/database error
            // "Database error saving new user" means the trigger fired but failed
            if (error.message.includes('Database error') || error.message.includes('saving new user')) {
                const serviceClient = createServiceClient();

                // The auth user may have been created but the profile trigger failed.
                // Look up the auth user via the profiles table email column, or query
                // auth.users directly. We use listUsers with a page filter as a fallback.
                // Since Supabase admin API doesn't support email filter, we query profiles
                // or use createUser to determine if the user exists.
                //
                // Instead: attempt sign-in to verify the account exists and get their ID
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!signInError && signInData?.user) {
                    // User exists and can sign in — ensure profile exists
                    await ensureProfileExists(serviceClient, signInData.user.id, email, fullName);
                    return response;
                }

                // Account may exist but email confirmation is required, OR account wasn't created.
                // Try creating via admin API to get the user ID (will fail if user exists)
                const { data: newUserData, error: createError } = await serviceClient.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: fullName },
                });

                if (!createError && newUserData?.user) {
                    // User was just created via admin — create profile
                    await ensureProfileExists(serviceClient, newUserData.user.id, email, fullName);

                    // Sign in to establish session
                    const { error: finalSignInError } = await supabase.auth.signInWithPassword({ email, password });
                    if (finalSignInError) {
                        console.warn('Admin-created account sign-in failed:', finalSignInError.message);
                        return NextResponse.json({
                            success: true,
                            message: 'Account created. Please sign in to continue.',
                            requiresLogin: true,
                        });
                    }
                    return response;
                }

                // User already exists in auth (createUser returned a conflict error)
                // We can't retrieve their ID without listUsers — return a helpful message
                console.error('Database error recovery failed. createError:', createError?.message);
                return NextResponse.json(
                    { error: 'Registration failed due to a database error. Please try signing in or contact support.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Auth signup succeeded — verify profile was created
        if (data?.user) {
            const serviceClient = createServiceClient();

            // Small delay to give the trigger time to fire
            await new Promise(resolve => setTimeout(resolve, 500));

            await ensureProfileExists(serviceClient, data.user.id, email, fullName);

            // Track affiliate referral if a referral cookie is present
            const refCode = request.cookies.get('aranora_ref')?.value;
            if (refCode) {
                try {
                    const { data: affiliate } = await serviceClient
                        .from('affiliates')
                        .select('id')
                        .eq('affiliate_code', refCode)
                        .eq('status', 'active')
                        .single();

                    if (affiliate) {
                        // Check if referral already exists
                        const { data: existingRef } = await serviceClient
                            .from('affiliate_referrals')
                            .select('id')
                            .eq('affiliate_id', affiliate.id)
                            .eq('referred_user_id', data.user.id)
                            .single();

                        if (!existingRef) {
                            await serviceClient.from('affiliate_referrals').insert({
                                affiliate_id: affiliate.id,
                                referred_user_id: data.user.id,
                                status: 'signed_up',
                            });

                            // Mark profile with referring affiliate
                            await serviceClient
                                .from('profiles')
                                .update({ referred_by_affiliate: refCode })
                                .eq('id', data.user.id);
                        }
                    }
                } catch (refErr) {
                    console.warn('Referral tracking failed (non-critical):', refErr);
                }
            }
        }

        return response;
    } catch (err) {
        console.error('Affiliate signup unexpected error:', err);
        return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
    }
}
