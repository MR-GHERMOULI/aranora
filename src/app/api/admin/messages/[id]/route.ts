import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// Helper: get service-role Supabase client (bypasses RLS)
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error("Missing Supabase environment variables")
    }

    return createServiceClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

// Helper: ensure requester is an authenticated admin
async function requireAdmin() {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error("Admin check: No user found", authError)
            return null
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (profileError || !profile) {
            console.error("Admin check: Profile not found or error", profileError)
            return null
        }

        return profile.is_admin ? user : null
    } catch (err) {
        console.error("Unexpected error in requireAdmin:", err)
        return null
    }
}

// DELETE /api/admin/messages/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin()
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { id } = await params

    try {
        const supabase = getServiceClient()

        // Use count: 'exact' to see if anything was actually deleted
        const { error, count } = await supabase
            .from("contact_messages")
            .delete({ count: 'exact' })
            .eq("id", id)

        if (error) {
            console.error("Error deleting contact message:", error)
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
        }

        if (count === 0) {
            return NextResponse.json({ error: "Message not found or already deleted" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("Unexpected error deleting message:", err)
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
    }
}

// PATCH /api/admin/messages/[id]  — mark as read/unread
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin()
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { id } = await params

    try {
        const body = await request.json()
        const { is_read } = body

        if (typeof is_read !== 'boolean') {
            return NextResponse.json({ error: "Missing or invalid is_read boolean" }, { status: 400 })
        }

        const supabase = getServiceClient()

        const { error, count } = await supabase
            .from("contact_messages")
            .update({ is_read })
            .eq("id", id)
            .select('id') // We need a select for count to be reliable in some cases or just use count

        // Note: count from .update() can be tricky, check if error occurred first
        if (error) {
            console.error("Error updating contact message:", error)
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("Unexpected error updating message:", err)
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
    }
}
