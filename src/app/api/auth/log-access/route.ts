import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1')
        const ua = request.headers.get('user-agent') || 'unknown'

        const serviceClient = createAdminClient()

        // Insert access log
        await serviceClient.from('user_access_logs').insert({
            user_id: user.id,
            ip_address: ip,
            user_agent: ua
        })

        // Update profile with latest IP and UA
        await serviceClient.from('profiles').update({
            last_ip: ip,
            last_ua: ua,
            last_login_at: new Date().toISOString()
        }).eq('id', user.id)

        // Set a cookie so middleware doesn't call this again for 24 hours
        const response = NextResponse.json({ success: true })
        response.cookies.set('aranora_access_logged', '1', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60, // 24 hours
        })

        return response
    } catch (err) {
        console.error('Log access error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
