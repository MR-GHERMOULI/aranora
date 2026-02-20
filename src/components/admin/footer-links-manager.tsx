'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getFooterLinks, createFooterLink, updateFooterLink, deleteFooterLink } from '@/app/(admin)/admin/settings/footer-actions'

export function FooterLinksManager() {
    const [links, setLinks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newLink, setNewLink] = useState({
        label: '',
        url: '',
        display_order: 0
    })

    useEffect(() => {
        loadLinks()
    }, [])

    async function loadLinks() {
        setIsLoading(true)
        const data = await getFooterLinks()
        setLinks(data)
        setIsLoading(false)
    }

    async function handleAdd() {
        if (!newLink.label || !newLink.url) {
            toast.error('Label and URL are required')
            return
        }

        const { data, error } = await createFooterLink(newLink)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Footer link added')
            setLinks([...links, data])
            setNewLink({ label: '', url: '', display_order: links.length + 1 })
            setShowAddForm(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this footer link?')) return

        const { error } = await deleteFooterLink(id)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Footer link deleted')
            setLinks(links.filter(l => l.id !== id))
        }
    }

    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Footer Links</h3>
                    <p className="text-sm text-muted-foreground">Manage small links displayed next to the copyright info</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "default"} className="gap-2">
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add Link"}
                </Button>
            </div>

            {showAddForm && (
                <div className="p-6 rounded-xl border bg-card/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 font-semibold text-left">
                            <Label>Link Label (e.g. Help Center)</Label>
                            <Input
                                value={newLink.label}
                                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                placeholder="Enter link text"
                            />
                        </div>
                        <div className="space-y-2 font-semibold text-left">
                            <Label>Target URL</Label>
                            <Input
                                value={newLink.url}
                                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Save Footer Link</Button>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {links.map((link) => (
                    <div key={link.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center bg-muted/50 rounded-lg">
                                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{link.label}</h4>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                    {link.url} <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)} className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {!isLoading && links.length === 0 && !showAddForm && (
                    <div className="py-12 text-center rounded-2xl border-2 border-dashed border-muted">
                        <p className="text-muted-foreground">No footer links added yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
