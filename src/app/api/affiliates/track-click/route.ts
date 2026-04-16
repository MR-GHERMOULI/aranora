import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createHash } from 'crypto';

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

function hashIP(ip: string): string {
    return createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'aranora-salt')).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { affiliateCode, landingPage, referrer } = await request.json();

        if (!affiliateCode || affiliateCode.length < 3) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Find the affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, total_clicks')
            .eq('affiliate_code', affiliateCode)
            .eq('status', 'active')
            .single();

        if (!affiliate) {
            return NextResponse.json({ error: 'Invalid affiliate' }, { status: 404 });
        }

        // Get and hash IP for deduplication
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
        const ipHash = hashIP(ip);
        const userAgent = request.headers.get('user-agent') || '';

        // Deduplicate: skip if same IP clicked this affiliate's link in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentClick } = await supabase
            .from('affiliate_link_clicks')
            .select('id')
            .eq('affiliate_id', affiliate.id)
            .eq('ip_hash', ipHash)
            .gte('clicked_at', twentyFourHoursAgo)
            .limit(1)
            .single();

        if (recentClick) {
            // Already counted within 24h — skip
            return NextResponse.json({ tracked: false, reason: 'duplicate' });
        }

        // Insert click record
        await supabase.from('affiliate_link_clicks').insert({
            affiliate_id: affiliate.id,
            ip_hash: ipHash,
            user_agent: userAgent.substring(0, 500),
            referrer: referrer?.substring(0, 1000) || null,
            landing_page: landingPage?.substring(0, 500) || null,
        });

        // Increment total_clicks counter
        await supabase
            .from('affiliates')
            .update({ total_clicks: (affiliate.total_clicks || 0) + 1 })
            .eq('id', affiliate.id);

        return NextResponse.json({ tracked: true });
    } catch (error) {
        console.error('Click tracking error:', error);
        // Non-critical — don't break the user experience
        return NextResponse.json({ tracked: false }, { status: 200 });
    }
}
