'use client'

import { useEffect, useState } from 'react'

interface Testimonial {
    name: string
    role: string
    quote: string
    avatar: string
    avatarUrl?: string
    rating: number
}

export default function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
    const [current, setCurrent] = useState(0)
    const [animating, setAnimating] = useState(false)

    useEffect(() => {
        if (testimonials.length <= 1) return
        const interval = setInterval(() => {
            setAnimating(true)
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % testimonials.length)
                setAnimating(false)
            }, 400)
        }, 5000)
        return () => clearInterval(interval)
    }, [testimonials.length])

    const t = testimonials[current]
    if (!t) return null

    return (
        <div className="p-5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
            {/* Stars */}
            <div className="flex gap-1 mb-3">
                {[...Array(t.rating || 5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-[#4ADE80]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>

            {/* Quote — fades in/out */}
            <blockquote
                className="text-sm text-white/80 leading-relaxed mb-4 italic min-h-[60px] transition-opacity duration-400"
                style={{ opacity: animating ? 0 : 1 }}
            >
                &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div
                className="flex items-center gap-3 transition-opacity duration-400"
                style={{ opacity: animating ? 0 : 1 }}
            >
                {t.avatarUrl ? (
                    <img
                        src={t.avatarUrl}
                        alt={t.name}
                        className="h-9 w-9 rounded-full object-cover border border-white/20"
                    />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-[#0F2642] font-bold text-xs flex-shrink-0">
                        {t.avatar}
                    </div>
                )}
                <div>
                    <p className="text-sm font-semibold text-white/90">{t.name}</p>
                    <p className="text-xs text-white/45">{t.role}</p>
                </div>

                {/* Dot indicators */}
                {testimonials.length > 1 && (
                    <div className="flex gap-1.5 ml-auto">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setAnimating(true)
                                    setTimeout(() => { setCurrent(i); setAnimating(false) }, 400)
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-[#4ADE80] w-4' : 'bg-white/30 hover:bg-white/50'}`}
                                aria-label={`Testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
