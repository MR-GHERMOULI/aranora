"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Camera, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { submitFeedback } from "@/app/actions/feedback"

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    projectId?: string
}

export function FeedbackModal({ isOpen, onClose, projectId }: FeedbackModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [photos, setPhotos] = useState<File[]>([])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        if (projectId) formData.append("projectId", projectId)
        
        photos.forEach(photo => {
            formData.append("photos", photo)
        })

        try {
            const result = await submitFeedback(formData)
            if (result.success) {
                setIsSuccess(true)
                toast.success("Feedback submitted successfully!")
                setTimeout(() => {
                    onClose()
                    setIsSuccess(false)
                }, 2000)
            } else {
                toast.error(result.error || "Failed to submit feedback")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl glass border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {isSuccess ? (
                            <div className="p-12 text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/30">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-2">Thank You!</h3>
                                    <p className="text-slate-400">Your feedback has been collected and sent to our team.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <h2 className="text-2xl font-black text-white tracking-tight">Share Your Feedback</h2>
                                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-[#10b981]">Your Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Enter your name"
                                            required
                                            className="h-14 rounded-2xl glass border-white/10 focus:ring-[#10b981]/50 text-white"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="comment" className="text-[11px] font-black uppercase tracking-widest text-[#10b981]">Comment & Remarks</Label>
                                        <Textarea
                                            id="comment"
                                            name="comment"
                                            placeholder="Write your feedback here..."
                                            required
                                            className="min-h-[150px] rounded-2xl glass border-white/10 focus:ring-[#10b981]/50 text-white resize-none"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-[#10b981]">Upload Photos (Optional)</Label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                                id="photo-upload"
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className="flex flex-col items-center justify-center w-full h-32 rounded-2xl glass border-2 border-dashed border-white/10 hover:border-[#10b981]/50 transition-all cursor-pointer group"
                                            >
                                                <Camera className="h-8 w-8 text-slate-500 group-hover:text-[#10b981] mb-2" />
                                                <span className="text-sm font-bold text-slate-500 group-hover:text-slate-300">
                                                    {photos.length > 0 ? `${photos.length} photos selected` : "Click to upload images"}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 rounded-2xl bg-[#10b981] hover:bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-3">
                                                Submit Feedback <Send className="h-5 w-5" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
