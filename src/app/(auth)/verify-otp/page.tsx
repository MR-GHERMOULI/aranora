import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import OtpForm from '@/components/auth/OtpForm'

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
}

export default async function VerifyOtpPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Must be logged in to see this page
    if (!user || !user.email) {
        redirect('/login')
    }

    // Check if MFA cookie is already valid
    const cookieStore = await cookies()
    const mfaCookie = cookieStore.get('aranora_mfa_verified')
    if (mfaCookie?.value === user.id) {
        redirect('/dashboard')
    }

    // Trigger Supabase to send the OTP email natively
    await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
            shouldCreateUser: false,
        }
    })

    const maskedEmail = maskEmail(user.email)

    return <OtpForm maskedEmail={maskedEmail} />
}


