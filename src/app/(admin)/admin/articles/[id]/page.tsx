import { createClient } from "@/lib/supabase/server"
import { ArticleEditor } from "@/components/admin/article-editor"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: article, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !article) return notFound()

    return (
        <ArticleEditor
            initialData={{
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt || "",
                content: article.content || "",
                cover_image: article.cover_image || "",
                author_name: article.author_name || "Aranora Team",
                status: article.status,
                tags: article.tags || [],
                meta_description: article.meta_description || "",
            }}
            isNew={false}
        />
    )
}
