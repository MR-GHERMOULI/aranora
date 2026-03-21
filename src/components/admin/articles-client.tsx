"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Globe,
    FileText,
    Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Article {
    id: string
    title: string
    slug: string
    excerpt: string
    status: string
    tags: string[]
    author_name: string
    published_at: string | null
    created_at: string
    updated_at: string
}

interface ArticlesClientProps {
    initialArticles: Article[]
}

export function ArticlesClient({ initialArticles }: ArticlesClientProps) {
    const [search, setSearch] = useState("")
    const [deleteDialog, setDeleteDialog] = useState<Article | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const filtered = initialArticles.filter(
        (a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.slug.toLowerCase().includes(search.toLowerCase())
    )

    const published = initialArticles.filter((a) => a.status === "published")
    const drafts = initialArticles.filter((a) => a.status === "draft")

    async function handleDelete() {
        if (!deleteDialog) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/articles/${deleteDialog.id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete")
            toast.success("Article deleted successfully")
            setDeleteDialog(null)
            router.refresh()
        } catch {
            toast.error("Failed to delete article")
        } finally {
            setIsDeleting(false)
        }
    }

    async function toggleStatus(article: Article) {
        const newStatus = article.status === "published" ? "draft" : "published"
        try {
            const res = await fetch(`/api/admin/articles/${article.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) throw new Error("Failed to update")
            toast.success(
                newStatus === "published" ? "Article published!" : "Article reverted to draft"
            )
            router.refresh()
        } catch {
            toast.error("Failed to update article status")
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{initialArticles.length}</p>
                            <p className="text-sm text-muted-foreground">Total Articles</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{published.length}</p>
                            <p className="text-sm text-muted-foreground">Published</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{drafts.length}</p>
                            <p className="text-sm text-muted-foreground">Drafts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search + New */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Link href="/admin/articles/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> New Article
                    </Button>
                </Link>
            </div>

            {/* Articles List */}
            <div className="rounded-xl border bg-card">
                <div className="p-4 border-b bg-muted/30">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-5">Title</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Author</div>
                        <div className="col-span-2 text-right">Date</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                </div>
                <div className="divide-y">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            {search ? "No articles match your search" : "No articles yet. Create your first article!"}
                        </div>
                    ) : (
                        filtered.map((article) => (
                            <div
                                key={article.id}
                                className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/10 transition-colors"
                            >
                                <div className="col-span-5">
                                    <p className="font-medium truncate">{article.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        /blog/{article.slug}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    {article.status === "published" ? (
                                        <Badge className="bg-green-500/10 text-green-600">
                                            Published
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Draft</Badge>
                                    )}
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground truncate">
                                    {article.author_name}
                                </div>
                                <div className="col-span-2 text-right text-sm text-muted-foreground">
                                    {new Date(
                                        article.published_at || article.created_at
                                    ).toLocaleDateString("en-US")}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px]">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/articles/${article.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            {article.status === "published" && (
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/blog/${article.slug}`}
                                                        target="_blank"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Live
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => toggleStatus(article)}
                                            >
                                                <Globe className="mr-2 h-4 w-4" />
                                                {article.status === "published"
                                                    ? "Unpublish"
                                                    : "Publish"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setDeleteDialog(article)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog
                open={!!deleteDialog}
                onOpenChange={(open) => !open && setDeleteDialog(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Article?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete{" "}
                        <strong>&quot;{deleteDialog?.title}&quot;</strong>. This action cannot
                        be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
