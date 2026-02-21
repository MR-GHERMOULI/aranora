import { getCollaborator, getCollaboratorProjects, getCollaboratorPayments } from "../actions"
import { CollaboratorDetail } from "@/components/collaborators/collaborator-detail"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

interface CollaboratorPageProps {
    params: {
        id: string
    }
}

export default async function CollaboratorPage({ params }: CollaboratorPageProps) {
    const collaborator = await getCollaborator(params.id)

    if (!collaborator) {
        notFound()
    }

    // Fetch related data
    const projectHistory = collaborator.email ? await getCollaboratorProjects(collaborator.email) : []
    const payments = await getCollaboratorPayments(collaborator.id)

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/collaborators">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Collaborator Profile</h2>
                        <p className="text-muted-foreground">
                            View and manage details for {collaborator.full_name}.
                        </p>
                    </div>
                </div>
            </div>

            <CollaboratorDetail
                collaborator={collaborator}
                projectHistory={projectHistory}
                payments={payments}
            />
        </div>
    )
}
