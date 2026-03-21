import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

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

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return null;
    return user;
}

// GET — List all promo links
export async function GET() {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Fetch links without FK joins (created_by/used_by reference auth.users, not profiles)
    const { data: links, error } = await serviceClient
        .from('promo_invite_links')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching promo links:', error);
        return NextResponse.json({ error: 'Failed to fetch promo links' }, { status: 500 });
    }

    // Collect all user IDs for creator/redeemer profiles
    const userIds = new Set<string>();
    (links || []).forEach(link => {
        if (link.created_by) userIds.add(link.created_by);
        if (link.used_by) userIds.add(link.used_by);
    });

    let profilesMap: Record<string, { full_name: string; company_email: string }> = {};
    if (userIds.size > 0) {
        const { data: profiles } = await serviceClient
            .from('profiles')
            .select('id, full_name, company_email')
            .in('id', Array.from(userIds));

        if (profiles) {
            profilesMap = Object.fromEntries(
                profiles.map(p => [p.id, { full_name: p.full_name, company_email: p.company_email }])
            );
        }
    }

    // Attach creator/redeemer profile info
    const enrichedLinks = (links || []).map(link => ({
        ...link,
        creator: link.created_by ? profilesMap[link.created_by] || null : null,
        redeemer: link.used_by ? profilesMap[link.used_by] || null : null,
    }));

    return NextResponse.json(enrichedLinks);
}

// POST — Create a new promo invite link
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { freeMonths, expiresInDays } = await request.json();

    if (!freeMonths || ![6, 12].includes(freeMonths)) {
        return NextResponse.json({ error: 'freeMonths must be 6 or 12' }, { status: 400 });
    }

    const code = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const serviceClient = createServiceClient();
    const { data: link, error } = await serviceClient
        .from('promo_invite_links')
        .insert({
            code,
            free_months: freeMonths,
            max_uses: 1,
            times_used: 0,
            created_by: user.id,
            expires_at: expiresAt,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating promo link:', error);
        return NextResponse.json({ error: 'Failed to create promo link' }, { status: 500 });
    }

    return NextResponse.json(link);
}

// DELETE — Deactivate a promo link
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
        .from('promo_invite_links')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deactivating promo link:', error);
        return NextResponse.json({ error: 'Failed to deactivate' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
