import { getInviteDetails, acceptInvite } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({ params }: { params: { id: string, token: string } }) { // params usually match the folder name [token]
    const token = params.token;
    const { invite, error } = await getInviteDetails(token);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (error || !invite) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                        <CardTitle>Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href="/">Return Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-brand-primary mb-4" />
                    <CardTitle className="text-2xl">Project Invitation</CardTitle>
                    <CardDescription>
                        You have been invited to collaborate on a project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-secondary/10 p-4 rounded-lg text-center">
                        {/* @ts-ignore */}
                        <h3 className="font-bold text-lg">{invite.project?.title}</h3>
                        {/* @ts-ignore */}
                        <p className="text-sm text-muted-foreground mt-1">{invite.project?.description}</p>
                    </div>

                    <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">
                            Revenue Share Offer
                        </p>
                        <p className="text-3xl font-bold text-brand-primary">
                            {invite.revenue_share}%
                        </p>
                    </div>

                    {!user && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 text-center">
                            You need to log in or create an account to accept this invitation.
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <form action={acceptInvite.bind(null, token)} className="w-full">
                        <Button className="w-full" size="lg" disabled={!user}>
                            {user ? 'Accept Invitation' : 'Log In to Accept'}
                        </Button>
                    </form>
                    {!user && (
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/login?next=/invite/${token}`}>
                                Login / Register
                            </Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
