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
                    primary_color: string
                    secondary_color: string
                    font_family: string
                }) || {
                    logo_url: null,
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
            }}
            adminCount={adminCount || 0}
        />
    )
}
