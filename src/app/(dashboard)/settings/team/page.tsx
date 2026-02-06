import { getTeamMembers } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InviteTeamDialog } from "@/components/settings/invite-team-dialog";
import { RemoveTeamMemberButton } from "@/components/settings/remove-team-button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Shield } from "lucide-react";

export default async function TeamPage() {
    const teamMembers = await getTeamMembers();

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Team Management</h1>
                    <p className="text-muted-foreground">
                        Invite and manage team members with role-based access.
                    </p>
                </div>
                <InviteTeamDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <CardDescription>Manage roles and permissions for your team.</CardDescription>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No team members yet. Invite someone to collaborate!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.member_email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant={member.role === 'admin' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {member.role}
                                                </Badge>
                                                <Badge
                                                    variant={member.status === 'active' ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {member.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <RemoveTeamMemberButton memberId={member.id} memberEmail={member.member_email} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
