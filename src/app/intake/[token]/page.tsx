import { getIntakeFormByToken } from "@/app/(dashboard)/intake-forms/actions";
import IntakeFormClient from "./intake-form-client";
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
    const form = await getIntakeFormByToken(token);
    const branding = await getBranding();
    const siteName = branding.site_name || "Aranora";

    const headerList = await headers();
    const host = headerList.get("host") || "aranora.com";
    const proto = headerList.get("x-forwarded-proto") || "https";
    const origin = `${proto}://${host}`;

    if (form) {
        const titleText = `Intake Form: ${form.title}`;
        const descText = `Please fill out the onboarding intake form for ${form.title} securely.`;
        const ogImage = `${origin}/api/og?type=intake&badge=INTAKE+FORM&title=${encodeURIComponent(`Onboarding: ${form.title}`)}&subtitle=${encodeURIComponent(`Please fill out this project onboarding intake form to get started.`)}`;

        return {
            title: `${titleText} | ${siteName}`,
            description: descText,
            openGraph: {
                title: `${titleText} | ${siteName}`,
                description: descText,
                url: `${origin}/intake/${token}`,
                siteName: siteName,
                images: [
                    {
                        url: ogImage,
                        width: 1200,
                        height: 630,
                        alt: `Fill out Client Intake Form: ${form.title}`,
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

    const defaultTitle = `Intake Form | ${siteName}`;
    const defaultDesc = 'Please fill out the project intake form.';
    const defaultOg = `${origin}/api/og?type=intake&badge=INTAKE+FORM&title=${encodeURIComponent(defaultTitle)}&subtitle=${encodeURIComponent(defaultDesc)}`;

    return {
        title: defaultTitle,
        description: defaultDesc,
        openGraph: {
            title: defaultTitle,
            description: defaultDesc,
            url: `${origin}/intake/${token}`,
            siteName: siteName,
            images: [
                {
                    url: defaultOg,
                    width: 1200,
                    height: 630,
                    alt: `Client Intake Form`,
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
