import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Routes that don't require subscription
const PUBLIC_ROUTES = [
    '/', '/about', '/contact', '/privacy', '/terms', '/refund', '/blog',
    '/login', '/signup', '/forgot-password',
    '/pricing', '/error', '/become-affiliate',
];

// Route prefixes that don't require subscription
const PUBLIC_PREFIXES = [
    '/api/', '/promo/', '/invite/', '/progress/', '/sign/', '/intake/',
    '/_next/', '/favicon.ico', '/ref/', '/blog/',
];

function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) return true;
    return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
    // 1. Intercept "via" affiliate code gracefully on ANY route
    const viaCode = request.nextUrl.searchParams.get('via');
    if (viaCode && viaCode.length >= 3) {
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete('via');
        
        // Redirect smoothly to the same URL but without the spammy ?via= param
        const redirectResponse = NextResponse.redirect(cleanUrl);
        // httpOnly cookie for server-side usage (checkout, webhooks)
        redirectResponse.cookies.set('aranora_ref', viaCode, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });
        // JS-readable cookie for client-side form submissions (signup tracking)
        redirectResponse.cookies.set('aranora_ref_code', viaCode, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        // Fire-and-forget: track the affiliate link click
        const trackUrl = new URL('/api/affiliates/track-click', request.url);
        fetch(trackUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affiliateCode: viaCode,
                landingPage: request.nextUrl.pathname,
                referrer: request.headers.get('referer') || null,
            }),
        }).catch(() => { /* non-critical */ });

        return redirectResponse;
    }

    // 2. Update session for Supabase
    let response = await updateSession(request);

    const pathname = request.nextUrl.pathname;

    // 2. Check subscription for dashboard routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/projects') ||
        pathname.startsWith('/clients') || pathname.startsWith('/invoices') ||
        pathname.startsWith('/contracts') || pathname.startsWith('/tasks') ||
        pathname.startsWith('/reports') || pathname.startsWith('/calendar') ||
        pathname.startsWith('/time-tracking') || pathname.startsWith('/collaborators') ||
        pathname.startsWith('/settings') || pathname.startsWith('/subscriptions') ||
        pathname.startsWith('/broadcasts') || pathname.startsWith('/intake-forms') ||
        pathname.startsWith('/invitations')) {

        // Skip billing page — users need access to manage/upgrade
        if (pathname.startsWith('/billing')) {
            // Allow access to billing page always
        } else {
            try {
                const supabase = createServerClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        cookies: {
                            getAll() {
                                return request.cookies.getAll();
                            },
                            setAll(cookiesToSet) {
                                cookiesToSet.forEach(({ name, value, options }) => {
                                    response.cookies.set(name, value, options);
                                });
                            },
                        },
                    }
                );

                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('trial_ends_at, subscription_status, is_admin')
                        .eq('id', user.id)
                        .single();

                    // Admins always have access
                    if (profile?.is_admin) {
                        // Allow
                    } else if (profile) {
                        const status = profile.subscription_status;
                        const trialEndsAt = profile.trial_ends_at;

                        // Check if user has active access
                        let hasAccess = false;

                        if (status === 'active') {
                            hasAccess = true;
                        } else if (status === 'trialing' && trialEndsAt) {
                            const trialEnd = new Date(trialEndsAt);
                            hasAccess = trialEnd > new Date();
                        }

                        if (!hasAccess) {
                            if (status === 'affiliate') {
                                return NextResponse.redirect(new URL('/affiliates', request.url));
                            }
                            // Allow expired users through in read-only mode.
                            // Write operations are blocked at the server action level.
                            // UI shows a read-only banner prompting renewal.
                            // (No redirect — they can still view their data)
                        }
                    }
                }
            } catch (error) {
                console.error('Middleware subscription check error:', error);
                // Allow through on error to avoid blocking users
            }
        }
    }

    // 3. Add Security Headers
    const cspHeader = `
        default-src 'self' blob: data:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com https://tagassistant.google.com https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com https://*.stripe.com;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' blob: data: https://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com https://tagassistant.google.com https://api.stripe.com https://get.geojs.io;
        frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
        worker-src 'self' blob:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self' https://tagassistant.google.com;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // REMOVED X-Frame-Options to allow Tag Assistant frame-ancestors to work properly
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|txt|xml)$).*)",
    ],
};
