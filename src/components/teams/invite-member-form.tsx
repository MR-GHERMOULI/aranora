"use client"

import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inviteTeamMember } from '@/app/actions/team-actions'

interface InviteMemberFormProps {
    teamId: string
}

export function InviteMemberForm({ teamId }: InviteMemberFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)

        try {
            const result = await inviteTeamMember(formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success('Invitation sent successfully!')
                // Reset the form
                event.currentTarget.reset()
            } else {
                toast.error('Something went wrong. Please try again.')
            }
        } catch (error) {
            console.error('Error inviting member:', error)
            toast.error('Failed to send invitation. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="teamId" value={teamId} />
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="colleague@example.com"
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member" disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
        </form>
    )
}
