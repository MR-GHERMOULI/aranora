'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Save, X, Upload, User, Star, Eye, EyeOff, MessageSquareQuote, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '@/app/(admin)/admin/settings/testimonial-actions'

interface Testimonial {
    id: string
    name: string
    service: string
    content: string
    avatar_url: string
    rating: number
    display_location: string
    is_active: boolean
    created_at: string
}

export function TestimonialsManager() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<Testimonial>>({})
    const [newTestimonial, setNewTestimonial] = useState({
        name: '',
        service: '',
        content: '',
        avatar_url: '',
        rating: 5,
        display_location: 'home'
    })
    const [showAddForm, setShowAddForm] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const newAvatarRef = useRef<HTMLInputElement>(null)
    const editAvatarRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadTestimonials()
    }, [])

    async function loadTestimonials() {
        setIsLoading(true)
        const data = await getTestimonials()
        setTestimonials(data)
        setIsLoading(false)
    }

    async function handleImageUpload(file: File, target: 'new' | 'edit') {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'branding')
            formData.append('prefix', 'testimonial')

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Upload failed')
            }

            const { url: publicUrl } = await response.json()

            if (target === 'new') {
                setNewTestimonial({ ...newTestimonial, avatar_url: publicUrl })
            } else {
                setEditData({ ...editData, avatar_url: publicUrl })
            }
            toast.success('Photo uploaded successfully')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    async function handleAdd() {
        if (!newTestimonial.name || !newTestimonial.content) {
            toast.error('Name and content are required')
            return
        }

        const { data, error } = await createTestimonial(newTestimonial)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Testimonial added successfully')
            setTestimonials([data, ...testimonials])
            setNewTestimonial({ name: '', service: '', content: '', avatar_url: '', rating: 5, display_location: 'home' })
            setShowAddForm(false)
        }
    }

    function startEdit(t: Testimonial) {
        setEditingId(t.id)
        setEditData({
            name: t.name,
            service: t.service,
            content: t.content,
            avatar_url: t.avatar_url,
            rating: t.rating,
        })
    }

    async function handleSaveEdit(id: string) {
        if (!editData.name || !editData.content) {
            toast.error('Name and content are required')
            return
        }
        const { data, error } = await updateTestimonial(id, editData)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Testimonial updated')
            setTestimonials(testimonials.map(t => t.id === id ? data : t))
            setEditingId(null)
            setEditData({})
        }
    }

    async function handleToggleActive(t: Testimonial) {
        const newActive = !t.is_active
        const { data, error } = await updateTestimonial(t.id, { is_active: newActive })
        if (error) {
            toast.error(error)
        } else {
            toast.success(newActive ? 'Testimonial is now visible' : 'Testimonial hidden from public')
            setTestimonials(testimonials.map(item => item.id === t.id ? data : item))
        }
    }

    async function handleDelete(id: string) {
        const { error } = await deleteTestimonial(id)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Testimonial deleted')
            setTestimonials(testimonials.filter(t => t.id !== id))
            setDeleteConfirmId(null)
        }
    }

    function renderStarPicker(currentRating: number, onChange: (r: number) => void) {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`transition-all duration-200 hover:scale-125 ${currentRating >= star ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-400'}`}
                    >
                        <Star className="h-5 w-5 fill-current" />
                    </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">{currentRating}/5</span>
            </div>
        )
    }

    function renderAvatarUpload(
        avatarUrl: string,
        ref: React.RefObject<HTMLInputElement | null>,
        onFileChange: (file: File) => void,
        onRemove: () => void
    ) {
        return (
            <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-8 w-8 text-muted-foreground/40" />
                    )}
                </div>
                <div className="space-y-2">
                    <input
                        type="file"
                        className="hidden"
                        ref={ref}
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) onFileChange(file)
                        }}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => ref.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {avatarUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={onRemove}
                            className="text-destructive h-7 px-2 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-2xl border bg-muted/30 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquareQuote className="h-5 w-5 text-primary" />
                        Customer Testimonials
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Manage reviews displayed on your landing page
                        <span className="inline-flex items-center gap-1 ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                            {testimonials.filter(t => t.is_active).length} active
                            {testimonials.filter(t => !t.is_active).length > 0 && (
                                <span className="text-muted-foreground/60"> · {testimonials.filter(t => !t.is_active).length} hidden</span>
                            )}
                        </span>
                    </p>
                </div>
                <Button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingId(null) }}
                    variant={showAddForm ? "outline" : "default"}
                    className="gap-2"
                >
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add Testimonial"}
                </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/[0.02] space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-semibold">New Testimonial</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    value={newTestimonial.name}
                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                                    placeholder="e.g. Sarah Chen"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Service / Job Title</Label>
                                <Input
                                    value={newTestimonial.service}
                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, service: e.target.value })}
                                    placeholder="e.g. UI/UX Designer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Rating</Label>
                                {renderStarPicker(newTestimonial.rating, (r) => setNewTestimonial({ ...newTestimonial, rating: r }))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Photo</Label>
                                {renderAvatarUpload(
                                    newTestimonial.avatar_url,
                                    newAvatarRef,
                                    (file) => handleImageUpload(file, 'new'),
                                    () => setNewTestimonial({ ...newTestimonial, avatar_url: '' })
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Testimonial Content <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            value={newTestimonial.content}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                            placeholder="What did the client say about your service?"
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {newTestimonial.content.length} characters
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={isUploading} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Testimonial
                        </Button>
                    </div>
                </div>
            )}

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        className={`group relative rounded-2xl border transition-all duration-300 ${
                            !t.is_active ? 'opacity-60 border-dashed' : 'hover:shadow-xl'
                        } ${editingId === t.id ? 'border-primary/40 shadow-lg ring-1 ring-primary/10' : 'bg-card'}`}
                    >
                        {editingId === t.id ? (
                            /* ── Inline Edit Mode ── */
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Editing</span>
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(null); setEditData({}) }} className="h-7 w-7">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Full Name</Label>
                                    <Input
                                        value={editData.name || ''}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Service / Title</Label>
                                    <Input
                                        value={editData.service || ''}
                                        onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Rating</Label>
                                    {renderStarPicker(editData.rating || 5, (r) => setEditData({ ...editData, rating: r }))}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Photo</Label>
                                    {renderAvatarUpload(
                                        editData.avatar_url || '',
                                        editAvatarRef,
                                        (file) => handleImageUpload(file, 'edit'),
                                        () => setEditData({ ...editData, avatar_url: '' })
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Content</Label>
                                    <Textarea
                                        value={editData.content || ''}
                                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                        rows={3}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditData({}) }}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleSaveEdit(t.id)} className="gap-1.5">
                                        <Save className="h-3.5 w-3.5" /> Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* ── View Mode ── */
                            <div className="p-6">
                                {/* Action buttons */}
                                <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggleActive(t)}
                                        className="h-8 w-8"
                                        title={t.is_active ? 'Hide from public' : 'Show on public'}
                                    >
                                        {t.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)} className="h-8 w-8 text-primary">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    {deleteConfirmId === t.id ? (
                                        <div className="flex items-center gap-1 bg-destructive/10 rounded-lg px-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(t.id)}
                                                className="h-7 w-7 text-destructive hover:bg-destructive/20"
                                                title="Confirm delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="h-7 w-7"
                                                title="Cancel"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteConfirmId(t.id)}
                                            className="h-8 w-8 text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Status badge */}
                                {!t.is_active && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Hidden
                                        </span>
                                    </div>
                                )}

                                {/* Stars */}
                                <div className="flex items-center gap-1 mb-4 text-yellow-500">
                                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-current" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-sm text-foreground/80 italic mb-6 leading-relaxed line-clamp-4">
                                    &ldquo;{t.content}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                                        {t.avatar_url ? (
                                            <img src={t.avatar_url} alt={t.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary uppercase font-bold text-xs">
                                                {t.name.substring(0, 2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <h4 className="font-semibold text-sm truncate">{t.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{t.service}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {testimonials.length === 0 && !showAddForm && (
                    <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed border-muted bg-muted/10">
                        <MessageSquareQuote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h4 className="font-semibold text-foreground mb-1">No testimonials yet</h4>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                            Add customer reviews and feedback to build trust on your landing page.
                        </p>
                        <Button onClick={() => setShowAddForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Your First Testimonial
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
