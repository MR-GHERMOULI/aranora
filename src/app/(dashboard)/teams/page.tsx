import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTeam } from '@/app/actions/team-actions';
import { CreateWorkspaceForm } from '@/components/teams/create-workspace-form';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

export default async function TeamsPage() {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect('/login');
    }

    // Fetch teams the user belongs to
    const { data: teamMemberships, error: teamsError } = await supabase
        .from('team_members')
        .select('*, teams(*)')
        .eq('user_id', userData.user.id);

    if (teamsError) {
        console.error('Error fetching teams:', teamsError);
    }

    const teams = teamMemberships?.map(tm => tm.teams) || [];

    return (
        <div className="flex-1 space-y-6 lg:p-8 pt-6 relative min-h-screen">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:20px_20px]" />

            <div className="relative space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg dark:shadow-none">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Workspaces
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            Manage your teams and collaborative workspaces
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <Link key={team.id} href={`/teams/${team.id}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                        {team.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Click to manage members and settings</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    <Card className="border-dashed bg-muted/20">
                        <CardHeader>
                            <CardTitle>Create New Workspace</CardTitle>
                            <CardDescription>Start a new collaborative team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateWorkspaceForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
