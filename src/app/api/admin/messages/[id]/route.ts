import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// Helper: get service-role Supabase client (bypasses RLS)
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createServiceClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

// Helper: ensure requester is an authenticated admin
async function requireAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

    return profile?.is_admin ? user : null
}

// DELETE /api/admin/messages/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin()
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = getServiceClient()

    const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting contact message:", error)
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

// PATCH /api/admin/messages/[id]  — mark as read/unread
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin()
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { is_read } = body

    const supabase = getServiceClient()

    const { error } = await supabase
        .from("contact_messages")
        .update({ is_read })
        .eq("id", id)

    if (error) {
        console.error("Error updating contact message:", error)
        return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
