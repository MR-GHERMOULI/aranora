import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = {
    title: "Invitations – Aranora",
};

export default function InvitationsPage() {
    return (
        <div className="min-h-screen bg-background p-8 pt-10">
            <div className="max-w-2xl mx-auto space-y-8">
                <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-muted/30">
                    <CardTitle className="text-2xl font-bold mb-3">Invitations Feature Retired</CardTitle>
                    <CardDescription className="text-lg max-w-sm">
                        The invitations functionality has been removed as we have transitioned to a single‑user model. No pending invitations are available.
                    </CardDescription>
                </Card>
            </div>
        </div>
    );
}
