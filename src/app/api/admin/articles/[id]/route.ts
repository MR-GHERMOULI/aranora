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

        // Handle published_at logic
        if (body.published_at) {
            updateData.published_at = body.published_at
        } else if (body.status === 'published') {
            // Only set published_at if not already set and not provided in body
            const { data: existing } = await supabase
                .from("articles")
                .select("published_at")
                .eq("id", id)
                .single()

            if (!existing?.published_at) {
                updateData.published_at = new Date().toISOString()
            }
        } else if (body.status === 'draft') {
            // If explicitly moving back to draft, we might want to clear published_at
            // or keep it for history. Usually, clearing it is better for "scheduling" logic.
            // However, if it was already published, maybe keep it? 
            // User requested "schedule for publication at a later time after completing additions".
            // So if it's draft, it's not scheduled yet.
            updateData.published_at = null
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
