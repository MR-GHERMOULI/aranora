import { getIntakeFormByToken } from "@/app/(dashboard)/intake-forms/actions";
import IntakeFormClient from "./intake-form-client";
import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

async function getBranding() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "branding")
        .single();
    return data?.value || {};
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const form = await getIntakeFormByToken(token);
    const branding = await getBranding();
    const siteName = branding.site_name || "Aranora";

    if (form) {
        return {
            title: `Intake Form: ${form.title} | ${siteName}`,
            description: `Please fill out the intake form for ${form.title}.`,
        };
    }

    return {
        title: `Intake Form | ${siteName}`,
        description: 'Please fill out the project intake form.',
    };
}

export default async function IntakeFormPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const form = await getIntakeFormByToken(token);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />
            <div className="flex-1">
                <IntakeFormClient form={form} token={token} />
            </div>
            <Footer />
        </div>
    );
}
