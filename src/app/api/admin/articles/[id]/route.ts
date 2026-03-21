import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const { data: article, error } = await supabase
            .from("articles")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw error
        if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json(article)
    } catch (error) {
        console.error("Error fetching article:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const updateData: Record<string, unknown> = {
            ...body,
            updated_at: new Date().toISOString(),
        }

        // Set published_at when transitioning to published
        if (body.status === 'published') {
            // Only set published_at if not already set
            const { data: existing } = await supabase
                .from("articles")
                .select("published_at")
                .eq("id", id)
                .single()

            if (!existing?.published_at) {
                updateData.published_at = new Date().toISOString()
            }
        }

        const { data: article, error } = await supabase
            .from("articles")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(article)
    } catch (error) {
        console.error("Error updating article:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const { error } = await supabase
            .from("articles")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting article:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
