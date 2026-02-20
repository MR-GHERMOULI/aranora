'use client'

import { createClient } from '@/lib/supabase/client'

export async function getTestimonials() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching testimonials:', error)
        return []
    }
    return data
}

export async function createTestimonial(testimonial: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('testimonials')
        .insert([{ ...testimonial, user_id: user.id }])
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function updateTestimonial(id: string, updates: any) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function deleteTestimonial(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}
