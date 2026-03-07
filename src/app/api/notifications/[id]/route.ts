import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// DELETE /api/notifications/[id]
// Deletes a notification only if it belongs to the current user
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the notification belongs to this user before deleting
    const { data: notification } = await supabase
        .from("notifications")
        .select("id, user_id")
        .eq("id", id)
        .single()

    if (!notification || notification.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Use service client to bypass missing DELETE RLS policy for users
    const serviceClient = getServiceClient()
    const { error } = await serviceClient
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id) // extra safety: scope to this user only

    if (error) {
        console.error("Error deleting notification:", error)
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
