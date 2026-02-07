import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export default async function AdminSettingsPage() {
    const supabase = await createClient()

    // Fetch all settings
    const { data: settings } = await supabase
        .from("platform_settings")
        .select("*")

    // Convert to key-value object
    const settingsMap: Record<string, unknown> = {}
    settings?.forEach((s) => {
        settingsMap[s.key] = s.value
    })

    // Fetch admin users count
    const { count: adminCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_admin", true)

    return (
        <SettingsClient
            initialSettings={{
                branding: (settingsMap.branding as {
                    logo_url: string | null
                    favicon_url: string | null
                    primary_color: string
                    secondary_color: string
                    font_family: string
                }) || {
                    logo_url: null,
                    favicon_url: null,
                    primary_color: "#1E3A5F",
                    secondary_color: "#4ADE80",
                    font_family: "Inter",
                },
                features: (settingsMap.features as {
                    contracts_enabled: boolean
                    partnerships_enabled: boolean
                    team_enabled: boolean
                }) || {
                    contracts_enabled: true,
                    partnerships_enabled: true,
                    team_enabled: true,
                },
                limits: (settingsMap.limits as {
                    max_clients_per_user: number | null
                    max_projects_per_user: number | null
                }) || {
                    max_clients_per_user: null,
                    max_projects_per_user: null,
                },
                notifications: (settingsMap.notifications as {
                    notify_new_user: boolean
                    notify_new_project: boolean
                }) || {
                    notify_new_user: true,
                    notify_new_project: false,
                },
                homepage: (settingsMap.homepage as {
                    hero_title: string
                    hero_subtitle: string
                    hero_cta_text: string
                    features_title: string
                    features_subtitle: string
                    pricing_title: string
                    pricing_subtitle: string
                    testimonials_title: string
                    testimonials_subtitle: string
                    cta_title: string
                    cta_subtitle: string
                }) || {
                    hero_title: "Manage Your Freelance Business Like a Pro",
                    hero_subtitle: "All-in-one platform to manage clients, projects, invoices, contracts, and team collaboration. Focus on what you do best — we handle the rest.",
                    hero_cta_text: "Start Free Trial",
                    features_title: "Everything You Need to Succeed",
                    features_subtitle: "Powerful features designed specifically for freelancers and independent professionals.",
                    pricing_title: "No Pricing Plans. Just Free.",
                    pricing_subtitle: "Aranora is completely free for all freelancers. No hidden fees, no credit card required, no limits.",
                    testimonials_title: "Loved by Freelancers",
                    testimonials_subtitle: "See what our users have to say.",
                    cta_title: "Ready to Level Up Your Freelance Game?",
                    cta_subtitle: "Join thousands of freelancers who trust Aranora to run their business.",
                },
            }}
            adminCount={adminCount || 0}
        />
    )
}
