'use client'

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Shield, User, MoreVertical, Briefcase, Clock, CheckCircle2, DollarSign, Loader2, UserMinus, Pencil, Copy, Check } from "lucide-react";
import { TeamMember } from "@/types";
import { updateTeamMemberRole, updateTeamMemberSalary, removeTeamMember } from "@/app/(dashboard)/team/actions";
import { useRouter } from "next/navigation";
import { usePresence } from "@/components/providers/presence-provider";

interface TeamMemberCardProps {
    member: TeamMember;
    stats: {
        activeProjects: number;
        completedTasksThisMonth: number;
        totalHoursThisMonth: number;
    } | null;
}

const roleIcons = {
    owner: Crown,
    manager: Shield,
    member: User,
};

const roleColors = {
    owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    member: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const statusColors = {
    active: "bg-green-100 text-green-700",
    invited: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
};

export function TeamMemberCard({ member, stats }: TeamMemberCardProps) {
    const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { isOnline } = usePresence();

    const RoleIcon = roleIcons[member.role] || User;
    const displayName = member.profile?.full_name || member.profile?.username || member.profile?.email || member.email || 'Invited User';
    const isEmail = displayName.includes('@');
    const initials = isEmail 
        ? displayName.split('@')[0].substring(0, 2).toUpperCase()
        : displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    
    const online = member.user_id ? isOnline(member.user_id) : false;

    function handleRoleChange(newRole: string) {
        startTransition(async () => {
            await updateTeamMemberRole(member.id, newRole as any);
            router.refresh();
        });
    }

    function handleSalaryUpdate(formData: FormData) {
        startTransition(async () => {
            const salary = parseFloat(formData.get('salary') as string) || 0;
            const currency = formData.get('currency') as string || 'USD';
            const notes = formData.get('notes') as string;
            await updateTeamMemberSalary(member.id, salary, currency, notes);
            setSalaryDialogOpen(false);
            router.refresh();
        });
    }

    function handleRemove() {
        startTransition(async () => {
            await removeTeamMember(member.id);
            setRemoveDialogOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <Card className="group hover:shadow-md transition-all duration-200 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${member.role === 'manager' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                <CardContent className="pt-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {member.profile?.avatar_url ? (
                                    <img
                                        src={member.profile.avatar_url}
                                        alt={displayName}
                                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white dark:ring-slate-800">
                                        {initials}
                                    </div>
                                )}
                                <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 ${online ? 'bg-green-500' : 'bg-slate-400'}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm truncate max-w-[160px]">{displayName}</h3>
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                    {member.profile?.email || member.profile?.company_email || ''}
                                </p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(member.role === 'manager' ? 'member' : 'manager')}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    {member.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
                                </DropdownMenuItem>
                                {member.status === 'invited' && member.invite_token && (
                                    <DropdownMenuItem onClick={() => {
                                        const link = `${window.location.origin}/team-invite/${member.invite_token}`;
                                        navigator.clipboard.writeText(link);
                                        setLinkCopied(true);
                                        setTimeout(() => setLinkCopied(false), 2000);
                                    }}>
                                        {linkCopied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {linkCopied ? 'Link Copied!' : 'Copy Invite Link'}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setSalaryDialogOpen(true)}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Edit Salary
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setRemoveDialogOpen(true)} className="text-red-600">
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove from Team
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Role & Status Badges */}
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className={`text-[10px] gap-1 ${roleColors[member.role]}`}>
                            <RoleIcon className="h-3 w-3" />
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                        <Badge variant="secondary" className={`text-[10px] ${statusColors[member.status]}`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                    </div>

                    {/* Stats */}
                    {stats && member.status === 'active' && (
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                    <Briefcase className="h-3 w-3" />
                                </div>
                                <p className="text-sm font-semibold">{stats.activeProjects}</p>
                                <p className="text-[10px] text-muted-foreground">Projects</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                </div>
                                <p className="text-sm font-semibold">{stats.completedTasksThisMonth}</p>
                                <p className="text-[10px] text-muted-foreground">Tasks</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                    <Clock className="h-3 w-3" />
                                </div>
                                <p className="text-sm font-semibold">{stats.totalHoursThisMonth}h</p>
                                <p className="text-[10px] text-muted-foreground">Hours</p>
                            </div>
                        </div>
                    )}

                    {/* Salary (owner-only private info) */}
                    {(member.base_salary !== undefined && member.base_salary > 0) && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>Salary</span>
                            </div>
                            <span className="text-xs font-semibold">
                                {member.salary_currency || 'USD'} {member.base_salary.toLocaleString()}/mo
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Salary Dialog */}
            <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Salary — {displayName}</DialogTitle>
                        <DialogDescription>
                            This information is private and only visible to you as the team owner.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleSalaryUpdate} className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="salary">Monthly Salary</Label>
                                <Input
                                    id="salary"
                                    name="salary"
                                    type="number"
                                    step="0.01"
                                    defaultValue={member.base_salary || 0}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select name="currency" defaultValue={member.salary_currency || 'USD'}>
                                    <SelectTrigger id="currency">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="DZD">DZD</SelectItem>
                                        <SelectItem value="MAD">MAD</SelectItem>
                                        <SelectItem value="TND">TND</SelectItem>
                                        <SelectItem value="SAR">SAR</SelectItem>
                                        <SelectItem value="AED">AED</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Input
                                id="notes"
                                name="notes"
                                defaultValue={member.salary_notes || ''}
                                placeholder="e.g. Agreement details, bonuses..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSalaryDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation Dialog */}
            <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove Team Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{displayName}</strong> from your team?
                            They will lose access to all assigned projects immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Remove Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
