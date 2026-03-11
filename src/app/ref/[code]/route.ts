import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code || code.length < 3) {
        return NextResponse.redirect(new URL('/pricing', request.url));
    }

    // Set a referral cookie that expires in 30 days
    const response = NextResponse.redirect(new URL('/pricing', request.url));
    response.cookies.set('aranora_ref', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
    });

    return response;
}
