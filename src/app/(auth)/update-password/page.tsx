import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Update Password | Aranora',
    description: 'Set a new password for your Aranora account.',
}

export default function UpdatePasswordPage() {
    return <UpdatePasswordForm />
}
