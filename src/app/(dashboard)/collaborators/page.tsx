import { getCollaborators } from "./actions"
import { CollaboratorList } from "@/components/collaborators/collaborator-list"
import { AddCollaboratorDialog } from "@/components/collaborators/add-collaborator-dialog"
import { Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CollaboratorsPage() {
    const collaborators = await getCollaborators()

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Users className="h-6 w-6 text-cyan-600" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Collaborators</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your network of external talent and collaborators.
                    </p>
                </div>
                <AddCollaboratorDialog />
            </div>

            <CollaboratorList collaborators={collaborators} />
        </div>
    )
}
