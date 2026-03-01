import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify the requester is an admin
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

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        // Delete the user via Supabase admin API (server-side only)
        const { error } = await supabase.auth.admin.deleteUser(userId)

        if (error) {
            console.error("Error deleting user:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Log the activity
        await supabase.from("activity_logs").insert({
            admin_id: user.id,
            action: "Deleted User",
            action_type: "user",
            target_id: userId,
            metadata: {}
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error in delete user API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
