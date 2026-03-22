import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

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

function generateAffiliateCode(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20);
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { companyName, website, paymentMethod, paymentDetails } = await request.json();

        if (!companyName || !paymentMethod) {
            return NextResponse.json(
                { error: 'Company name and payment method are required' },
                { status: 400 }
            );
        }

        const serviceClient = createServiceClient();

        // Check if already registered
        const { data: existing } = await serviceClient
            .from('affiliates')
            .select('id, status')
            .eq('user_id', user.id)
            .single();

        if (existing) {
            if (existing.status === 'rejected') {
                return NextResponse.json(
                    { error: 'Your application was previously rejected. Please contact support.' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'You are already registered as an affiliate', affiliate: existing },
                { status: 409 }
            );
        }

        // Generate unique affiliate code with retry loop
        let affiliateCode = generateAffiliateCode(companyName);
        let attempts = 0;
        while (attempts < 5) {
            const { data: codeExists } = await serviceClient
                .from('affiliates')
                .select('id')
                .eq('affiliate_code', affiliateCode)
                .single();

            if (!codeExists) break;
            attempts++;
            affiliateCode = generateAffiliateCode(
                companyName + Math.random().toString(36).substring(2, 6)
            );
        }

        // Create affiliate record
        const { data: affiliate, error } = await serviceClient
            .from('affiliates')
            .insert({
                user_id: user.id,
                affiliate_code: affiliateCode,
                company_name: companyName,
                website: website || null,
                payment_method: paymentMethod,
                payment_details: paymentDetails || {},
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ affiliate });
    } catch (error) {
        console.error('Affiliate registration error:', error);
        return NextResponse.json(
            { error: 'Failed to register as affiliate' },
            { status: 500 }
        );
    }
}
