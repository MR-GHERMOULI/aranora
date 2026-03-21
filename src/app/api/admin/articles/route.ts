import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const { data: articles, error } = await supabase
            .from("articles")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(articles || [])
    } catch (error) {
        console.error("Error fetching articles:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { title, slug, excerpt, content, cover_image, author_name, status, tags, meta_description } = body

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        // Auto-generate slug from title if not provided
        const finalSlug = slug || title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        const insertData: Record<string, unknown> = {
            title,
            slug: finalSlug,
            excerpt: excerpt || '',
            content: content || '',
            cover_image: cover_image || null,
            author_name: author_name || 'Aranora Team',
            status: status || 'draft',
            tags: tags || [],
            meta_description: meta_description || '',
            created_by: user.id,
            published_at: status === 'published' ? new Date().toISOString() : null,
        }

        const { data: article, error } = await supabase
            .from("articles")
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        // Log activity
        await supabase.from("activity_logs").insert({
            admin_id: user.id,
            action: "Created Article",
            action_type: "content",
            target_id: article.id,
            target_name: title,
        })

        return NextResponse.json(article)
    } catch (error) {
        console.error("Error creating article:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
