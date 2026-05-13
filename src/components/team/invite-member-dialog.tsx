'use client'

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Copy, Check, Loader2 } from "lucide-react";
import { inviteTeamMember } from "@/app/(dashboard)/team/actions";
import { useRouter } from "next/navigation";

interface InviteTeamMemberDialogProps {
    currentCount: number;
    maxCount: number;
}

export function InviteTeamMemberDialog({ currentCount, maxCount }: InviteTeamMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [inviteResult, setInviteResult] = useState<{ token: string; name: string; isExisting: boolean } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const isFull = currentCount >= maxCount;

    async function handleSubmit(formData: FormData) {
        setError('');
        startTransition(async () => {
            try {
                const result = await inviteTeamMember(formData);
                setInviteResult({
                    token: result.inviteToken,
                    name: result.memberName,
                    isExisting: result.isExistingUser,
                });
                router.refresh();
            } catch (err: any) {
                setError(err.message || 'Failed to send invitation');
            }
        });
    }

    function handleCopyLink() {
        if (!inviteResult) return;
        const link = `${window.location.origin}/team-invite/${inviteResult.token}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleClose() {
        setOpen(false);
        setInviteResult(null);
        setError('');
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
            <DialogTrigger asChild>
                <Button disabled={isFull} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {isFull ? `Team Full (${maxCount}/${maxCount})` : 'Invite Member'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {!inviteResult ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join your team. They&apos;ll have access to assigned projects only.
                            </DialogDescription>
                        </DialogHeader>

                        <form action={handleSubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="member@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue="member">
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">
                                            <div className="flex flex-col items-start">
                                                <span>Member</span>
                                                <span className="text-xs text-muted-foreground">Access to assigned projects, tasks, and time tracking</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="manager">
                                            <div className="flex flex-col items-start">
                                                <span>Manager</span>
                                                <span className="text-xs text-muted-foreground">All member permissions + view clients</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                                    {error}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>🎉 Invitation Sent!</DialogTitle>
                            <DialogDescription>
                                {inviteResult.isExisting
                                    ? `${inviteResult.name} already has an Aranora account. They'll receive an in-app notification.`
                                    : `Share this invite link with ${inviteResult.name} to join your team.`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/team-invite/${inviteResult.token}`}
                                    className="font-mono text-xs"
                                />
                                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleClose}>Done</Button>
                            </DialogFooter>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
