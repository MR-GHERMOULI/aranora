'use client'

import { createClient } from '@/lib/supabase/client'

export async function getPlatformLinks() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('platform_links')
        .select('*')
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching platform links:', error)
        return []
    }
    return data
}

export async function createPlatformLink(platform: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('platform_links')
        .insert([{ ...platform, user_id: user.id }])
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function updatePlatformLink(id: string, updates: any) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('platform_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function deletePlatformLink(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('platform_links')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}
