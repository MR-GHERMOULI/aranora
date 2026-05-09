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
            const newFiles = Array.from(e.target.files)
            setPhotos(prev => {
                const combined = [...prev, ...newFiles]
                if (combined.length > 10) {
                    toast.error("You can only upload a maximum of 10 photos.")
                    return combined.slice(0, 10)
                }
                return combined
            })
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {isSuccess ? (
                            <div className="p-12 text-center space-y-6 overflow-y-auto">
                                <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/30">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Thank You!</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Your feedback has been collected and sent to our team.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Share Your Feedback</h2>
                                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                
                                <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Your Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Enter your name"
                                                required
                                                className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="comment" className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Comment & Remarks</Label>
                                            <Textarea
                                                id="comment"
                                                name="comment"
                                                placeholder="Write your feedback here..."
                                                required
                                                className="min-h-[120px] rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white resize-none"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Upload Photos (Optional)</Label>
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
                                                    className="flex flex-col items-center justify-center w-full h-28 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
                                                >
                                                    <Camera className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 mb-2 transition-colors" />
                                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {photos.length > 0 ? `${photos.length} photos selected` : "Click to upload images"}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-14 sm:h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <span className="flex items-center gap-3">
                                                        Submit Feedback <Send className="h-5 w-5" />
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
