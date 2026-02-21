import { getNotifications } from "@/components/layout/notifications/actions"
import { InvitationsWidget } from "@/components/dashboard/invitations-widget"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Inbox } from "lucide-react"

export const metadata = {
    title: "Project Invitations | Aranora",
}

export default async function InvitationsPage() {
    const allNotifications = await getNotifications()
    const invitations = allNotifications.filter(n => n.type === 'invite')

    return (
        <div className="min-h-screen bg-background p-8 pt-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold tracking-tight">Invitations</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your project collaboration requests and team invites.
                    </p>
                </div>

                <div className="grid gap-6">
                    {invitations.length > 0 ? (
                        <div className="space-y-6">
                            <InvitationsWidget invitations={invitations} />
                        </div>
                    ) : (
                        <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-muted/30">
                            <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center mb-6 rotate-3 group hover:rotate-0 transition-transform">
                                <Inbox className="h-12 w-12 text-muted-foreground/60" />
                            </div>
                            <CardTitle className="text-2xl font-bold mb-3">All caught up!</CardTitle>
                            <CardDescription className="text-lg max-w-sm">
                                You don't have any pending invitations right now. New invitations will appear here.
                            </CardDescription>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
