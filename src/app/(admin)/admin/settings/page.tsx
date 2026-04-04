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
                }) || {
                    hero_title: "Your Freelance Business, Professionally Managed",
                    hero_subtitle: "The all-in-one platform to manage clients, projects, invoices, contracts, time tracking, and team collaboration. Built by freelancers, for freelancers.",
                    hero_cta_text: "Start Free — No Card Required",
                    hero_badge_text: "Built for Freelancers, by Freelancers",
                    hero_microcopy: "First month free • No credit card required • Cancel anytime",
                    nav_cta_text: "Get Started Free",
                    features_title: "Everything You Need to Succeed",
                    features_subtitle: "A complete suite of professional tools designed specifically for freelancers and independent professionals.",
                    how_it_works_title: "Get Started in 3 Simple Steps",
                    how_it_works_subtitle: "Go from sign-up to managing your entire freelance business in minutes.",
                    how_it_works_steps: [
                        { title: "Sign Up Free", desc: "Create your account in under 60 seconds. Your first month is completely free — no credit card needed." },
                        { title: "Set Up Your Workspace", desc: "Add your first client, create a project, and configure your invoicing preferences." },
                        { title: "Run Your Business", desc: "Manage everything from one dashboard — clients, projects, invoices, contracts, and more." },
                    ],
                    pricing_title: "Simple, Transparent Pricing",
                    pricing_subtitle: "Start with your first month free. No credit card required. Upgrade when you're ready.",
                    testimonials_title: "Trusted by Freelancers Worldwide",
                    testimonials_subtitle: "See how Aranora is helping freelancers run their businesses with confidence.",
                    affiliate_title: "Earn by Spreading the Word",
                    affiliate_subtitle: "Join our affiliate program and earn",
                    affiliate_commission_rate: "30%",
                    affiliate_monthly_earning: "$5.70",
                    affiliate_annual_earning: "$57.00",
                    affiliate_perks: [
                        { label: "30% Commission", sub: "Industry-leading rate" },
                        { label: "12-Month Window", sub: "On monthly plans" },
                        { label: "Unique Links", sub: "Track every click" },
                        { label: "$50 Min Payout", sub: "Via PayPal or Bank" },
                    ],
                    cta_title: "Ready to Run Your Freelance Business Like a Pro?",
                    cta_subtitle: "Join a growing community of freelancers who trust Aranora to manage every aspect of their business.",
                    stats_min_threshold: 50,
                },
                pricing_page: (settingsMap.pricing_page as {
                    hero_title: string
                    hero_subtitle: string
                    monthly_price: number
                    annual_price: number
                    features: string[]
                    faqs: { question: string; answer: string }[]
                }) || {
                    hero_title: "Simple, transparent pricing",
                    hero_subtitle: "Start with your first month free. No credit card required. Upgrade when you're ready to take your freelance business to the next level.",
                    monthly_price: 19,
                    annual_price: 190,
                    features: [
                        'Unlimited projects & clients',
                        'Smart invoicing & contracts',
                        'E-signatures & PDF generation',
                        'Time tracking & reports',
                        'Team collaboration',
                        'Calendar & task management',
                        'Client intake forms',
                        'File management',
                        'Client portal with progress sharing',
                        'Priority support',
                    ],
                    faqs: [
                        {
                            question: "What is included in the 30-day free trial?",
                            answer: "You get full, unrestricted access to all default features of Aranora during your trial. This includes unlimited clients, smart invoicing, contract generation, time tracking, and team collaboration."
                        },
                        {
                            question: "Do I need a credit card to sign up for the free trial?",
                            answer: "No! We believe you should try before you buy. You can sign up and start managing your freelance business immediately without providing any payment information."
                        },
                        {
                            question: "Can I cancel my subscription at any time?",
                            answer: "Absolutely. There are no long-term contracts. You can easily switch between monthly and annual plans, or cancel your subscription directly from your settings at any time without penalties."
                        },
                        {
                            question: "How secure is my data and my clients' data?",
                            answer: "Very secure. We use enterprise-grade encryption and industry-standard security protocols to protect all your data, contracts, and invoicing details."
                        },
                        {
                            question: "Can I invite my team or collaborators?",
                            answer: "Yes, Aranora is built to scale with you. You can invite team members and assign specific tools, projects, and access permissions seamlessly."
                        }
                    ]
                },
            }}
            adminCount={adminCount || 0}
        />
    )
}
