import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { action, subject, message, type } = body
        const broadcastId = params.id

        if (!broadcastId) {
            return NextResponse.json({ error: "Missing broadcast ID" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Verify admin role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        }

        // 2. Handle Archive Action (Admin only view hide)
        if (action === "archive") {
            const { error: archiveError } = await supabase
                .from("broadcasts")
                .update({ is_archived: true })
                .eq("id", broadcastId)

            if (archiveError) throw archiveError

            await supabase.from("activity_logs").insert({
                admin_id: user.id,
                action: "Archived Broadcast",
                action_type: "system",
                target_id: broadcastId
            })

            return NextResponse.json({ success: true, message: "Broadcast archived" })
        }

        // 3. Handle Edit Action
        if (action === "edit") {
            if (!subject || !message) {
                return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
            }

            // A. Update the broadcast record
            const { error: updateError } = await supabase
                .from("broadcasts")
                .update({ subject, message, type: type || 'info' })
                .eq("id", broadcastId)

            if (updateError) throw updateError

            // B. Update all associated user notifications
            // Supabase JSONB querying doesn't have a direct top-level bulk update for arbitrary JSON paths 
            // without a function or RPC if we don't know the keys perfectly.
            // We'll query them first, then update (or rely on the fact that we can just update title/message directly)

            // We can update the table directly where the text matches the old OR where payload->>broadcast_id matches
            const { error: notifyUpdateError } = await supabase
                .from("notifications")
                .update({
                    title: subject,
                    message: message,
                    type: `broadcast_${type || 'info'}`
                })
                .eq("payload->>broadcast_id", broadcastId)

            if (notifyUpdateError) throw notifyUpdateError

            await supabase.from("activity_logs").insert({
                admin_id: user.id,
                action: "Edited Broadcast",
                action_type: "system",
                target_id: broadcastId,
                target_name: subject
            })

            return NextResponse.json({ success: true, message: "Broadcast updated" })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error) {
        console.error("Error updating broadcast:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const broadcastId = params.id
        if (!broadcastId) {
            return NextResponse.json({ error: "Missing broadcast ID" }, { status: 400 })
        }

        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // 1. Delete associated notifications
        const { error: notifyDeleteError } = await supabase
            .from("notifications")
            .delete()
            .eq("payload->>broadcast_id", broadcastId)

        if (notifyDeleteError) throw notifyDeleteError

        // 2. Delete the broadcast record
        const { error: deleteError } = await supabase
            .from("broadcasts")
            .delete()
            .eq("id", broadcastId)

        if (deleteError) throw deleteError

        await supabase.from("activity_logs").insert({
            admin_id: user.id,
            action: "Deleted Broadcast",
            action_type: "system",
            target_id: broadcastId
        })

        return NextResponse.json({ success: true, message: "Broadcast deleted" })
    } catch (error) {
        console.error("Error deleting broadcast:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
