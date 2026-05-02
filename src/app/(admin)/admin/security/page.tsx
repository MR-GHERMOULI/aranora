import { createAdminClient } from "@/lib/supabase/server"
import { ShieldAlert, Users, Monitor, MapPin, Ban, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SecurityTable } from "@/components/admin/security-table"

export default async function AdminSecurityPage() {
    const supabaseAdmin = createAdminClient()

    // 1. Fetch access logs grouped by IP to find shared addresses
    const { data: sharedIpData } = await supabaseAdmin
        .rpc('get_shared_ips') // We'll need to define this RPC or use a complex query

    // Since I can't easily define RPCs without the user, I'll use a standard query and process in JS
    const { data: allLogs } = await supabaseAdmin
        .from('user_access_logs')
        .select(`
            ip_address,
            user_agent,
            user_id,
            created_at,
            profiles:user_id (
                id,
                full_name,
                company_email,
                account_status
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

    // Process logs to find shared IPs/Devices
    const ipGroups: Record<string, any[]> = {}
    const uaGroups: Record<string, any[]> = {}

    allLogs?.forEach(log => {
        // If profile is missing, create a placeholder from user_id
        const userProfile = log.profiles || { 
            id: log.user_id, 
            full_name: 'Unknown User', 
            company_email: 'N/A', 
            account_status: 'active' 
        }

        if (log.ip_address) {
            if (!ipGroups[log.ip_address]) ipGroups[log.ip_address] = []
            if (!ipGroups[log.ip_address].some((u: any) => u.id === log.user_id)) {
                ipGroups[log.ip_address].push({
                    ...userProfile,
                    id: log.user_id, // Ensure id is always present
                    last_access: log.created_at,
                    ua: log.user_agent
                })
            }
        }

        if (log.user_agent && log.user_agent !== 'unknown') {
            if (!uaGroups[log.user_agent]) uaGroups[log.user_agent] = []
            if (!uaGroups[log.user_agent].some((u: any) => u.id === log.user_id)) {
                uaGroups[log.user_agent].push({
                    ...userProfile,
                    id: log.user_id,
                    last_access: log.created_at,
                    ip: log.ip_address
                })
            }
        }
    })

    const suspiciousIps = Object.entries(ipGroups)
        .filter(([_, users]) => users.length > 1)
        .map(([ip, users]) => ({
            type: 'IP Address',
            identifier: ip,
            users,
            count: users.length
        }))

    const suspiciousDevices = Object.entries(uaGroups)
        .filter(([ua, users]) => users.length > 1 && ua !== 'unknown')
        .map(([ua, users]) => ({
            type: 'Device (User Agent)',
            identifier: ua,
            users,
            count: users.length
        }))

    const allSuspicious = [...suspiciousIps, ...suspiciousDevices].sort((a, b) => b.count - a.count)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                    Security Monitoring
                </h1>
                <p className="text-muted-foreground mt-1">
                    Detect and manage accounts shared across the same device or IP address
                </p>
                <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {allLogs?.length || 0} Access Logs Collected
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Monitoring Active
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6 border-red-500/20 bg-red-500/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Shared IPs</p>
                            <h3 className="text-2xl font-bold">{suspiciousIps.length}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-amber-500/20 bg-amber-500/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Monitor className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Shared Devices</p>
                            <h3 className="text-2xl font-bold">{suspiciousDevices.length}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-blue-500/20 bg-blue-500/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total At-Risk Users</p>
                            <h3 className="text-2xl font-bold">
                                {new Set(allSuspicious.flatMap(s => s.users.map(u => u.id))).size}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            <SecurityTable initialData={allSuspicious} />
        </div>
    )
}
