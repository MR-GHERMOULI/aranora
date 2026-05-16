'use client'

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Copy, Check, Loader2, Shield } from "lucide-react";
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
                            <DialogTitle>🔗 Invitation Link Ready</DialogTitle>
                            <DialogDescription>
                                {inviteResult.isExisting
                                    ? `A link has been generated for ${inviteResult.name}. Since they have an account, they can also accept via their dashboard.`
                                    : `The professional invitation link for ${inviteResult.name} is ready. Copy and send it to them manually.`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Shareable Invite Link</p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/team-invite/${inviteResult.token}`}
                                        className="font-mono text-sm bg-white dark:bg-black border-none ring-1 ring-slate-200 dark:ring-slate-800 focus-visible:ring-blue-500"
                                    />
                                    <Button 
                                        variant={copied ? "default" : "outline"} 
                                        size="icon" 
                                        onClick={handleCopyLink}
                                        className={copied ? "bg-green-500 hover:bg-green-600 border-none text-white" : ""}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                                <div className="p-1 bg-blue-500 rounded text-white mt-0.5">
                                    <Shield className="h-3 w-3" />
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                    <strong>Note:</strong> We don&apos;t send emails automatically to protect your privacy and resources. You have full control over who receives this link.
                                </p>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleClose} className="w-full">Done</Button>
                            </DialogFooter>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
