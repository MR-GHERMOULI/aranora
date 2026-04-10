import SignupForm from '@/components/auth/SignupForm'

export const metadata = {
    title: 'Create Account | Aranora',
    description: 'Sign up for Aranora — the all-in-one freelancer management platform. Start your 30-day free trial, no credit card required.',
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ promo?: string }> }) {
    const { promo } = await searchParams;

    return <SignupForm promo={promo} />
}
