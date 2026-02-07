import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/admin/stats-card"
import { MessagesTable } from "./messages-table"

export default async function AdminMessagesPage() {
    const supabase = await createClient()

    // Fetch messages
    const { data: messages } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })

    // Stats
    const total = messages?.length || 0
    const unread = messages?.filter((m: { is_read?: boolean }) => !m.is_read).length || 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                <p className="text-muted-foreground mt-1">
                    Manage inquiries from the contact form
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Unread Messages"
                    value={unread}
                    iconName="Mail"
                    description="requiring attention"
                    className="border-primary/20 bg-primary/5"
                />
                <StatsCard
                    title="Total Messages"
                    value={total}
                    iconName="MailOpen"
                    description="all time"
                />
            </div>

            {/* Messages List */}
            <MessagesTable initialMessages={messages || []} />
        </div>
    )
}
