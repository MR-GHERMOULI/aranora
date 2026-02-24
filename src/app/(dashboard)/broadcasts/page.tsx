import { createClient } from "@/lib/supabase/server"
import { Radio } from "lucide-react"
import { BroadcastsList } from "./broadcasts-list"

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

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

            <div className="p-8 pt-10 relative z-10">
                <div className="max-w-4xl mx-auto space-y-10">
                    <div className="flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 w-fit px-4 py-1.5 rounded-full border border-amber-500/20 shadow-sm backdrop-blur-sm">
                            <Radio className="h-4 w-4 animate-pulse" />
                            <span className="font-semibold uppercase tracking-wider text-xs">System Updates</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            System News & Broadcasts
                        </h1>
                        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed">
                            Stay informed about platform updates, scheduled maintenance, and important feature announcements.
                        </p>
                    </div>

                    <BroadcastsList notifications={notifications || []} />
                </div>
            </div>
        </div>
    )
}
