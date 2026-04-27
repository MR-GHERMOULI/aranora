import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Trigger Supabase to send the OTP email natively
        const { error } = await supabase.auth.signInWithOtp({
            email: user.email,
            options: {
                shouldCreateUser: false,
            }
        })

        if (error) {
            console.error('Supabase send OTP error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const maskedEmail = maskEmail(user.email)
        return NextResponse.json({ success: true, maskedEmail })
    } catch (err) {
        console.error('Send OTP error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
}
