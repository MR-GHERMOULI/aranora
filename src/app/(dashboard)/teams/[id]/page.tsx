import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { removeTeamMember, changeMemberRole } from '@/app/actions/team-actions';
import { InviteMemberForm } from '@/components/teams/invite-member-form';
import { MemberRoleSelect } from '@/components/teams/member-role-select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamActivityFeed } from "@/components/teams/team-activity-feed";

export default async function TeamSettingsPage({ params }: { params: { id: string } }) {
    const teamId = params.id;
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect('/login');
    }

    // 1. Verify user is in this team and get role
    const { data: currentUserMember, error: membershipError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userData.user.id)
        .single();

    if (membershipError || !currentUserMember) {
        redirect('/teams');
    }

    const isAdminOrOwner = ['admin', 'owner'].includes(currentUserMember.role);

    // 2. Fetch Team Data
    const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

    if (!team) redirect('/teams');

    // 3. Fetch Team Members
    const { data: members } = await supabase
        .from('team_members')
        .select('*, profiles(full_name, email)')
        .eq('team_id', teamId)
        .order('role');

    // 4. Fetch Pending Invitations
    const { data: invitations } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending');

    return (
        <div className="flex-1 space-y-6 lg:p-8 pt-6 relative min-h-screen">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:20px_20px]" />

            <div className="relative space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg dark:shadow-none">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/teams">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {team.name} Settings
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Manage members and roles
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="members" className="space-y-6">
                    <TabsList className="bg-background/50 backdrop-blur-sm border pr-1 border-white/10 p-1 h-auto rounded-xl inline-flex">
                        <TabsTrigger value="members" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary data-[state=active]:shadow-none transition-all">Team Members</TabsTrigger>
                        <TabsTrigger value="activity" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary data-[state=active]:shadow-none transition-all">Activity Log</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Members List */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>People with access to this workspace</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {members?.map((member: any) => (
                                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-card hover:bg-accent/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-lg shrink-0">
                                                        {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{member.profiles?.full_name || 'Unknown User'}</p>
                                                            {member.user_id === userData.user.id && (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-brand-primary/5 text-brand-primary border-brand-primary/20">You</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{member.profiles?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isAdminOrOwner && member.role !== 'owner' && member.user_id !== userData.user.id ? (
                                                        <MemberRoleSelect
                                                            teamId={teamId}
                                                            memberId={member.user_id}
                                                            currentRole={member.role}
                                                            disabled={!isAdminOrOwner}
                                                        />
                                                    ) : (
                                                        <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'} className="text-xs shadow-none">
                                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                        </Badge>
                                                    )}

                                                    {isAdminOrOwner && member.role !== 'owner' && member.user_id !== userData.user.id && (
                                                        <form action={async () => {
                                                            "use server"
                                                            await removeTeamMember(teamId, member.user_id);
                                                        }}>
                                                            <Button variant="ghost" size="icon" type="submit" title="Remove member" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pending Invitations */}
                                        {invitations && invitations.length > 0 && (
                                            <div className="pt-6 mt-6 border-t">
                                                <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Pending Invitations</h4>
                                                <div className="space-y-3">
                                                    {invitations.map((invite: any) => (
                                                        <div key={invite.id} className="flex items-center justify-between p-3 border border-dashed rounded-lg bg-muted/10 opacity-70">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{invite.email}</span>
                                                                <span className="text-xs text-muted-foreground">Invited as {invite.role}</span>
                                                            </div>
                                                            <Badge variant="outline">Pending</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Right column: Actions */}
                            <div className="space-y-6">
                                {/* Invite Member Form */}
                                {isAdminOrOwner && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <UserPlus className="w-5 h-5" />
                                                Invite Member
                                            </CardTitle>
                                            <CardDescription>Send an email invitation to join this workspace.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <InviteMemberForm teamId={teamId} />
                                        </CardContent>
                                    </Card>
                                )}

                                {!isAdminOrOwner && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                                                <ShieldAlert className="w-5 h-5" />
                                                View Only
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">You do not have permission to invite or remove members from this team. Please contact a team admin or owner.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Workspace Activity</CardTitle>
                                <CardDescription>A chronological history of actions taken in this workspace.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TeamActivityFeed />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}
