'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface SearchResult {
    id: string;
    type: 'client' | 'project' | 'invoice';
    title: string;
    subtitle?: string;
    href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const searchTerm = `%${query}%`;

    const [
        { data: clients },
        { data: projects },
        { data: invoices }
    ] = await Promise.all([
        supabase.from('clients')
            .select('id, name')
            .eq('user_id', user.id)
            .ilike('name', searchTerm)
            .limit(5),
        supabase.from('projects')
            .select('id, title, client:clients(name)')
            .eq('user_id', user.id)
            .ilike('title', searchTerm)
            .limit(5),
        supabase.from('invoices')
            .select('id, invoice_number, client:clients(name)')
            .eq('user_id', user.id)
            .ilike('invoice_number', searchTerm)
            .limit(5)
    ]);

    const results: SearchResult[] = [
        ...(clients || []).map(c => ({
            id: c.id,
            type: 'client' as const,
            title: c.name,
            subtitle: 'Client',
            href: `/clients/${c.id}`
        })),
        ...(projects || []).map(p => ({
            id: p.id,
            type: 'project' as const,
            title: p.title,
            // @ts-ignore
            subtitle: `Project • ${p.client?.name || ''}`,
            href: `/projects/${p.id}`
        })),
        ...(invoices || []).map(i => ({
            id: i.id,
            type: 'invoice' as const,
            title: i.invoice_number,
            // @ts-ignore
            subtitle: `Invoice • ${i.client?.name || ''}`,
            href: `/invoices/${i.id}`
        }))
    ];

    return results;
}
