import LoginForm from '@/components/auth/LoginForm'

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
        title: `Sign In | ${siteName}`,
        description: `Sign in to your ${siteName} account to manage your freelance business — projects, clients, invoices, and more.`,
    }
}

export default function LoginPage() {
    return <LoginForm />
}
