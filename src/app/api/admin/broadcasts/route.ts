import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { subject, message, type = "info" } = body

        if (!subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // 1. Get current admin user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 1.1 Verify admin role in profiles table
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (profileError || !profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        }

        // 2. Fetch all user IDs
        // Note: For large scale, this should be done in batches or a background job
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id")

        if (profilesError) throw profilesError

        const count = profiles?.length || 0

        // 3. Create Broadcast Record
        const { data: broadcast, error: broadcastError } = await supabase
            .from("broadcasts")
            .insert({
                subject,
                message,
                type,
                target_audience: "all",
                sent_count: count,
                created_by: user.id
            })
            .select()
            .single()

        if (broadcastError) throw broadcastError

        // 4. Batch Insert Notifications
        if (profiles && profiles.length > 0) {
            // Prepare batches of 1000 to avoid request size limits if needed
            // For now, simple insert
            const notifications = profiles.map(p => ({
                user_id: p.id,
                title: subject,
                message: message,
                type: type,
                read: false
            }))

            const { error: notifyError } = await supabase
                .from("notifications")
                .insert(notifications)

            if (notifyError) throw notifyError
        }

        // 5. Log Activity
        await supabase.from("activity_logs").insert({
            admin_id: user.id,
            action: "Sent Broadcast",
            action_type: "system",
            target_id: broadcast.id,
            target_name: subject,
            metadata: { count, type }
        })

        return NextResponse.json({ success: true, count })
    } catch (error) {
        console.error("Error sending broadcast:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
