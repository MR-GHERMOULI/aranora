import SignupForm from '@/components/auth/SignupForm'

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
    const supabase = await createClient();
    const { data: brandingSetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'branding')
        .single();
    
    const siteName = brandingSetting?.value?.site_name || 'Aranora';

    return {
        title: `Create Account | ${siteName}`,
        description: `Sign up for ${siteName} — the all-in-one freelancer management platform. Start your 30-day free trial, no credit card required.`,
    }
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ promo?: string }> }) {
    const { promo } = await searchParams;

    return <SignupForm promo={promo} />
}
