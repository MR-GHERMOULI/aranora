"use client"

import { useState, useRef, useCallback } from "react"
import { Save, Shield, Sliders, Bell, ToggleLeft, Users, Palette, Home, Upload, X, Image as ImageIcon, Quote, Globe, Link as LinkIcon, DollarSign, Plus, Trash2, ChevronDown, ChevronUp, Eye, Type, ArrowUp, ArrowDown, Sparkles, MessageSquareQuote, CheckCircle2, Twitter, Linkedin, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { TestimonialsManager } from "@/components/admin/testimonials-manager"
import { PlatformLinksManager } from "@/components/admin/platform-links-manager"
import { FooterLinksManager } from "@/components/admin/footer-links-manager"

interface SettingsClientProps {
    initialSettings: {
        branding: {
            logo_url: string | null
            favicon_url: string | null
            primary_color: string
            secondary_color: string
            font_family: string
        }
        features: {
            contracts_enabled: boolean
            partnerships_enabled: boolean
            team_enabled: boolean
        }
        limits: {
            max_clients_per_user: number | null
            max_projects_per_user: number | null
        }
        notifications: {
            notify_new_user: boolean
            notify_new_project: boolean
        }
        homepage: {
            hero_title: string
            hero_subtitle: string
            hero_cta_text: string
            hero_badge_text: string
            hero_microcopy: string
            nav_cta_text: string
            features_title: string
            features_subtitle: string
            how_it_works_title: string
            how_it_works_subtitle: string
            how_it_works_steps: { title: string; desc: string }[]
            pricing_title: string
            pricing_subtitle: string
            testimonials_title: string
            testimonials_subtitle: string
            affiliate_title: string
            affiliate_subtitle: string
            affiliate_commission_rate: string
            affiliate_monthly_earning: string
            affiliate_annual_earning: string
            affiliate_perks: { label: string; sub: string }[]
            cta_title: string
            cta_subtitle: string
            footer_tagline: string
            twitter_url: string
            linkedin_url: string
            developer_text: string
            developer_url: string
            stats_min_threshold: number
            features: { iconName: string; title: string; desc: string }[]
            pricing_features: string[]
        }
        pricing_page: {
            hero_title: string
            hero_subtitle: string
            monthly_price: number
            annual_price: number
            features: string[]
            faqs: { question: string; answer: string }[]
        }
    }
    adminCount: number
}

export function SettingsClient({ initialSettings, adminCount }: SettingsClientProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isSaving, setIsSaving] = useState(false)
    const [savedKey, setSavedKey] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ hero: true })
    const logoInputRef = useRef<HTMLInputElement>(null)
    const faviconInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const fontOptions = ["Inter", "Roboto", "Poppins", "Outfit", "Open Sans", "Lato", "Montserrat", "Nunito", "Raleway", "Source Sans Pro"]

    const toggleSection = useCallback((key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
    }, [])

    async function saveSettings(key: string, value: unknown) {
        setIsSaving(true)
        setSavedKey(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            await supabase
                .from("platform_settings")
                .upsert({
                    key,
                    value,
                    updated_by: user?.id,
                }, { onConflict: "key" })

            setSavedKey(key)
            setTimeout(() => setSavedKey(null), 2000)
        } catch (error) {
            console.error("Error saving settings:", error)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleImageUpload(file: File, type: 'logo' | 'favicon') {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'branding')
            formData.append('prefix', type)

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Upload failed')
            }

            const { url: publicUrl } = await response.json()

            if (type === 'logo') {
                setSettings({
                    ...settings,
                    branding: { ...settings.branding, logo_url: publicUrl }
                })
            } else {
                setSettings({
                    ...settings,
                    branding: { ...settings.branding, favicon_url: publicUrl }
                })
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload image. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    function Toggle({
        checked,
        onChange,
    }: {
        checked: boolean
        onChange: (checked: boolean) => void
    }) {
        return (
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        )
    }

    const CollapsibleSection = ({ 
        id, 
        title, 
        icon, 
        children 
    }: { 
        id: string, 
        title: string, 
        icon: React.ReactNode, 
        children: React.ReactNode 
    }) => {
        const isOpen = openSections[id]
        
        return (
            <div className={`border rounded-xl bg-card overflow-hidden transition-all duration-200 ${isOpen ? 'ring-1 ring-primary/20 shadow-sm' : 'hover:border-primary/30'}`}>
                <button
                    type="button"
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {icon}
                        </div>
                        <h4 className="font-semibold text-foreground text-left">{title}</h4>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                {isOpen && (
                    <div className="p-6 border-t animate-in slide-in-from-top-2 duration-200">
                        {children}
                        <div className="mt-6 pt-6 border-t flex justify-end">
                            <Button
                                onClick={() => saveSettings("homepage", settings.homepage)}
                                disabled={isSaving}
                                size="sm"
                                className="gap-2 shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                {savedKey === "homepage" ? "Saved!" : "Save Section"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }


    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure platform settings and preferences
                </p>
            </div>

            <Tabs defaultValue="branding" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 lg:w-full">
                    <TabsTrigger value="branding" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Branding
                    </TabsTrigger>
                    <TabsTrigger value="homepage" className="gap-2">
                        <Home className="h-4 w-4" />
                        Homepage
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                        <Sliders className="h-4 w-4" />
                        Features
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="gap-2">
                        <ToggleLeft className="h-4 w-4" />
                        Limits
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Alerts
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="testimonials" className="gap-2">
                        <Quote className="h-4 w-4" />
                        Testimonials
                    </TabsTrigger>
                    <TabsTrigger value="platforms" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Platforms
                    </TabsTrigger>
                    <TabsTrigger value="footer" className="gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Footer
                    </TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Brand Identity</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize your platform&apos;s visual identity
                            </p>
                        </div>

                        {/* Branding Controls Grid */}
                        <div className="grid gap-8 lg:grid-cols-5">
                            <div className="lg:col-span-3 space-y-6">
                                {/* Visual Assets */}
                                <div className="space-y-4 p-4 rounded-xl border bg-muted/10">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-primary" /> Visual Assets
                                    </h4>
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {/* Logo Upload */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Main Logo</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-white dark:bg-black/20 shrink-0">
                                                    {settings.branding.logo_url ? (
                                                        <img src={settings.branding.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                                    ) : (
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <input
                                                        ref={logoInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleImageUpload(file, 'logo')
                                                        }}
                                                    />
                                                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploading} className="h-8 gap-2 w-full justify-start">
                                                        <Upload className="h-3.5 w-3.5" /> Upload
                                                    </Button>
                                                    {settings.branding.logo_url && (
                                                        <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, branding: { ...settings.branding, logo_url: null } })} className="h-8 gap-2 w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <X className="h-3.5 w-3.5" /> Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Favicon Upload */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Favicon</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-white dark:bg-black/20 shrink-0">
                                                    {settings.branding.favicon_url ? (
                                                        <img src={settings.branding.favicon_url} alt="Favicon" className="h-full w-full object-contain p-1.5" />
                                                    ) : (
                                                        <Globe className="h-5 w-5 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <input
                                                        ref={faviconInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleImageUpload(file, 'favicon')
                                                        }}
                                                    />
                                                    <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()} disabled={isUploading} className="h-8 gap-2">
                                                        <Upload className="h-3.5 w-3.5" /> Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Colors & Typography */}
                                <div className="space-y-4 p-4 rounded-xl border bg-muted/10">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-primary" /> Colors & Typography
                                    </h4>
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Primary Theme Color</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="color" 
                                                    value={settings.branding.primary_color || '#1E3A5F'}
                                                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, primary_color: e.target.value }})}
                                                    className="w-12 h-10 p-1 cursor-pointer rounded-md"
                                                />
                                                <Input 
                                                    type="text" 
                                                    value={settings.branding.primary_color || '#1E3A5F'}
                                                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, primary_color: e.target.value }})}
                                                    className="font-mono text-sm uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Secondary Accent Color</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="color" 
                                                    value={settings.branding.secondary_color || '#4ADE80'}
                                                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, secondary_color: e.target.value }})}
                                                    className="w-12 h-10 p-1 cursor-pointer rounded-md"
                                                />
                                                <Input 
                                                    type="text" 
                                                    value={settings.branding.secondary_color || '#4ADE80'}
                                                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, secondary_color: e.target.value }})}
                                                    className="font-mono text-sm uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Typography (Base Font)</Label>
                                            <div className="relative">
                                                <select
                                                    value={settings.branding.font_family || 'Inter'}
                                                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, font_family: e.target.value }})}
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background appearance-none pr-8"
                                                >
                                                    {fontOptions.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                                <Type className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Panel */}
                            <div className="lg:col-span-2">
                                <div className="sticky top-6 rounded-xl border bg-card overflow-hidden shadow-sm">
                                    <div className="bg-muted/50 p-3 border-b border-border/50 flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Live Preview</span>
                                        <div className="flex gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full bg-destructive/30" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/30" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/30" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white dark:bg-slate-950" style={{ fontFamily: settings.branding.font_family || 'Inter' }}>
                                        {/* Mock Navbar */}
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                                            <div className="flex items-center gap-2">
                                                {settings.branding.logo_url ? (
                                                    <img src={settings.branding.logo_url} alt="Logo" className="h-6 object-contain" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded bg-primary/20" style={{ backgroundColor: `${settings.branding.primary_color}30` }} />
                                                )}
                                                <span className="font-bold text-sm tracking-tight" style={{ color: settings.branding.primary_color }}>Aranora</span>
                                            </div>
                                            <div className="rounded px-3 py-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: settings.branding.primary_color }}>
                                                Get Started
                                            </div>
                                        </div>

                                        {/* Mock Hero Content */}
                                        <div className="space-y-4 text-center">
                                            <div className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${settings.branding.secondary_color}20`, color: settings.branding.secondary_color }}>
                                                New Features Available
                                            </div>
                                            <h2 className="text-xl font-bold leading-tight" style={{ color: settings.branding.primary_color }}>
                                                Manage Your Business Like a Pro
                                            </h2>
                                            <p className="text-xs text-muted-foreground px-4">
                                                The all-in-one platform built for freelancers.
                                            </p>
                                            
                                            {/* Mock Button Details */}
                                            <div className="pt-4 flex justify-center gap-2">
                                                <div className="h-8 w-28 rounded-md bg-primary flex items-center justify-center shadow-lg" style={{ backgroundColor: settings.branding.primary_color, boxShadow: `0 4px 14px 0 ${settings.branding.primary_color}40` }}>
                                                    <span className="text-[10px] text-white font-medium">Start Free Trial</span>
                                                </div>
                                                <div className="h-8 w-8 rounded-md border flex items-center justify-center">
                                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: settings.branding.secondary_color }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex items-center gap-4">
                            <Button
                                onClick={() => saveSettings("branding", settings.branding)}
                                disabled={isSaving}
                                className="gap-2"
                                size="lg"
                            >
                                <Save className="h-4 w-4" />
                                {savedKey === "branding" ? "Saved!" : "Save Branding Changes"}
                            </Button>
                            {savedKey === "branding" && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Changes published successfully.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Homepage Tab */}
                <TabsContent value="homepage">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Homepage Content</h3>
                            <p className="text-sm text-muted-foreground">
                                Edit the text content displayed on your landing page. All changes are reflected in real-time.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Hero Section */}
                            <CollapsibleSection id="hero" title="Hero Section" icon={<Home className="h-5 w-5" />}>
                                <div className="grid gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Badge Text</Label>
                                        <Input
                                            value={settings.homepage.hero_badge_text}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, hero_badge_text: e.target.value }})}
                                            placeholder="Built for Freelancers, by Freelancers"
                                            maxLength={50}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>The small pill badge shown above the main title</span>
                                            <span>{settings.homepage.hero_badge_text?.length || 0}/50</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Main Title</Label>
                                        <Input
                                            value={settings.homepage.hero_title}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, hero_title: e.target.value }})}
                                            placeholder="Your Freelance Business, Professionally Managed"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Subtitle</Label>
                                        <textarea
                                            value={settings.homepage.hero_subtitle}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, hero_subtitle: e.target.value }})}
                                            placeholder="All-in-one platform to manage clients, projects, invoices..."
                                            className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm resize-y focus:ring-2 focus:ring-ring focus:border-input"
                                            maxLength={160}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Appears below the main title</span>
                                            <span>{settings.homepage.hero_subtitle?.length || 0}/160</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2 bg-muted/20 p-4 rounded-lg">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Main CTA Button</Label>
                                            <Input
                                                value={settings.homepage.hero_cta_text}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, hero_cta_text: e.target.value }})}
                                                placeholder="Start Free — No Card Required"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Navbar CTA Button</Label>
                                            <Input
                                                value={settings.homepage.nav_cta_text}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, nav_cta_text: e.target.value }})}
                                                placeholder="Get Started Free"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Microcopy (Trust Indicators)</Label>
                                        <Input
                                            value={settings.homepage.hero_microcopy}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, hero_microcopy: e.target.value }})}
                                            placeholder="First month free • No credit card required • Cancel anytime"
                                        />
                                        <p className="text-xs text-muted-foreground">Small text shown directly below the CTA buttons</p>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Social Proof Section */}
                            <CollapsibleSection id="social_proof" title="Social Proof Analytics" icon={<Users className="h-5 w-5" />}>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Minimum User Threshold</Label>
                                        <div className="flex gap-4 items-center">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-32"
                                                value={settings.homepage.stats_min_threshold}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, stats_min_threshold: Number(e.target.value) }})}
                                            />
                                            <span className="text-sm text-muted-foreground">Active Users</span>
                                        </div>
                                        <div className="p-3 rounded-md bg-muted/40 border text-sm text-muted-foreground mt-2">
                                            <strong>How this works:</strong> When the total registered user count is below this number, the platform will show generic trust badges. Once the count exceeds this number, it will show real-time statistics to build trust. Set to <strong>0</strong> to always show real stats.
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Features Section */}
                            <CollapsibleSection id="features" title="Features Overview" icon={<Sparkles className="h-5 w-5" />}>
                                <div className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Title</Label>
                                            <Input
                                                value={settings.homepage.features_title}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, features_title: e.target.value }})}
                                                placeholder="Everything You Need to Succeed"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Subtitle</Label>
                                            <Input
                                                value={settings.homepage.features_subtitle}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, features_subtitle: e.target.value }})}
                                                placeholder="Powerful features designed for freelancers"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 bg-muted/10 p-4 rounded-xl border">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Feature Cards</Label>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {
                                                    const newFeatures = [...(settings.homepage.features || []), { iconName: 'Star', title: '', desc: '' }]
                                                    setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                }}
                                                className="h-8 gap-1.5"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Feature Card
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            { (settings.homepage.features || []).map((feature: any, idx: number) => (
                                                <div key={idx} className="p-4 border rounded-lg bg-background shadow-sm flex gap-4 items-start group">
                                                    <div className="flex-col gap-1 items-center hidden sm:flex pt-2">
                                                        <button 
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newFeatures = [...settings.homepage.features]
                                                                const temp = newFeatures[idx - 1]
                                                                newFeatures[idx - 1] = newFeatures[idx]
                                                                newFeatures[idx] = temp
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                        ><ArrowUp className="h-4 w-4" /></button>
                                                        <button 
                                                            disabled={idx === settings.homepage.features.length - 1}
                                                            onClick={() => {
                                                                const newFeatures = [...settings.homepage.features]
                                                                const temp = newFeatures[idx + 1]
                                                                newFeatures[idx + 1] = newFeatures[idx]
                                                                newFeatures[idx] = temp
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                        ><ArrowDown className="h-4 w-4" /></button>
                                                    </div>
                                                    <div className="flex-grow grid gap-3 md:grid-cols-[150px_1fr]">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Icon Name</Label>
                                                            <Input
                                                                value={feature.iconName}
                                                                onChange={(e) => {
                                                                    const newFeatures = [...settings.homepage.features]
                                                                    newFeatures[idx] = { ...newFeatures[idx], iconName: e.target.value }
                                                                    setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                                }}
                                                                placeholder="e.g. Users"
                                                                className="text-sm"
                                                            />
                                                            <span className="text-[10px] text-muted-foreground leading-tight block">Use Lucide React icon names. (e.g. Star, Zap, Users, Shield)</span>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Title</Label>
                                                                <Input
                                                                    value={feature.title}
                                                                    onChange={(e) => {
                                                                        const newFeatures = [...settings.homepage.features]
                                                                        newFeatures[idx] = { ...newFeatures[idx], title: e.target.value }
                                                                        setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                                    }}
                                                                    placeholder="e.g. Client Management"
                                                                    className="font-medium"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Description</Label>
                                                                <textarea
                                                                    value={feature.desc}
                                                                    onChange={(e) => {
                                                                        const newFeatures = [...settings.homepage.features]
                                                                        newFeatures[idx] = { ...newFeatures[idx], desc: e.target.value }
                                                                        setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                                    }}
                                                                    placeholder="Detailed description of the feature."
                                                                    className="w-full min-h-[60px] p-2 text-sm rounded-md border border-input bg-background resize-y"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-destructive shrink-0 mt-6"
                                                        onClick={() => {
                                                            const newFeatures = [...settings.homepage.features]
                                                            newFeatures.splice(idx, 1)
                                                            setSettings({ ...settings, homepage: { ...settings.homepage, features: newFeatures }})
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!settings.homepage.features || settings.homepage.features.length === 0) && (
                                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                    No features added yet. Add feature cards to showcase your product!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* How It Works Section */}
                            <CollapsibleSection id="how_it_works" title="How It Works" icon={<Sliders className="h-5 w-5" />}>
                                <div className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Title</Label>
                                            <Input
                                                value={settings.homepage.how_it_works_title}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_title: e.target.value }})}
                                                placeholder="Get Started in 3 Simple Steps"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Subtitle</Label>
                                            <Input
                                                value={settings.homepage.how_it_works_subtitle}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_subtitle: e.target.value }})}
                                                placeholder="Go from sign-up to managing your business in minutes."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 bg-muted/10 p-4 rounded-xl border">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Numbered Steps</Label>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {
                                                    const newSteps = [...(settings.homepage.how_it_works_steps || []), { title: '', desc: '' }]
                                                    setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                }}
                                                className="h-8 gap-1.5"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Step
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            { (settings.homepage.how_it_works_steps || []).map((step: any, idx: number) => (
                                                <div key={idx} className="p-4 border rounded-lg bg-background shadow-sm flex gap-4 items-start group">
                                                    <div className="flex-col gap-1 items-center hidden sm:flex pt-2">
                                                        <button 
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newSteps = [...settings.homepage.how_it_works_steps]
                                                                const temp = newSteps[idx - 1]
                                                                newSteps[idx - 1] = newSteps[idx]
                                                                newSteps[idx] = temp
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                        ><ArrowUp className="h-4 w-4" /></button>
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{idx + 1}</span>
                                                        <button 
                                                            disabled={idx === settings.homepage.how_it_works_steps.length - 1}
                                                            onClick={() => {
                                                                const newSteps = [...settings.homepage.how_it_works_steps]
                                                                const temp = newSteps[idx + 1]
                                                                newSteps[idx + 1] = newSteps[idx]
                                                                newSteps[idx] = temp
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                        ><ArrowDown className="h-4 w-4" /></button>
                                                    </div>
                                                    <div className="flex-grow grid gap-3">
                                                        <Input
                                                            value={step.title}
                                                            onChange={(e) => {
                                                                const newSteps = [...settings.homepage.how_it_works_steps]
                                                                newSteps[idx] = { ...newSteps[idx], title: e.target.value }
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                            }}
                                                            placeholder="e.g. Create your account"
                                                            className="font-medium"
                                                        />
                                                        <textarea
                                                            value={step.desc}
                                                            onChange={(e) => {
                                                                const newSteps = [...settings.homepage.how_it_works_steps]
                                                                newSteps[idx] = { ...newSteps[idx], desc: e.target.value }
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                            }}
                                                            placeholder="Detailed description of what happens in this step."
                                                            className="w-full min-h-[60px] p-3 text-sm rounded-md border border-input bg-background resize-y"
                                                        />
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                                                        onClick={() => {
                                                            const newSteps = [...settings.homepage.how_it_works_steps]
                                                            newSteps.splice(idx, 1)
                                                            setSettings({ ...settings, homepage: { ...settings.homepage, how_it_works_steps: newSteps }})
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!settings.homepage.how_it_works_steps || settings.homepage.how_it_works_steps.length === 0) && (
                                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                    No steps added yet. Add steps to explain your process to customers.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Pricing Section */}
                            <CollapsibleSection id="pricing" title="Pricing Summary" icon={<DollarSign className="h-5 w-5" />}>
                                <div className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Title</Label>
                                            <Input
                                                value={settings.homepage.pricing_title}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, pricing_title: e.target.value }})}
                                                placeholder="Simple, Transparent Pricing"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Subtitle</Label>
                                            <Input
                                                value={settings.homepage.pricing_subtitle}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, pricing_subtitle: e.target.value }})}
                                                placeholder="Start with your first month free."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 bg-muted/10 p-4 rounded-xl border">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Included Features Checklist</Label>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="gap-2"
                                                onClick={() => {
                                                    setSettings({
                                                        ...settings,
                                                        homepage: {
                                                            ...settings.homepage,
                                                            pricing_features: [...(settings.homepage.pricing_features || []), "New Feature Included"]
                                                        }
                                                    })
                                                }}
                                            >
                                                <Plus className="h-4 w-4" /> Add Item
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            { (settings.homepage.pricing_features || []).map((feature: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-secondary/15 flex items-center justify-center">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-secondary-dark dark:text-brand-secondary" />
                                                    </div>
                                                    <Input
                                                        value={feature}
                                                        onChange={(e) => {
                                                            const newFeatures = [...settings.homepage.pricing_features];
                                                            newFeatures[idx] = e.target.value;
                                                            setSettings({
                                                                ...settings,
                                                                homepage: { ...settings.homepage, pricing_features: newFeatures }
                                                            })
                                                        }}
                                                        className="font-medium"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            const newFeatures = settings.homepage.pricing_features.filter((_, i) => i !== idx);
                                                            setSettings({
                                                                ...settings,
                                                                homepage: { ...settings.homepage, pricing_features: newFeatures }
                                                            })
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!settings.homepage.pricing_features || settings.homepage.pricing_features.length === 0) && (
                                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                    No pricing features added yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Testimonials Section */}
                            <CollapsibleSection id="testimonials" title="Testimonials Header" icon={<MessageSquareQuote className="h-5 w-5" />}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Section Title</Label>
                                        <Input
                                            value={settings.homepage.testimonials_title}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, testimonials_title: e.target.value }})}
                                            placeholder="Loved by Freelancers"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Section Subtitle</Label>
                                        <Input
                                            value={settings.homepage.testimonials_subtitle}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, testimonials_subtitle: e.target.value }})}
                                            placeholder="See what our users have to say"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 p-4 border rounded-md bg-primary/5 text-sm flex gap-3 text-primary">
                                    <div className="shrink-0 mt-0.5"><MessageSquareQuote className="h-4 w-4" /></div>
                                    <p><strong>Note:</strong> To add or remove actual testimonial reviews, use the <em>Testimonials</em> tab at the top of the Settings dashboard.</p>
                                </div>
                            </CollapsibleSection>

                            {/* Affiliate Hub */}
                            <CollapsibleSection id="affiliate" title="Affiliate Hub" icon={<Users className="h-5 w-5" />}>
                                <div className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Title</Label>
                                            <Input
                                                value={settings.homepage.affiliate_title}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_title: e.target.value }})}
                                                placeholder="Earn by Spreading the Word"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Section Subtitle</Label>
                                            <Input
                                                value={settings.homepage.affiliate_subtitle}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_subtitle: e.target.value }})}
                                                placeholder="Join our affiliate program and earn"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-6 md:grid-cols-3 bg-muted/20 p-4 rounded-lg border">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Commission Rate Text</Label>
                                            <Input
                                                value={settings.homepage.affiliate_commission_rate}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_commission_rate: e.target.value }})}
                                                placeholder="30%"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Monthly Earning Example</Label>
                                            <Input
                                                value={settings.homepage.affiliate_monthly_earning}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_monthly_earning: e.target.value }})}
                                                placeholder="$5.70"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Annual Earning Example</Label>
                                            <Input
                                                value={settings.homepage.affiliate_annual_earning}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_annual_earning: e.target.value }})}
                                                placeholder="$57.00"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Affiliate Perks</Label>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {
                                                    const newPerks = [...(settings.homepage.affiliate_perks || []), { label: '', sub: '' }]
                                                    setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_perks: newPerks }})
                                                }}
                                                className="h-8 gap-1.5"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Perk
                                            </Button>
                                        </div>
                                        <div className="grid gap-3">
                                            { (settings.homepage.affiliate_perks || []).map((perk: any, idx: number) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <div className="grid grid-cols-2 gap-3 flex-grow bg-muted/10 p-2 rounded-lg border">
                                                        <Input
                                                            value={perk.label}
                                                            onChange={(e) => {
                                                                const newPerks = [...settings.homepage.affiliate_perks]
                                                                newPerks[idx] = { ...newPerks[idx], label: e.target.value }
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_perks: newPerks }})
                                                            }}
                                                            placeholder="Main Label (e.g. High Commission)"
                                                        />
                                                        <Input
                                                            value={perk.sub}
                                                            onChange={(e) => {
                                                                const newPerks = [...settings.homepage.affiliate_perks]
                                                                newPerks[idx] = { ...newPerks[idx], sub: e.target.value }
                                                                setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_perks: newPerks }})
                                                            }}
                                                            placeholder="Subtitle (e.g. 30% on all plans)"
                                                        />
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-destructive shrink-0"
                                                        onClick={() => {
                                                            const newPerks = [...settings.homepage.affiliate_perks]
                                                            newPerks.splice(idx, 1)
                                                            setSettings({ ...settings, homepage: { ...settings.homepage, affiliate_perks: newPerks }})
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!settings.homepage.affiliate_perks || settings.homepage.affiliate_perks.length === 0) && (
                                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                    No perks added yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Bottom CTA Section */}
                            <CollapsibleSection id="cta" title="Bottom Call to Action" icon={<ArrowUp className="h-5 w-5 rotate-45" />}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Title</Label>
                                        <Input
                                            value={settings.homepage.cta_title}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, cta_title: e.target.value }})}
                                            placeholder="Ready to Level Up Your Freelance Game?"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Subtitle</Label>
                                        <Input
                                            value={settings.homepage.cta_subtitle}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, cta_subtitle: e.target.value }})}
                                            placeholder="Join thousands of freelancers who trust Aranora"
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Footer Branding Section */}
                            <CollapsibleSection id="footer_branding" title="Footer Branding" icon={<LinkIcon className="h-5 w-5" />}>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-foreground/80">Footer Tagline</Label>
                                        <textarea
                                            value={settings.homepage.footer_tagline}
                                            onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, footer_tagline: e.target.value }})}
                                            placeholder="The all-in-one platform for freelancers."
                                            className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm resize-y focus:ring-2 focus:ring-ring focus:border-input"
                                            maxLength={100}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>The small tagline text shown below the logo in the footer</span>
                                            <span>{settings.homepage.footer_tagline?.length || 0}/100</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                                <Twitter className="h-4 w-4 text-[#1DA1F2]" /> Twitter URL
                                            </Label>
                                            <Input
                                                value={settings.homepage.twitter_url}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, twitter_url: e.target.value }})}
                                                placeholder="https://twitter.com/aranora"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                                <Linkedin className="h-4 w-4 text-[#0077B5]" /> LinkedIn URL
                                            </Label>
                                            <Input
                                                value={settings.homepage.linkedin_url}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, linkedin_url: e.target.value }})}
                                                placeholder="https://linkedin.com/company/aranora"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                                <Code className="h-4 w-4 text-primary" /> Developer Text
                                            </Label>
                                            <Input
                                                value={settings.homepage.developer_text}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, developer_text: e.target.value }})}
                                                placeholder="Developed by Your Name"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-foreground/80">Developer URL (Optional)</Label>
                                            <Input
                                                value={settings.homepage.developer_url}
                                                onChange={(e) => setSettings({ ...settings, homepage: { ...settings.homepage, developer_url: e.target.value }})}
                                                placeholder="https://yourportfolio.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/40 rounded-xl border border-dashed text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2 mb-2 font-semibold">
                                            <Eye className="h-3.5 w-3.5" /> Footer Preview
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                {settings.branding.logo_url ? (
                                                    <img src={settings.branding.logo_url} alt="Logo" className="h-6 object-contain" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded bg-primary/20" />
                                                )}
                                                <span className="font-bold text-sm tracking-tight" style={{ color: settings.branding.primary_color }}>Aranora</span>
                                            </div>
                                            <p className="opacity-70 leading-relaxed">{settings.homepage.footer_tagline || "The all-in-one platform for freelancers."}</p>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                        
                        <div className="pt-4 border-t flex items-center gap-4">
                            <Button
                                onClick={() => saveSettings("homepage", settings.homepage)}
                                disabled={isSaving}
                                size="lg"
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {savedKey === "homepage" ? "Saved!" : "Save Homepage Content"}
                            </Button>
                            {savedKey === "homepage" && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Changes published successfully.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Pricing Page Content</h3>
                            <p className="text-sm text-muted-foreground">
                                Edit the content displayed on your dedicated pricing page (/pricing)
                            </p>
                        </div>

                        {/* Hero Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">🚀 Hero Section</h4>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Main Title</Label>
                                    <Input
                                        value={settings.pricing_page.hero_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing_page: { ...settings.pricing_page, hero_title: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <textarea
                                        value={settings.pricing_page.hero_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing_page: { ...settings.pricing_page, hero_subtitle: e.target.value }
                                        })}
                                        className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing Values Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">💰 Pricing Definitions</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Monthly Price ($)</Label>
                                    <Input
                                        type="number"
                                        value={settings.pricing_page.monthly_price}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing_page: { ...settings.pricing_page, monthly_price: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Annual Price ($)</Label>
                                    <Input
                                        type="number"
                                        value={settings.pricing_page.annual_price}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing_page: { ...settings.pricing_page, annual_price: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Features List Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-primary">✨ Features List</h4>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-2"
                                    onClick={() => {
                                        setSettings({
                                            ...settings,
                                            pricing_page: {
                                                ...settings.pricing_page,
                                                features: [...settings.pricing_page.features, "New Feature"]
                                            }
                                        })
                                    }}
                                >
                                    <Plus className="h-4 w-4" /> Add Feature
                                </Button>
                            </div>
                            <div className="space-y-3">
                                { (settings.pricing_page.features || []).map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => {
                                                const newFeatures = [...settings.pricing_page.features];
                                                newFeatures[idx] = e.target.value;
                                                setSettings({
                                                    ...settings,
                                                    pricing_page: { ...settings.pricing_page, features: newFeatures }
                                                })
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                const newFeatures = settings.pricing_page.features.filter((_, i) => i !== idx);
                                                setSettings({
                                                    ...settings,
                                                    pricing_page: { ...settings.pricing_page, features: newFeatures }
                                                })
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQs Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-primary">❓ Frequently Asked Questions</h4>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-2"
                                    onClick={() => {
                                        setSettings({
                                            ...settings,
                                            pricing_page: {
                                                ...settings.pricing_page,
                                                faqs: [...settings.pricing_page.faqs, { question: "New Question", answer: "New Answer" }]
                                            }
                                        })
                                    }}
                                >
                                    <Plus className="h-4 w-4" /> Add FAQ
                                </Button>
                            </div>
                            <div className="space-y-4">
                                { (settings.pricing_page.faqs || []).map((faq, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-background relative group">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                const newFaqs = settings.pricing_page.faqs.filter((_, i) => i !== idx);
                                                setSettings({
                                                    ...settings,
                                                    pricing_page: { ...settings.pricing_page, faqs: newFaqs }
                                                })
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid gap-3 pr-10">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Question</Label>
                                                <Input
                                                    value={faq.question}
                                                    onChange={(e) => {
                                                        const newFaqs = [...settings.pricing_page.faqs];
                                                        newFaqs[idx].question = e.target.value;
                                                        setSettings({
                                                            ...settings,
                                                            pricing_page: { ...settings.pricing_page, faqs: newFaqs }
                                                        })
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Answer</Label>
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => {
                                                        const newFaqs = [...settings.pricing_page.faqs];
                                                        newFaqs[idx].answer = e.target.value;
                                                        setSettings({
                                                            ...settings,
                                                            pricing_page: { ...settings.pricing_page, faqs: newFaqs }
                                                        })
                                                    }}
                                                    className="w-full min-h-[60px] p-2 text-sm rounded-md border bg-background resize-y"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => saveSettings("pricing_page", settings.pricing_page)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "pricing_page" ? "Saved!" : "Save Pricing Content"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Feature Toggles</h3>
                            <p className="text-sm text-muted-foreground">
                                Enable or disable platform features
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Contracts</p>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to create and manage contracts
                                    </p>
                                </div>
                                <Toggle
                                    checked={settings.features.contracts_enabled}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            features: { ...settings.features, contracts_enabled: checked },
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Partnerships</p>
                                    <p className="text-sm text-muted-foreground">
                                        Enable collaboration between freelancers
                                    </p>
                                </div>
                                <Toggle
                                    checked={settings.features.partnerships_enabled}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            features: { ...settings.features, partnerships_enabled: checked },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => saveSettings("features", settings.features)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "features" ? "Saved!" : "Save Features"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Limits Tab */}
                <TabsContent value="limits">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Usage Limits</h3>
                            <p className="text-sm text-muted-foreground">
                                Set limits per user (leave empty for unlimited)
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Max Clients per User</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="Unlimited"
                                    value={settings.limits.max_clients_per_user || ""}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            limits: {
                                                ...settings.limits,
                                                max_clients_per_user: e.target.value ? parseInt(e.target.value) : null,
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Projects per User</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="Unlimited"
                                    value={settings.limits.max_projects_per_user || ""}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            limits: {
                                                ...settings.limits,
                                                max_projects_per_user: e.target.value ? parseInt(e.target.value) : null,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => saveSettings("limits", settings.limits)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "limits" ? "Saved!" : "Save Limits"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Admin Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Configure when to receive admin alerts
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">New User Registration</p>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when a new user signs up
                                    </p>
                                </div>
                                <Toggle
                                    checked={settings.notifications.notify_new_user}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            notifications: { ...settings.notifications, notify_new_user: checked },
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">New Project Created</p>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when a project is created
                                    </p>
                                </div>
                                <Toggle
                                    checked={settings.notifications.notify_new_project}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            notifications: { ...settings.notifications, notify_new_project: checked },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => saveSettings("notifications", settings.notifications)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "notifications" ? "Saved!" : "Save Notifications"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Security Settings</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage admin access and permissions
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Admin Users</p>
                                    <p className="text-2xl font-bold">{adminCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-yellow-500/10">
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                ⚠️ Admin Management
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                To add or remove admin users, update the <code className="bg-muted px-1 rounded">is_admin</code> field
                                in the <code className="bg-muted px-1 rounded">profiles</code> table directly in Supabase.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Testimonials Tab */}
                <TabsContent value="testimonials">
                    <div className="rounded-xl border bg-card p-6">
                        <TestimonialsManager />
                    </div>
                </TabsContent>

                {/* Platforms Tab */}
                <TabsContent value="platforms">
                    <div className="rounded-xl border bg-card p-6">
                        <PlatformLinksManager />
                    </div>
                </TabsContent>

                {/* Footer Tab */}
                <TabsContent value="footer">
                    <div className="rounded-xl border bg-card p-6">
                        <FooterLinksManager />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
