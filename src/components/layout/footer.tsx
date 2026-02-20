'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getFooterLinks } from '@/app/(admin)/admin/settings/footer-actions'

interface FooterProps {
    simple?: boolean
}

export function Footer({ simple = false }: FooterProps) {
    const [links, setLinks] = useState<any[]>([])

    useEffect(() => {
        const fetchLinks = async () => {
            const data = await getFooterLinks()
            setLinks(data.filter(l => l.is_active))
        }
        fetchLinks()
    }, [])

    if (simple) {
        return (
            <footer className="border-t py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <p>© {new Date().getFullYear()} Aranora. All rights reserved.</p>
                        {links.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline text-slate-300">|</span>
                                {links.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:underline font-medium"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        )
    }

    return (
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-slate-50 mt-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-brand-primary">Aranora</span>
                        </div>
                        <p className="text-sm text-slate-500">The all-in-one platform for freelancers.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><a href="#features" className="hover:text-brand-primary">Features</a></li>
                            <li><a href="#pricing" className="hover:text-brand-primary">Pricing</a></li>
                            <li><a href="#" className="hover:text-brand-primary">Integrations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/about" className="hover:text-brand-primary">About</Link></li>
                            <li><Link href="/contact" className="hover:text-brand-primary">Contact</Link></li>
                            <li><a href="#" className="hover:text-brand-primary">Careers</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/privacy" className="hover:text-brand-primary">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-brand-primary">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <p>© {new Date().getFullYear()} Aranora. All rights reserved.</p>
                        {links.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline text-slate-300">|</span>
                                {links.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:underline font-medium"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    )
}
