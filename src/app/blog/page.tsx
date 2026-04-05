import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import PublicNavbar from "@/components/layout/public-navbar"

export const metadata: Metadata = {
    title: "Blog | Aranora — Tips for Freelancers",
    description:
        "Read professional articles about freelancing, invoicing, project management, and growing your freelance business with Aranora.",
}

export default async function BlogPage() {
    const supabase = await createClient()

    const { data: articles } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, cover_image, author_name, tags, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Navigation */}
            <PublicNavbar />

            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        The Aranora Blog
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Expert tips, insights, and guides to help you thrive as a freelancer.
                        From invoicing best practices to client management strategies.
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="pb-24">
                <div className="max-w-6xl mx-auto px-4">
                    {!articles || articles.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl text-muted-foreground">
                                Articles coming soon! Stay tuned for expert freelancing tips.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug}`}
                                    className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                                >
                                    {/* Cover Image */}
                                    {article.cover_image && (
                                        <div className="aspect-video overflow-hidden bg-muted">
                                            <img
                                                src={article.cover_image}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    {!article.cover_image && (
                                        <div className="aspect-video bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
                                            <span className="text-4xl opacity-50">📝</span>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6 space-y-3">
                                        {/* Tags */}
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {article.tags.slice(0, 3).map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>

                                        {article.excerpt && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="text-xs text-muted-foreground">
                                                <span>{article.author_name}</span>
                                                {article.published_at && (
                                                    <>
                                                        {" · "}
                                                        {new Date(
                                                            article.published_at
                                                        ).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Aranora. All rights reserved.</p>
                </div>
            </footer>
        </main>
    )
}
