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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code || code.length < 3) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Validate that the affiliate code exists and belongs to an active affiliate
    const serviceClient = createServiceClient();
    const { data: affiliate } = await serviceClient
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', code)
        .in('status', ['active', 'pending']) // consistent with ?via= middleware
        .single();

    if (!affiliate) {
        // Invalid or inactive affiliate code — redirect without setting cookie
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Set referral cookies that expire in 30 days
    const response = NextResponse.redirect(new URL('/', request.url));
    // httpOnly cookie for server-side usage (checkout, webhooks)
    response.cookies.set('aranora_ref', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
    });
    // JS-readable cookie for client-side form submissions (signup tracking)
    response.cookies.set('aranora_ref_code', code, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
    });

    return response;
}
