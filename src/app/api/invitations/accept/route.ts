import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.redirect(new URL('/dashboard?error=Invitation+system+is+no+longer+active', request.url));
}
