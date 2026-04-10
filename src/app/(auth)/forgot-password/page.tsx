import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
    title: 'Reset Password | Aranora',
    description: 'Reset your Aranora account password. Enter your email and receive a secure password reset link.',
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
