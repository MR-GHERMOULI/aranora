import { getProfile } from "./actions";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const profile = await getProfile();

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-4xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your profile and company settings.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal and company details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm profile={profile} />
                </CardContent>
            </Card>
        </div>
    );
}
