import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Info, AlertCircle, CheckCircle, Bell } from "lucide-react"
import { format } from "date-fns"

export const metadata = {
    title: "System Broadcasts | Aranora",
}

export default async function BroadcastsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch notifications that are NOT invite types (assuming these are broadcasts/system alerts)
    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .neq('type', 'invite')
        .order('created_at', { ascending: false })

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "info": return <Info className="h-5 w-5 text-blue-500" />
            case "success": return <CheckCircle className="h-5 w-5 text-green-500" />
            case "warning": return <AlertCircle className="h-5 w-5 text-orange-500" />
            default: return <Bell className="h-5 w-5 text-brand-primary" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "info": return "bg-blue-50 border-blue-200"
            case "success": return "bg-green-50 border-green-200"
            case "warning": return "bg-orange-50 border-orange-200"
            default: return "bg-brand-primary/5 border-brand-primary/10"
        }
    }

    return (
        <div className="min-h-screen bg-background p-8 pt-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                        <Radio className="h-6 w-6 animate-pulse" />
                        <span className="font-semibold uppercase tracking-wider text-sm">System Updates</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">System News & Broadcasts</h1>
                    <p className="text-muted-foreground text-lg">
                        Stay informed about platform updates, maintenance, and important announcements.
                    </p>
                </div>

                <div className="space-y-4">
                    {notifications && notifications.length > 0 ? (
                        notifications.map((n) => (
                            <Card key={n.id} className={`overflow-hidden border-l-4 ${n.type === 'warning' ? 'border-l-orange-500' :
                                    n.type === 'success' ? 'border-l-green-500' :
                                        n.type === 'info' ? 'border-l-blue-500' :
                                            'border-l-brand-primary'
                                } hover:shadow-md transition-all`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(n.type)}`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-lg">{n.title || "Announcement"}</h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(n.created_at), 'PPP')}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {n.message}
                                            </p>
                                            {!n.read && (
                                                <div className="pt-2">
                                                    <Badge className="bg-brand-primary">New</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                            <Radio className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No system news yet</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                When the platform administration sends out announcements, they will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
