"use client"

import { useState } from "react"
import { Save, Shield, Sliders, Bell, ToggleLeft, ToggleRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

interface SettingsClientProps {
    initialSettings: {
        branding: {
            logo_url: string | null
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
    }
    adminCount: number
}

export function SettingsClient({ initialSettings, adminCount }: SettingsClientProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isSaving, setIsSaving] = useState(false)
    const [savedKey, setSavedKey] = useState<string | null>(null)
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

            <Tabs defaultValue="features" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
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
                </TabsList>

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

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Team Members</p>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to invite team members
                                    </p>
                                </div>
                                <Toggle
                                    checked={settings.features.team_enabled}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            features: { ...settings.features, team_enabled: checked },
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
            </Tabs>
        </div>
    )
}
