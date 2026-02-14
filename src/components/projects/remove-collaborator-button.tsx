"use client"

import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { removeCollaborator } from "@/app/(dashboard)/projects/collaborator-actions"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface RemoveCollaboratorButtonProps {
    collaboratorId: string
    projectId: string
    email: string
}

export function RemoveCollaboratorButton({ collaboratorId, projectId, email }: RemoveCollaboratorButtonProps) {
    const router = useRouter()

    const handleRemove = async () => {
        if (!confirm(`Remove ${email} from this project?`)) return

        try {
            await removeCollaborator(collaboratorId, projectId)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to remove collaborator")
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
    )
}
