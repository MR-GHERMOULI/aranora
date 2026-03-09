import { createServerClient } from '@supabase/ssr';
import { PromoPageClient } from '@/components/billing/promo-page-client';

function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );
}

export default async function PromoPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    const supabase = createServiceClient();
    const { data: promo } = await supabase
        .from('promo_invite_links')
        .select('*')
        .eq('code', code)
        .single();

    return <PromoPageClient code={code} promo={promo} />;
}
