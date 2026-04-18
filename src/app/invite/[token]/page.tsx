import { getInviteDetails, acceptInvite, declineInvite } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const { invite, error } = await getInviteDetails(token);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <PublicNavbar />
                <main className="flex-1 flex items-center justify-center p-4 pt-32">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                            <CardTitle>Invalid Invitation</CardTitle>
                            <CardDescription>
                                This invitation link is invalid or has already been used.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center">
                            <Button asChild variant="outline">
                                <Link href="/">Return Home</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    if (invite.status === 'active') {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <PublicNavbar />
                <main className="flex-1 flex items-center justify-center p-4 pt-32">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                            <CardTitle>Already Accepted</CardTitle>
                            <CardDescription>
                                This invitation has already been accepted.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center gap-3">
                            {user ? (
                                <Button asChild>
                                    <Link href="/dashboard">Go to Dashboard</Link>
                                </Button>
                            ) : (
                                <Button asChild variant="outline">
                                    <Link href="/login">Log In</Link>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    if (invite.status === 'declined') {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <PublicNavbar />
                <main className="flex-1 flex items-center justify-center p-4 pt-32">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <CardTitle>Invitation Declined</CardTitle>
                            <CardDescription>
                                This invitation was previously declined.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center">
                            <Button asChild variant="outline">
                                <Link href="/">Return Home</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    // @ts-ignore
    const inviter = invite.inviter as { full_name: string | null; username: string | null; avatar_url: string | null } | null;
    // @ts-ignore
    const project = invite.project as { title: string; description: string; slug: string | null };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-16">
                {/* Back Button */}
                <div className="mb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </span>
                        Back to Home
                    </Link>
                </div>

                <div className="flex items-center justify-center">
                    <Card className="max-w-md w-full shadow-lg">
                        <CardHeader className="text-center pb-4">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-primary mb-4" />
                            <CardTitle className="text-2xl">Project Invitation</CardTitle>
                            <CardDescription>
                                You have been invited to collaborate on a project.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Inviter Info */}
                            {inviter && (
                                <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-4 py-3">
                                    {/* Avatar */}
                                    <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
                                        {inviter.avatar_url ? (
                                            <Image
                                                src={inviter.avatar_url}
                                                alt={inviter.full_name || 'Inviter'}
                                                fill
                                                className="object-cover"
                                                sizes="44px"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Name + Handle */}
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">Invited by</p>
                                        <p className="font-semibold text-sm truncate leading-tight">
                                            {inviter.full_name || inviter.username || 'Aranora User'}
                                        </p>
                                        {inviter.username && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                @{inviter.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Project Info */}
                            <div className="bg-secondary/10 p-4 rounded-lg text-center">
                                <h3 className="font-bold text-lg">{project.title}</h3>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                )}
                            </div>

                            {/* Payment Offer */}
                            <div className="space-y-1 text-center">
                                {invite.payment_type === 'hourly' ? (
                                    <>
                                        <p className="text-sm text-muted-foreground">Hourly Rate Offer</p>
                                        <p className="text-3xl font-bold text-brand-primary">
                                            ${invite.hourly_rate}/hr
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Revenue Share Offer</p>
                                        <p className="text-3xl font-bold text-brand-primary">
                                            {invite.revenue_share}%
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Login warning for guests */}
                            {!user && (
                                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-300 text-center">
                                    You need to log in or create an account to respond to this invitation.
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 pt-2">
                            {user ? (
                                <>
                                    {/* Accept */}
                                    <form action={acceptInvite.bind(null, token)} className="w-full">
                                        <Button className="w-full" size="lg">
                                            Accept Invitation
                                        </Button>
                                    </form>
                                    {/* Decline */}
                                    <form action={declineInvite.bind(null, token)} className="w-full">
                                        <Button variant="outline" className="w-full" size="lg">
                                            Decline
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <Button variant="default" className="w-full" size="lg" asChild>
                                    <Link href={`/login?next=/invite/${token}`}>
                                        Log In to Respond
                                    </Link>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
