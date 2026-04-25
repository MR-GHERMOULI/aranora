'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getFooterLinks } from '@/app/(admin)/admin/settings/footer-actions'
import { createClient } from '@/lib/supabase/client'
import { Twitter, Linkedin } from 'lucide-react'

interface FooterProps {
    simple?: boolean
}

export function Footer({ simple = false }: FooterProps) {
    const [links, setLinks] = useState<any[]>([])
    const [tagline, setTagline] = useState("The all-in-one platform for freelancers.")
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [primaryColor, setPrimaryColor] = useState("#1E3A5F")
    const [siteName, setSiteName] = useState("Aranora")
    const [socialLinks, setSocialLinks] = useState({
        twitter: "",
        linkedin: ""
    })
    const [developerCredit, setDeveloperCredit] = useState({
        text: "",
        url: ""
    })

    useEffect(() => {
        const fetchFooterData = async () => {
            const supabase = createClient()
            
            // Fetch links
            const linksData = await getFooterLinks()
            setLinks(linksData.filter((l: any) => l.is_active))

            // Fetch Homepage Settings (Tagline, Socials, Developer)
            const { data: homepageSetting } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "homepage")
                .single()
            
            if (homepageSetting?.value) {
                if (homepageSetting.value.footer_tagline) {
                    setTagline(homepageSetting.value.footer_tagline)
                }
                setSocialLinks({
                    twitter: homepageSetting.value.twitter_url || "",
                    linkedin: homepageSetting.value.linkedin_url || ""
                })
                setDeveloperCredit({
                    text: homepageSetting.value.developer_text || "",
                    url: homepageSetting.value.developer_url || ""
                })
            }

            // Fetch Branding Settings (Logo, Site Name)
            const { data: brandingSetting } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single()
            if (brandingSetting?.value?.logo_url) {
                setLogoUrl(brandingSetting.value.logo_url)
            }
            if (brandingSetting?.value?.primary_color) {
                setPrimaryColor(brandingSetting.value.primary_color)
            }
            if (brandingSetting?.value?.site_name) {
                setSiteName(brandingSetting.value.site_name)
            }
        }
        fetchFooterData()
    }, [])

    const Logo = () => (
        <div className="flex items-center gap-2 mb-4 transition-transform hover:scale-105 active:scale-95 origin-left">
            <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                )}
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>{siteName}</span>
        </div>
    )

    if (simple) {
        return (
            <footer className="border-t border-border py-8 mt-auto bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/" className="hover:opacity-80 transition-opacity">
                            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                        </Link>
                        {links.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline text-border">|</span>
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
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30 mt-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <Link href="/">
                            <Logo />
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mb-6">
                            {tagline}
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.twitter && (
                                <a 
                                    href={socialLinks.twitter} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-brand-primary hover:border-brand-primary transition-all duration-300"
                                >
                                    <Twitter className="h-4 w-4" />
                                </a>
                            )}
                            {socialLinks.linkedin && (
                                <a 
                                    href={socialLinks.linkedin} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-brand-primary hover:border-brand-primary transition-all duration-300"
                                >
                                    <Linkedin className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-brand-primary transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-brand-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/blog" className="hover:text-brand-primary transition-colors">Blog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-brand-primary transition-colors">About</Link></li>
                            <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Contact</Link></li>
                            <li><Link href="/become-affiliate" className="hover:text-brand-primary transition-colors text-teal-600 dark:text-teal-400 font-medium">Affiliates</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/refund" className="hover:text-brand-primary transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                            {developerCredit.text && (
                                <>
                                    <span className="hidden md:inline text-border">|</span>
                                    {developerCredit.url ? (
                                        <a 
                                            href={developerCredit.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-brand-primary transition-colors font-medium"
                                        >
                                            {developerCredit.text}
                                        </a>
                                    ) : (
                                        <span>{developerCredit.text}</span>
                                    )}
                                </>
                            )}
                        </div>
                        {links.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline text-border">|</span>
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

