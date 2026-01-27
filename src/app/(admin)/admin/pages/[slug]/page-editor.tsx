"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, History, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface PageEditorProps {
    slug: string
    initialData: {
        id?: string
        title: string
        titleAr: string
        content: string
        contentAr: string
        contactInfo: Record<string, string>
        metaDescription: string
    }
    revisions: {
        id: string
        title: string | null
        content: string | null
        created_at: string
    }[]
}

export function PageEditor({ slug, initialData, revisions }: PageEditorProps) {
    const [title, setTitle] = useState(initialData.title)
    const [titleAr, setTitleAr] = useState(initialData.titleAr)
    const [content, setContent] = useState(initialData.content)
    const [contentAr, setContentAr] = useState(initialData.contentAr)
    const [metaDescription, setMetaDescription] = useState(initialData.metaDescription)
    const [contactInfo, setContactInfo] = useState(initialData.contactInfo)
    const [isPreview, setIsPreview] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("english")
    const router = useRouter()
    const supabase = createClient()

    async function handleSave() {
        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (initialData.id) {
                // Update existing page
                await supabase
                    .from("static_pages")
                    .update({
                        title,
                        title_ar: titleAr,
                        content,
                        content_ar: contentAr,
                        meta_description: metaDescription,
                        contact_info: slug === "contact" ? contactInfo : {},
                        updated_by: user?.id,
                    })
                    .eq("id", initialData.id)

                // Create revision
                await supabase.from("page_revisions").insert({
                    page_id: initialData.id,
                    title,
                    content,
                    edited_by: user?.id,
                })
            } else {
                // Create new page
                const { data: newPage } = await supabase
                    .from("static_pages")
                    .insert({
                        slug,
                        title,
                        title_ar: titleAr,
                        content,
                        content_ar: contentAr,
                        meta_description: metaDescription,
                        contact_info: slug === "contact" ? contactInfo : {},
                        updated_by: user?.id,
                    })
                    .select()
                    .single()

                if (newPage) {
                    await supabase.from("page_revisions").insert({
                        page_id: newPage.id,
                        title,
                        content,
                        edited_by: user?.id,
                    })
                }
            }

            router.refresh()
        } catch (error) {
            console.error("Error saving page:", error)
        } finally {
            setIsSaving(false)
        }
    }

    async function restoreRevision(revision: { title: string | null; content: string | null }) {
        if (revision.title) setTitle(revision.title)
        if (revision.content) setContent(revision.content)
    }

    const isContactPage = slug === "contact"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pages">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit: {title}</h1>
                        <p className="text-sm text-muted-foreground">/{slug}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsPreview(!isPreview)}
                        className="gap-2"
                    >
                        <Eye className="h-4 w-4" />
                        {isPreview ? "Edit" : "Preview"}
                    </Button>

                    {/* Revisions Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <History className="h-4 w-4" />
                                History
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Revision History</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {revisions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No revisions yet
                                    </p>
                                ) : (
                                    revisions.map((rev) => (
                                        <div
                                            key={rev.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{rev.title || "Untitled"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(rev.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => restoreRevision(rev)}
                                                className="gap-1"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                Restore
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {isPreview ? (
                /* Preview Mode */
                <div className="rounded-xl border bg-card p-8">
                    <h2 className="text-3xl font-bold mb-6">{title}</h2>
                    <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            ) : (
                /* Edit Mode */
                <div className="space-y-6">
                    {/* Meta Info */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h3 className="font-semibold">Page Settings</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Title (English)</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Page title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Title (Arabic)</Label>
                                <Input
                                    value={titleAr}
                                    onChange={(e) => setTitleAr(e.target.value)}
                                    placeholder="عنوان الصفحة"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Meta Description (SEO)</Label>
                            <Input
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                placeholder="Brief description for search engines..."
                            />
                        </div>
                    </div>

                    {/* Contact Page Fields */}
                    {isContactPage && (
                        <div className="rounded-xl border bg-card p-6 space-y-4">
                            <h3 className="font-semibold">Contact Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={contactInfo.email || ""}
                                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                        placeholder="contact@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={contactInfo.phone || ""}
                                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={contactInfo.address || ""}
                                        onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                                        placeholder="123 Main St, City"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Working Hours</Label>
                                    <Input
                                        value={contactInfo.hours || ""}
                                        onChange={(e) => setContactInfo({ ...contactInfo, hours: e.target.value })}
                                        placeholder="Mon-Fri 9AM-5PM"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Editor */}
                    <div className="rounded-xl border bg-card p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="english">English</TabsTrigger>
                                <TabsTrigger value="arabic">العربية</TabsTrigger>
                            </TabsList>

                            <TabsContent value="english" className="space-y-4">
                                <Label>Content (HTML)</Label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full min-h-[400px] p-4 rounded-lg border bg-background font-mono text-sm resize-y"
                                    placeholder="<h2>Welcome</h2><p>Your content here...</p>"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a href=&quot;...&quot;&gt;
                                </p>
                            </TabsContent>

                            <TabsContent value="arabic" className="space-y-4">
                                <Label>Content - Arabic (HTML)</Label>
                                <textarea
                                    value={contentAr}
                                    onChange={(e) => setContentAr(e.target.value)}
                                    className="w-full min-h-[400px] p-4 rounded-lg border bg-background font-mono text-sm resize-y"
                                    placeholder="<h2>مرحباً</h2><p>المحتوى هنا...</p>"
                                    dir="rtl"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            )}
        </div>
    )
}
