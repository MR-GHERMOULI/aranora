"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTeam } from '@/app/actions/team-actions'

export function CreateWorkspaceForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)

        try {
            const result = await createTeam(formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success && result.teamId) {
                toast.success('Workspace created successfully!')
                router.push(`/teams/${result.teamId}`)
            } else {
                toast.error('Something went wrong. Please try again.')
            }
        } catch (error) {
            console.error('Error creating workspace:', error)
            toast.error('Failed to create workspace. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Design Agency"
                    required
                    disabled={isLoading}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
        </form>
    )
}
