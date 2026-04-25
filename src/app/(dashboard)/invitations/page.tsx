import { getPendingInvitations } from "./actions"
import { InvitationsClient } from "./invitations-client"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export const metadata = {
    title: "Invitations | Aranora",
    description: "View and manage your pending project collaboration invitations.",
}

export default async function InvitationsPage() {
    const invitations = await getPendingInvitations()

    return (
        <div className="flex-1 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground -ml-2 gap-2"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-brand-primary/20 to-violet-500/10 border border-brand-primary/20 rounded-2xl">
                                <Mail className="h-7 w-7 text-brand-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Project Invitations
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Review and respond to collaboration requests from other workspace owners.
                                </p>
                            </div>
                        </div>

                        {invitations.length > 0 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm font-bold shrink-0 mt-1">
                                {invitations.length}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-border via-brand-primary/20 to-transparent" />
                </div>

                {/* Invitations list — client-rendered for interactivity */}
                <InvitationsClient initialInvitations={invitations} />
            </div>
        </div>
    )
}
