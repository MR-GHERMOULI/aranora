import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { FileEdit, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function AdminPagesPage() {
    const supabase = await createClient()

    const { data: pages } = await supabase
        .from("static_pages")
        .select("*")
        .order("slug")

    const defaultPages = [
        { slug: "about", title: "About Us", titleAr: "من نحن", icon: "📄" },
        { slug: "privacy", title: "Privacy Policy", titleAr: "سياسة الخصوصية", icon: "🔒" },
        { slug: "terms", title: "Terms of Service", titleAr: "شروط الخدمة", icon: "📋" },
        { slug: "faq", title: "FAQ", titleAr: "الأسئلة الشائعة", icon: "❓" },
        { slug: "contact", title: "Contact Us", titleAr: "اتصل بنا", icon: "📞" },
    ]

    const pagesWithData = defaultPages.map((defaultPage) => {
        const dbPage = pages?.find((p) => p.slug === defaultPage.slug)
        return {
            ...defaultPage,
            ...dbPage,
            hasContent: !!dbPage?.content,
            updatedAt: dbPage?.updated_at,
        }
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Static Pages</h1>
                <p className="text-muted-foreground mt-1">
                    Manage content for your platform&apos;s static pages
                </p>
            </div>

            {/* Pages Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pagesWithData.map((page) => (
                    <div
                        key={page.slug}
                        className="group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                    >
                        {/* Icon & Title */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{page.icon}</span>
                                <div>
                                    <h3 className="font-semibold">{page.title}</h3>
                                    <p className="text-sm text-muted-foreground">{page.titleAr}</p>
                                </div>
                            </div>
                            {page.hasContent ? (
                                <Badge className="bg-green-500/10 text-green-600">Published</Badge>
                            ) : (
                                <Badge variant="secondary">Draft</Badge>
                            )}
                        </div>

                        {/* Last Updated */}
                        {page.updatedAt && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                <Clock className="h-3 w-3" />
                                Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Link href={`/admin/pages/${page.slug}`} className="flex-1">
                                <Button variant="default" className="w-full gap-2">
                                    <FileEdit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Link href={`/${page.slug}`} target="_blank">
                                <Button variant="outline" size="icon">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="rounded-xl border bg-muted/30 p-6">
                <h3 className="font-semibold mb-2">📝 How to Edit Pages</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Click &quot;Edit&quot; to open the rich text editor</li>
                    <li>• Use the toolbar to format text, add links, and insert images</li>
                    <li>• Preview your changes before publishing</li>
                    <li>• View revision history to rollback to previous versions</li>
                </ul>
            </div>
        </div>
    )
}
