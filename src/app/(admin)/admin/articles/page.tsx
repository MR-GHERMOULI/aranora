import { createClient } from "@/lib/supabase/server"
import { ArticlesClient } from "@/components/admin/articles-client"
import { Newspaper } from "lucide-react"

export default async function AdminArticlesPage() {
    const supabase = await createClient()

    const { data: articles } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Newspaper className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Articles</h1>
                    <p className="text-muted-foreground">
                        Manage blog articles to boost SEO and engage visitors
                    </p>
                </div>
            </div>

            <ArticlesClient initialArticles={articles || []} />
        </div>
    )
}
