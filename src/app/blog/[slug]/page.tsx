import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Tag } from "lucide-react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import PublicNavbar from "@/components/layout/public-navbar"

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: article } = await supabase
        .from("articles")
        .select("title, meta_description, excerpt")
        .eq("slug", slug)
        .eq("status", "published")
        .single()

    if (!article) {
        return { title: "Article Not Found | Aranora" }
    }

    return {
        title: `${article.title} | Aranora Blog`,
        description: article.meta_description || article.excerpt || "",
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: article, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single()

    if (error || !article) return notFound()

    // Fetch related articles (same tags, excluding current)
    const { data: related } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, published_at")
        .eq("status", "published")
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(3)

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Navigation */}
            <PublicNavbar />

            {/* Article */}
            <article className="pt-32 pb-12 md:pt-40 md:pb-16 relative">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Back Button */}
                    <div className="mb-10">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                            </span>
                            Back to Articles
                        </Link>
                    </div>

                    {/* Header */}
                    <header className="mb-10">
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {article.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                            {article.title}
                        </h1>

                        {article.excerpt && (
                            <p className="text-lg text-muted-foreground mb-6">
                                {article.excerpt}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
                            <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                {article.author_name}
                            </div>
                            {article.published_at && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(article.published_at).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Cover Image */}
                    {article.cover_image && (
                        <div className="rounded-2xl overflow-hidden mb-10">
                            <img
                                src={article.cover_image}
                                alt={article.title}
                                className="w-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    {/* CTA */}
                    <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-border text-center">
                        <h3 className="text-2xl font-bold mb-2">
                            Ready to streamline your freelance business?
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Try Aranora free for 30 days. No credit card required.
                        </p>
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-8 py-3 font-medium hover:bg-primary/90 transition-colors"
                        >
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Related Articles */}
                    {related && related.length > 0 && (
                        <section className="mt-16">
                            <h3 className="text-2xl font-bold mb-6">More Articles</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                {related.map((r) => (
                                    <Link
                                        key={r.id}
                                        href={`/blog/${r.slug}`}
                                        className="group p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                                    >
                                        <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                            {r.title}
                                        </h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {r.excerpt}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </article>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Aranora. All rights reserved.</p>
                </div>
            </footer>
        </main>
    )
}
