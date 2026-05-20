import { getContractByToken } from "@/app/(dashboard)/contracts/actions";
import SigningPageClient from "./signing-page-client";
import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { headers } from "next/headers";
import { Metadata } from "next";
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

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const { token } = await params;
    const contract = await getContractByToken(token);
    const branding = await getBranding();
    const siteName = branding.site_name || "Aranora";

    const headerList = await headers();
    const host = headerList.get("host") || "aranora.com";
    const proto = headerList.get("x-forwarded-proto") || "https";
    const origin = `${proto}://${host}`;

    if (contract) {
        const titleText = `Sign Contract: ${contract.title}`;
        const descText = `Review and sign the contract agreement for ${contract.title} securely.`;
        const ogImage = `${origin}/api/og?type=contract&badge=CONTRACT&title=${encodeURIComponent(titleText)}&subtitle=${encodeURIComponent(descText)}`;

        return {
            title: `${titleText} | ${siteName}`,
            description: descText,
            openGraph: {
                title: `${titleText} | ${siteName}`,
                description: descText,
                url: `${origin}/sign/${token}`,
                siteName: siteName,
                images: [
                    {
                        url: ogImage,
                        width: 1200,
                        height: 630,
                        alt: `Review and Sign Contract: ${contract.title}`,
                    }
                ],
                locale: "en_US",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: `${titleText} | ${siteName}`,
                description: descText,
                images: [ogImage],
            }
        };
    }

    const defaultTitle = `Sign Contract | ${siteName}`;
    const defaultDesc = 'Review and sign your contract agreement.';
    const defaultOg = `${origin}/api/og?type=contract&badge=CONTRACT&title=${encodeURIComponent(defaultTitle)}&subtitle=${encodeURIComponent(defaultDesc)}`;

    return {
        title: defaultTitle,
        description: defaultDesc,
        openGraph: {
            title: defaultTitle,
            description: defaultDesc,
            url: `${origin}/sign/${token}`,
            siteName: siteName,
            images: [
                {
                    url: defaultOg,
                    width: 1200,
                    height: 630,
                    alt: `Sign Contract`,
                }
            ],
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: defaultTitle,
            description: defaultDesc,
            images: [defaultOg],
        }
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
