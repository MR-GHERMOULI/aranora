'use client'

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, CheckCircle, Loader2, UsersRound, ArrowRight } from "lucide-react";
import { acceptTeamInvite } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AcceptInviteClientProps {
    invite: {
        memberId: string;
        teamId: string;
        teamName: string;
        role: string;
        status: string;
        ownerName: string;
        ownerAvatar: string | null;
    };
    token: string;
}

export function AcceptInviteClient({ invite, token }: AcceptInviteClientProps) {
    const [isPending, startTransition] = useTransition();
    const [accepted, setAccepted] = useState(invite.status === 'active');
    const [error, setError] = useState('');
    const router = useRouter();

    function handleAccept() {
        startTransition(async () => {
            const result = await acceptTeamInvite(token);
            if (result.error === 'not_authenticated') {
                router.push(result.redirectTo!);
                return;
            }
            if (result.error) {
                const errorMessages: Record<string, string> = {
                    already_accepted: 'This invitation has already been accepted.',
                    invalid_invite: 'This invitation link is invalid or has expired.',
                    already_member: 'You are already an active member of this team.',
                    failed: 'Failed to accept the invitation. Please try again.',
                };
                setError(errorMessages[result.error] || 'An unexpected error occurred.');
                return;
            }
            setAccepted(true);
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 dark:from-slate-950 dark:via-blue-950/10 dark:to-violet-950/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <UsersRound className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Team Invitation</CardTitle>
                    <CardDescription className="text-base mt-2">
                        <strong>{invite.ownerName}</strong> has invited you to join
                    </CardDescription>
                    <p className="text-xl font-semibold text-brand-primary mt-1">{invite.teamName}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Role Info */}
                    <div className="flex items-center justify-center gap-2">
                        <Badge variant="secondary" className="text-sm gap-1.5 py-1 px-3">
                            {invite.role === 'manager' ? (
                                <Shield className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                                <User className="h-3.5 w-3.5 text-violet-500" />
                            )}
                            Role: {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                        </Badge>
                    </div>

                    {/* Permissions Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <p className="font-medium text-xs uppercase text-muted-foreground tracking-wider">You&apos;ll have access to:</p>
                        <ul className="space-y-1.5 text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                Assigned projects &amp; tasks
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                File sharing &amp; time tracking
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                Calendar &amp; task management
                            </li>
                            {invite.role === 'manager' && (
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    Client information (read-only)
                                </li>
                            )}
                        </ul>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
                            {error}
                        </p>
                    )}

                    {accepted ? (
                        <div className="text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="font-semibold text-green-700 dark:text-green-400">Welcome to the team!</p>
                            <Button asChild className="w-full gap-2">
                                <Link href="/dashboard">
                                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button onClick={handleAccept} disabled={isPending} className="w-full gap-2" size="lg">
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                Accept Invitation
                            </Button>
                            <p className="text-[11px] text-center text-muted-foreground">
                                By accepting, you agree to work within {invite.ownerName}&apos;s workspace.
                                <br />No subscription required — it&apos;s covered by the team owner.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
