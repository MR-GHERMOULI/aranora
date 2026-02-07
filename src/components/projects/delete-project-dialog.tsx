"use client"

import { useState } from "react"
import { deleteProject } from "@/app/(dashboard)/projects/actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DeleteProjectDialogProps {
    projectId: string
    projectTitle: string
}

export function DeleteProjectDialog({ projectId, projectTitle }: DeleteProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            await deleteProject(projectId)
            setOpen(false)
            router.push('/projects')
        } catch (error) {
            console.error("Failed to delete project", error)
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete
                        <span className="font-semibold text-foreground"> {projectTitle} </span>
                        and remove all associated data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Project"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
