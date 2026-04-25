import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

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
        title: `Reset Password | ${siteName}`,
        description: `Reset your ${siteName} account password. Enter your email and receive a secure password reset link.`,
    }
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
