'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Save, X, Upload, User, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '@/app/(admin)/admin/settings/testimonial-actions'

export function TestimonialsManager() {
    const [testimonials, setTestimonials] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState<string | null>(null)
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        loadTestimonials()
    }, [])

    async function loadTestimonials() {
        setIsLoading(true)
        const data = await getTestimonials()
        setTestimonials(data)
        setIsLoading(false)
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
            toast.success('Testimonial added')
            setTestimonials([data, ...testimonials])
            setNewTestimonial({ name: '', service: '', content: '', avatar_url: '', rating: 5, display_location: 'home' })
            setShowAddForm(false)
        }
    }

    async function handleUpdate(id: string, updates: any) {
        const { data, error } = await updateTestimonial(id, updates)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Testimonial updated')
            setTestimonials(testimonials.map(t => t.id === id ? data : t))
            setIsEditing(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this testimonial?')) return

        const { error } = await deleteTestimonial(id)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Testimonial deleted')
            setTestimonials(testimonials.filter(t => t.id !== id))
        }
    }

    async function handleImageUpload(file: File, isNew: boolean, id?: string) {
        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `testimonial-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName)

            if (isNew) {
                setNewTestimonial({ ...newTestimonial, avatar_url: publicUrl })
            } else if (id) {
                handleUpdate(id, { avatar_url: publicUrl })
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Customer Testimonials</h3>
                    <p className="text-sm text-muted-foreground">Manage reviews and feedback from your clients</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "default"} className="gap-2">
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add Testimonial"}
                </Button>
            </div>

            {showAddForm && (
                <div className="p-6 rounded-xl border bg-card/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4 text-left font-semibold">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={newTestimonial.name}
                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                                    placeholder="e.g. Sarah Chen"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Service / Job Title</Label>
                                <Input
                                    value={newTestimonial.service}
                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, service: e.target.value })}
                                    placeholder="e.g. UI/UX Designer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rating (1-5)</Label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                                            className={`transition-colors ${newTestimonial.rating >= star ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                        >
                                            <Star className="h-5 w-5 fill-current" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 text-left font-semibold">
                            <Label>Personal Photo</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                                    {newTestimonial.avatar_url ? (
                                        <img src={newTestimonial.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-muted-foreground/50" />
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
                                        {isUploading ? "Uploading..." : "Upload Photo"}
                                    </Button>
                                    {newTestimonial.avatar_url && (
                                        <Button variant="ghost" size="sm" onClick={() => setNewTestimonial({ ...newTestimonial, avatar_url: '' })} className="text-destructive h-8 px-2">
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-left font-semibold">
                        <Label>Testimonial Content</Label>
                        <Textarea
                            value={newTestimonial.content}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                            placeholder="What did the client say about your service?"
                            rows={4}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAdd} disabled={isUploading}>Add Testimonial</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div key={t.id} className="group relative p-6 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(t.id)} className="h-8 w-8 text-primary">
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-yellow-500">
                            {Array.from({ length: t.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                        </div>

                        <p className="text-sm text-foreground/80 italic mb-6 leading-relaxed">
                            "{t.content}"
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                                {t.avatar_url ? (
                                    <img src={t.avatar_url} alt={t.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary uppercase font-bold text-xs">
                                        {t.name.substring(0, 2)}
                                    </div>
                                )}
                            </div>
                            <div className="text-left">
                                <h4 className="font-semibold text-sm">{t.name}</h4>
                                <p className="text-xs text-muted-foreground">{t.service}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {!isLoading && testimonials.length === 0 && !showAddForm && (
                    <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed border-muted">
                        <p className="text-muted-foreground">No testimonials yet. Click "Add Testimonial" to create your first one.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
