'use client'

import { createClient } from '@/lib/supabase/client'

export async function getFooterLinks() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching footer links:', error)
        return []
    }
    return data
}

export async function createFooterLink(link: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('footer_links')
        .insert([{ ...link, user_id: user.id }])
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function updateFooterLink(id: string, updates: any) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('footer_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function deleteFooterLink(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}
