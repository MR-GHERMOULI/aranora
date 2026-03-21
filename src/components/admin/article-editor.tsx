"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Eye, Globe, Upload, ImageIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ArticleData {
    id?: string
    title: string
    slug: string
    excerpt: string
    content: string
    cover_image: string
    author_name: string
    status: string
    tags: string[]
    meta_description: string
}

interface ArticleEditorProps {
    initialData: ArticleData
    isNew: boolean
}

export function ArticleEditor({ initialData, isNew }: ArticleEditorProps) {
    const [data, setData] = useState<ArticleData>(initialData)
    const [isPreview, setIsPreview] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [tagsInput, setTagsInput] = useState(initialData.tags.join(", "))
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    async function handleImageUpload(file: File) {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB')
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to upload image')
            }

            const { url } = await res.json()
            updateField("cover_image", url)
            toast.success('Cover image uploaded')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload image')
        } finally {
            setIsUploading(false)
        }
    }

    function updateField(field: keyof ArticleData, value: string | string[]) {
        setData((prev) => ({ ...prev, [field]: value }))
    }

    function handleSlugFromTitle() {
        if (!data.slug || data.slug === "") {
            const slug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            updateField("slug", slug)
        }
    }

    async function handleSave(publishStatus?: string) {
        if (!data.title.trim()) {
            toast.error("Title is required")
            return
        }

        setIsSaving(true)
        try {
            const saveData = {
                ...data,
                tags: tagsInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                status: publishStatus || data.status,
            }

            if (isNew) {
                const res = await fetch("/api/admin/articles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(saveData),
                })
                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || "Failed to create")
                }
                const article = await res.json()
                toast.success(
                    publishStatus === "published"
                        ? "Article published!"
                        : "Article saved as draft"
                )
                router.push(`/admin/articles/${article.id}`)
            } else {
                const res = await fetch(`/api/admin/articles/${data.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(saveData),
                })
                if (!res.ok) throw new Error("Failed to update")
                toast.success("Article updated successfully")
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to save article")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/articles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isNew ? "New Article" : `Edit: ${data.title}`}
                        </h1>
                        {!isNew && (
                            <p className="text-sm text-muted-foreground">/blog/{data.slug}</p>
                        )}
                    </div>
                    {!isNew && (
                        <Badge
                            className={
                                data.status === "published"
                                    ? "bg-green-500/10 text-green-600"
                                    : ""
                            }
                            variant={data.status === "published" ? "default" : "secondary"}
                        >
                            {data.status === "published" ? "Published" : "Draft"}
                        </Badge>
                    )}
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
                    <Button
                        variant="outline"
                        onClick={() => handleSave("draft")}
                        disabled={isSaving}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave("published")}
                        disabled={isSaving}
                        className="gap-2"
                    >
                        <Globe className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Publish"}
                    </Button>
                </div>
            </div>

            {isPreview ? (
                /* Preview Mode */
                <div className="rounded-xl border bg-card p-8">
                    <h2 className="text-3xl font-bold mb-4">{data.title}</h2>
                    {data.excerpt && (
                        <p className="text-lg text-muted-foreground mb-6">{data.excerpt}</p>
                    )}
                    <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                </div>
            ) : (
                /* Edit Mode */
                <div className="space-y-6">
                    {/* Title & Slug */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h3 className="font-semibold">Article Details</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => updateField("title", e.target.value)}
                                    onBlur={handleSlugFromTitle}
                                    placeholder="Article title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (URL)</Label>
                                <Input
                                    value={data.slug}
                                    onChange={(e) => updateField("slug", e.target.value)}
                                    placeholder="article-url-slug"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Excerpt (Short Description)</Label>
                            <Input
                                value={data.excerpt}
                                onChange={(e) => updateField("excerpt", e.target.value)}
                                placeholder="Brief summary for article cards and SEO..."
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Author Name</Label>
                                <Input
                                    value={data.author_name}
                                    onChange={(e) =>
                                        updateField("author_name", e.target.value)
                                    }
                                    placeholder="Aranora Team"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border rounded-xl p-6 bg-muted/10">
                            <Label>Cover Image</Label>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="relative h-32 w-48 rounded-lg border-2 border-dashed flex-shrink-0 flex items-center justify-center overflow-hidden bg-muted/30">
                                    {data.cover_image ? (
                                        <img src={data.cover_image} alt="Cover preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground opacity-50">
                                            <ImageIcon className="h-8 w-8 mb-2" />
                                            <span className="text-xs font-medium">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4 flex flex-col justify-center">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleImageUpload(file)
                                            }}
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            {isUploading ? "Uploading..." : "Upload Image"}
                                        </Button>
                                        {data.cover_image && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => updateField("cover_image", "")}
                                                disabled={isUploading}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-normal">Or paste an image URL:</Label>
                                        <Input
                                            value={data.cover_image}
                                            onChange={(e) => updateField("cover_image", e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEO */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h3 className="font-semibold">SEO & Tags</h3>
                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Input
                                value={data.meta_description}
                                onChange={(e) =>
                                    updateField("meta_description", e.target.value)
                                }
                                placeholder="Brief description for search engines (150-160 characters)..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tags (comma separated)</Label>
                            <Input
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="freelancing, invoicing, tips"
                            />
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h3 className="font-semibold">Content (HTML)</h3>
                        <textarea
                            value={data.content}
                            onChange={(e) => updateField("content", e.target.value)}
                            className="w-full min-h-[500px] p-4 rounded-lg border bg-background font-mono text-sm resize-y"
                            placeholder="<h2>Introduction</h2><p>Your article content here...</p>"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use HTML tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;,
                            &lt;li&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;strong&gt;,
                            &lt;em&gt;, &lt;blockquote&gt;
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
