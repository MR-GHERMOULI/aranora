import { getTeamMembers, getMyTeam, getTeamMemberStats } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersRound, UserPlus, Shield, User, Crown, DollarSign, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteTeamMemberDialog } from "@/components/team/invite-member-dialog";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { TeamMember } from "@/types";

export const dynamic = 'force-dynamic';

const MAX_TEAM_MEMBERS = 5;

export default async function TeamPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const [team, members] = await Promise.all([
        getMyTeam(),
        getTeamMembers(),
    ]);

    // Fetch stats for each member
    const memberStats = await Promise.all(
        members.map(async (m: TeamMember) => {
            const stats = await getTeamMemberStats(m.id);
            return { memberId: m.id, stats };
        })
    );

    const statsMap = Object.fromEntries(
        memberStats.map(ms => [ms.memberId, ms.stats])
    );

    const activeCount = members.filter(m => m.status === 'active' || m.status === 'invited').length;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <UsersRound className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
                        <Badge variant="outline" className="ml-2 text-xs">
                            {activeCount}/{MAX_TEAM_MEMBERS} members
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your internal team members and assign them to projects.
                    </p>
                </div>
                <SubscriptionGate>
                    <InviteTeamMemberDialog currentCount={activeCount} maxCount={MAX_TEAM_MEMBERS} />
                </SubscriptionGate>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
                        <UsersRound className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {MAX_TEAM_MEMBERS - activeCount} slots remaining
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Salaries</CardTitle>
                        <DollarSign className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${members.reduce((sum, m) => sum + (m.base_salary || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Monthly team cost</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.values(statsMap).reduce((sum, s) => sum + (s?.completedTasksThisMonth || 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">This month across all members</p>
                    </CardContent>
                </Card>
            </div>

            {/* Members Grid */}
            {members.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                            <UserPlus className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No team members yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-4">
                            Invite up to {MAX_TEAM_MEMBERS} team members to help you manage projects, tasks, and deliverables.
                        </p>
                        <SubscriptionGate>
                            <InviteTeamMemberDialog currentCount={0} maxCount={MAX_TEAM_MEMBERS} />
                        </SubscriptionGate>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => (
                        <TeamMemberCard
                            key={member.id}
                            member={member}
                            stats={statsMap[member.id]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
