"use client"

import { useState, useRef } from "react"
import { Save, Shield, Sliders, Bell, ToggleLeft, Users, Palette, Home, Upload, X, Image as ImageIcon, Quote, Globe, Link as LinkIcon, DollarSign, Plus, Trash2 } from "lucide-react"
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
            stats_min_threshold: number
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
    const logoInputRef = useRef<HTMLInputElement>(null)
    const faviconInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

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
            const fileExt = file.name.split('.').pop()
            const fileName = `${type}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName)

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

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <Label>Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                                        {settings.branding.logo_url ? (
                                            <img
                                                src={settings.branding.logo_url}
                                                alt="Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {isUploading ? 'Uploading...' : 'Upload Logo'}
                                        </Button>
                                        {settings.branding.logo_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    branding: { ...settings.branding, logo_url: null }
                                                })}
                                                className="gap-2 text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Recommended: 200x200px, PNG or SVG
                                </p>
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-3">
                                <Label>Favicon</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                                        {settings.branding.favicon_url ? (
                                            <img
                                                src={settings.branding.favicon_url}
                                                alt="Favicon"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => faviconInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Recommended: 32x32px or 64x64px
                                </p>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={settings.branding.primary_color}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            branding: { ...settings.branding, primary_color: e.target.value }
                                        })}
                                        className="h-10 w-14 rounded-lg border cursor-pointer"
                                    />
                                    <Input
                                        value={settings.branding.primary_color}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            branding: { ...settings.branding, primary_color: e.target.value }
                                        })}
                                        placeholder="#1E3A5F"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Color</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={settings.branding.secondary_color}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            branding: { ...settings.branding, secondary_color: e.target.value }
                                        })}
                                        className="h-10 w-14 rounded-lg border cursor-pointer"
                                    />
                                    <Input
                                        value={settings.branding.secondary_color}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            branding: { ...settings.branding, secondary_color: e.target.value }
                                        })}
                                        placeholder="#4ADE80"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Font */}
                        <div className="space-y-2">
                            <Label>Font Family</Label>
                            <select
                                value={settings.branding.font_family}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    branding: { ...settings.branding, font_family: e.target.value }
                                })}
                                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Outfit">Outfit</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Cairo">Cairo (Arabic)</option>
                            </select>
                        </div>

                        <Button
                            onClick={() => saveSettings("branding", settings.branding)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "branding" ? "Saved!" : "Save Branding"}
                        </Button>
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

                        {/* Hero Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">🚀 Hero Section</h4>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Badge Text</Label>
                                    <Input
                                        value={settings.homepage.hero_badge_text}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, hero_badge_text: e.target.value }
                                        })}
                                        placeholder="Built for Freelancers, by Freelancers"
                                    />
                                    <p className="text-xs text-muted-foreground">The small pill badge shown above the main title</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Main Title</Label>
                                    <Input
                                        value={settings.homepage.hero_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, hero_title: e.target.value }
                                        })}
                                        placeholder="Your Freelance Business, Professionally Managed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <textarea
                                        value={settings.homepage.hero_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, hero_subtitle: e.target.value }
                                        })}
                                        placeholder="All-in-one platform to manage clients, projects, invoices..."
                                        className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-y"
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>CTA Button Text</Label>
                                        <Input
                                            value={settings.homepage.hero_cta_text}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                homepage: { ...settings.homepage, hero_cta_text: e.target.value }
                                            })}
                                            placeholder="Start Free — No Card Required"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Navigation CTA Text</Label>
                                        <Input
                                            value={settings.homepage.nav_cta_text}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                homepage: { ...settings.homepage, nav_cta_text: e.target.value }
                                            })}
                                            placeholder="Get Started Free"
                                        />
                                        <p className="text-xs text-muted-foreground">Button text in the top navigation bar</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Microcopy</Label>
                                    <Input
                                        value={settings.homepage.hero_microcopy}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, hero_microcopy: e.target.value }
                                        })}
                                        placeholder="First month free • No credit card required • Cancel anytime"
                                    />
                                    <p className="text-xs text-muted-foreground">Small text shown below the CTA buttons</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Proof Settings */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">📊 Social Proof</h4>
                            <div className="space-y-2">
                                <Label>Minimum User Threshold</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={settings.homepage.stats_min_threshold}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        homepage: { ...settings.homepage, stats_min_threshold: Number(e.target.value) }
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    When total registered users is below this number, the stats bar will show generic trust badges instead of actual numbers. Set to 0 to always show stats.
                                </p>
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">✨ Features Section</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={settings.homepage.features_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, features_title: e.target.value }
                                        })}
                                        placeholder="Everything You Need to Succeed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Input
                                        value={settings.homepage.features_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, features_subtitle: e.target.value }
                                        })}
                                        placeholder="Powerful features designed for freelancers"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">🚶 How It Works</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Section Title</Label>
                                    <Input
                                        value={settings.homepage.how_it_works_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, how_it_works_title: e.target.value }
                                        })}
                                        placeholder="Get Started in 3 Simple Steps"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Input
                                        value={settings.homepage.how_it_works_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, how_it_works_subtitle: e.target.value }
                                        })}
                                        placeholder="Go from sign-up to managing your business in minutes."
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 mt-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Steps</Label>
                                {settings.homepage.how_it_works_steps.map((step, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-background">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Step {idx + 1}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            <Input
                                                value={step.title}
                                                onChange={(e) => {
                                                    const newSteps = [...settings.homepage.how_it_works_steps]
                                                    newSteps[idx] = { ...newSteps[idx], title: e.target.value }
                                                    setSettings({
                                                        ...settings,
                                                        homepage: { ...settings.homepage, how_it_works_steps: newSteps }
                                                    })
                                                }}
                                                placeholder="Step Title"
                                                className="font-medium"
                                            />
                                            <textarea
                                                value={step.desc}
                                                onChange={(e) => {
                                                    const newSteps = [...settings.homepage.how_it_works_steps]
                                                    newSteps[idx] = { ...newSteps[idx], desc: e.target.value }
                                                    setSettings({
                                                        ...settings,
                                                        homepage: { ...settings.homepage, how_it_works_steps: newSteps }
                                                    })
                                                }}
                                                placeholder="Step Description"
                                                className="w-full min-h-[60px] p-2 text-sm rounded-md border bg-background resize-y"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">💰 Pricing Section</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={settings.homepage.pricing_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, pricing_title: e.target.value }
                                        })}
                                        placeholder="Simple, Transparent Pricing"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Input
                                        value={settings.homepage.pricing_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, pricing_subtitle: e.target.value }
                                        })}
                                        placeholder="Start with your first month free."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Testimonials Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">⭐ Testimonials Section</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={settings.homepage.testimonials_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, testimonials_title: e.target.value }
                                        })}
                                        placeholder="Loved by Freelancers"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Input
                                        value={settings.homepage.testimonials_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, testimonials_subtitle: e.target.value }
                                        })}
                                        placeholder="See what our users have to say"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Affiliate Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">💸 Affiliate Section</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Section Title</Label>
                                    <Input
                                        value={settings.homepage.affiliate_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, affiliate_title: e.target.value }
                                        })}
                                        placeholder="Earn by Spreading the Word"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Input
                                        value={settings.homepage.affiliate_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, affiliate_subtitle: e.target.value }
                                        })}
                                        placeholder="Join our affiliate program and earn"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Commission Rate</Label>
                                    <Input
                                        value={settings.homepage.affiliate_commission_rate}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, affiliate_commission_rate: e.target.value }
                                        })}
                                        placeholder="30%"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monthly Earning</Label>
                                    <Input
                                        value={settings.homepage.affiliate_monthly_earning}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, affiliate_monthly_earning: e.target.value }
                                        })}
                                        placeholder="$5.70"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Annual Earning</Label>
                                    <Input
                                        value={settings.homepage.affiliate_annual_earning}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, affiliate_annual_earning: e.target.value }
                                        })}
                                        placeholder="$57.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 mt-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Perks</Label>
                                {settings.homepage.affiliate_perks.map((perk, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={perk.label}
                                            onChange={(e) => {
                                                const newPerks = [...settings.homepage.affiliate_perks]
                                                newPerks[idx] = { ...newPerks[idx], label: e.target.value }
                                                setSettings({
                                                    ...settings,
                                                    homepage: { ...settings.homepage, affiliate_perks: newPerks }
                                                })
                                            }}
                                            placeholder="Perk Label"
                                        />
                                        <Input
                                            value={perk.sub}
                                            onChange={(e) => {
                                                const newPerks = [...settings.homepage.affiliate_perks]
                                                newPerks[idx] = { ...newPerks[idx], sub: e.target.value }
                                                setSettings({
                                                    ...settings,
                                                    homepage: { ...settings.homepage, affiliate_perks: newPerks }
                                                })
                                            }}
                                            placeholder="Perk Subtitle"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                            <h4 className="font-medium text-sm text-primary">📢 Call to Action</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={settings.homepage.cta_title}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, cta_title: e.target.value }
                                        })}
                                        placeholder="Ready to Level Up Your Freelance Game?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Input
                                        value={settings.homepage.cta_subtitle}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            homepage: { ...settings.homepage, cta_subtitle: e.target.value }
                                        })}
                                        placeholder="Join thousands of freelancers who trust Aranora"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => saveSettings("homepage", settings.homepage)}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savedKey === "homepage" ? "Saved!" : "Save Homepage Content"}
                        </Button>
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
                                {settings.pricing_page.features.map((feature, idx) => (
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
                                {settings.pricing_page.faqs.map((faq, idx) => (
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
