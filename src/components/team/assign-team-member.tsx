'use client'

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Plus, Check, Loader2, UserMinus, Shield, User } from "lucide-react";
import { getTeamMembers, assignMemberToProject, unassignMemberFromProject, getProjectTeamMembers } from "@/app/(dashboard)/team/actions";
import { useRouter } from "next/navigation";
import { TeamMember } from "@/types";

interface AssignTeamMemberProps {
    projectId: string;
}

export function AssignTeamMember({ projectId }: AssignTeamMemberProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
    const [assignedIds, setAssignedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (open) {
            setLoading(true);
            Promise.all([
                getTeamMembers(),
                getProjectTeamMembers(projectId),
            ]).then(([members, assigned]) => {
                setAllMembers(members.filter(m => m.status === 'active'));
                setAssignedIds(assigned.map(a => (a.team_member as any)?.id).filter(Boolean));
                setLoading(false);
            });
        }
    }, [open, projectId]);

    function handleToggle(memberId: string) {
        const isAssigned = assignedIds.includes(memberId);
        startTransition(async () => {
            try {
                if (isAssigned) {
                    await unassignMemberFromProject(memberId, projectId);
                    setAssignedIds(prev => prev.filter(id => id !== memberId));
                } else {
                    await assignMemberToProject(memberId, projectId);
                    setAssignedIds(prev => [...prev, memberId]);
                }
                router.refresh();
            } catch (err: any) {
                console.error(err);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UsersRound className="h-4 w-4" />
                    Team Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Team Members</DialogTitle>
                    <DialogDescription>
                        Select members from your team to work on this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-80 overflow-y-auto py-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : allMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">No team members yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Go to Team → Invite Member to add people.
                            </p>
                        </div>
                    ) : (
                        allMembers.map((member) => {
                            const isAssigned = assignedIds.includes(member.id);
                            const displayName = member.profile?.full_name || member.profile?.username || 'Unknown';
                            const initials = displayName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase();

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => handleToggle(member.id)}
                                    disabled={isPending}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                        isAssigned
                                            ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20'
                                            : 'border-transparent hover:bg-muted/50'
                                    }`}
                                >
                                    {member.profile?.avatar_url ? (
                                        <img
                                            src={member.profile.avatar_url}
                                            alt={displayName}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-xs">
                                            {initials}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{displayName}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Badge variant="secondary" className="text-[10px] gap-0.5 py-0 h-4">
                                                {member.role === 'manager' ? (
                                                    <Shield className="h-2.5 w-2.5" />
                                                ) : (
                                                    <User className="h-2.5 w-2.5" />
                                                )}
                                                {member.role}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {isAssigned ? (
                                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                                <Plus className="h-3 w-3 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
