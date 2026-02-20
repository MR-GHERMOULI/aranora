'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Save, X, Upload, ExternalLink, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getPlatformLinks, createPlatformLink, updatePlatformLink, deletePlatformLink } from '@/app/(admin)/admin/settings/platform-actions'

export function PlatformLinksManager() {
    const [platforms, setPlatforms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newPlatform, setNewPlatform] = useState({
        name: '',
        url: '',
        logo_url: '',
        display_order: 0
    })
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        loadPlatforms()
    }, [])

    async function loadPlatforms() {
        setIsLoading(true)
        const data = await getPlatformLinks()
        setPlatforms(data)
        setIsLoading(false)
    }

    async function handleAdd() {
        if (!newPlatform.name || !newPlatform.url) {
            toast.error('Name and URL are required')
            return
        }

        const { data, error } = await createPlatformLink(newPlatform)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Platform link added')
            setPlatforms([...platforms, data])
            setNewPlatform({ name: '', url: '', logo_url: '', display_order: platforms.length + 1 })
            setShowAddForm(false)
        }
    }

    async function handleUpdate(id: string, updates: any) {
        const { data, error } = await updatePlatformLink(id, updates)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Platform updated')
            setPlatforms(platforms.map(p => p.id === id ? data : p))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this platform link?')) return

        const { error } = await deletePlatformLink(id)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Platform deleted')
            setPlatforms(platforms.filter(p => p.id !== id))
        }
    }

    async function handleImageUpload(file: File, isNew: boolean, id?: string) {
        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `platform-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName)

            if (isNew) {
                setNewPlatform({ ...newPlatform, logo_url: publicUrl })
            } else if (id) {
                handleUpdate(id, { logo_url: publicUrl })
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload logo')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Freelance Platforms</h3>
                    <p className="text-sm text-muted-foreground">Manage links to external platforms like Upwork, Fiverr, etc.</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "default"} className="gap-2">
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add Platform"}
                </Button>
            </div>

            {showAddForm && (
                <div className="p-6 rounded-xl border bg-card/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4 font-semibold">
                            <div className="space-y-2">
                                <Label>Platform Name</Label>
                                <Input
                                    value={newPlatform.name}
                                    onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                                    placeholder="e.g. Upwork"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Profile URL</Label>
                                <Input
                                    value={newPlatform.url}
                                    onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                                    placeholder="https://upwork.com/freelancers/..."
                                />
                            </div>
                        </div>
                        <div className="space-y-4 font-semibold">
                            <Label>Platform Logo</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30 p-2">
                                    {newPlatform.logo_url ? (
                                        <img src={newPlatform.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground text-center">No Logo</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(file, true)
                                        }}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
                                        <Upload className="h-4 w-4" />
                                        {isUploading ? "Uploading..." : "Upload Logo"}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Recommended: Transparent PNG or SVG logo</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAdd} disabled={isUploading}>Save Platform</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {platforms.map((p) => (
                    <div key={p.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-20 flex items-center justify-center bg-muted/30 rounded p-1.5">
                                {p.logo_url ? (
                                    <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                                ) : (
                                    <span className="text-[10px] font-bold opacity-50">{p.name}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{p.name}</h4>
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                    Visit Profile <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {!isLoading && platforms.length === 0 && !showAddForm && (
                    <div className="py-12 text-center rounded-2xl border-2 border-dashed border-muted">
                        <p className="text-muted-foreground">No platform links added yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
