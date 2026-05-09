"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient()

    const projectId = formData.get("projectId") as string
    const name = formData.get("name") as string
    const comment = formData.get("comment") as string
    const photos = formData.getAll("photos") as File[]

    // Fetch the user to automatically grab the email if they are logged in
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || null

    if (photos.length > 10) {
        return { error: "You can only upload a maximum of 10 photos." }
    }

    // 1. Upload photos if any
    const photoUrls: string[] = []
    
    if (photos.length > 0 && photos[0].size > 0) {
        for (const photo of photos) {
            const fileName = `${Date.now()}-${photo.name}`
            const { data, error } = await supabase.storage
                .from("feedback-photos")
                .upload(fileName, photo)

            if (error) {
                console.error("Error uploading photo:", error)
                continue
            }

            const { data: { publicUrl } } = supabase.storage
                .from("feedback-photos")
                .getPublicUrl(fileName)

            photoUrls.push(publicUrl)
        }
    }

    // 2. Insert feedback into database
    const { error } = await supabase
        .from("customer_feedback")
        .insert({
            project_id: projectId || null,
            name,
            email,
            comment,
            photos: photoUrls,
            is_read: false
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/admin/feedback")
    return { success: true }
}

export async function markFeedbackAsRead(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("customer_feedback")
        .update({ is_read: true })
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/admin/feedback")
    return { success: true }
}

export async function deleteFeedback(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("customer_feedback")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/admin/feedback")
    return { success: true }
}
