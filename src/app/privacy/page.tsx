import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import PublicNavbar from "@/components/layout/public-navbar";

export default async function PrivacyPage() {
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("static_pages")
        .select("title, content")
        .eq("slug", "privacy")
        .single();

    const { data: brandingSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "branding")
        .single();
    const supportEmail = brandingSetting?.value?.support_email || "support@aranora.com";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <PublicNavbar />

            <main className="max-w-3xl mx-auto px-4 pt-32 pb-16 relative">
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

                <h1 className="text-4xl font-bold text-foreground mb-2">
                    {page?.title || "Privacy Policy"}
                </h1>
                <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

                {page?.content ? (
                    <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We collect information you provide directly to us, such as when you create an account,
                                use our services, make a purchase, or contact us for support. This may include your name,
                                email address, phone number, company information, and payment details.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use the information we collect to provide, maintain, and improve our services,
                                process transactions, send you technical notices and updates, respond to your comments
                                and questions, and communicate with you about products, services, and events.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. Information Sharing</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We do not sell, trade, or otherwise transfer your personal information to outside parties
                                except to provide our services, comply with the law, or protect our rights. Trusted third
                                parties who assist us in operating our platform adhere to strict confidentiality obligations.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We implement industry-standard security measures to protect your personal information
                                against unauthorized access, alteration, disclosure, or destruction. This includes
                                encryption, secure servers, and regular security assessments.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You have the right to access, correct, or delete your personal information at any time.
                                You can also opt out of marketing communications. To exercise any of these rights,
                                please contact us at {supportEmail}.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy, please contact us at:
                            </p>
                            <p className="text-muted-foreground mt-2">
                                Email: <a href={`mailto:${supportEmail}`} className="text-brand-primary hover:underline">{supportEmail}</a>
                            </p>
                        </section>
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
