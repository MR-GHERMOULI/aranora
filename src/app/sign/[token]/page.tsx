import { getContractByToken } from "@/app/(dashboard)/contracts/actions";
import SigningPageClient from "./signing-page-client";
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
    const contract = await getContractByToken(token);
    const branding = await getBranding();
    const siteName = branding.site_name || "Aranora";

    if (contract) {
        return {
            title: `Sign Contract: ${contract.title} | ${siteName}`,
            description: `Review and sign the contract agreement for ${contract.title}.`,
        };
    }

    return {
        title: `Sign Contract | ${siteName}`,
        description: 'Review and sign your contract agreement.',
    };
}

export default async function SigningPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const contract = await getContractByToken(token);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />
            <div className="flex-1">
                <SigningPageClient contract={contract} token={token} />
            </div>
            <Footer />
        </div>
    );
}
