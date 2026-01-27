"use client"

import { Trash2 } from "lucide-react"
import { removeTeamMember } from "@/app/(dashboard)/settings/team/actions"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface RemoveTeamMemberButtonProps {
    memberId: string
    memberEmail: string
}

export function RemoveTeamMemberButton({ memberId, memberEmail }: RemoveTeamMemberButtonProps) {
    const router = useRouter()

    const handleRemove = async () => {
        if (!confirm(`Remove ${memberEmail} from your team?`)) return

        try {
            await removeTeamMember(memberId)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to remove team member")
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
    )
}
