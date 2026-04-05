import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import PublicNavbar from "@/components/layout/public-navbar";

export default async function TermsPage() {
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("static_pages")
        .select("title, content")
        .eq("slug", "terms")
        .single();

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
                    {page?.title || "Terms of Service"}
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
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using Aranora, you agree to be bound by these Terms of Service.
                                If you do not agree to all of these terms, you may not use our services.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Aranora provides a platform for freelancers and independent professionals to manage
                                their clients, projects, invoices, contracts, and team collaboration. We reserve the
                                right to modify or discontinue any aspect of the service at any time.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You are responsible for maintaining the confidentiality of your account credentials
                                and for all activities that occur under your account. You must notify us immediately
                                of any unauthorized use of your account.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You agree not to use Aranora for any unlawful purpose or in any way that could damage,
                                disable, or impair the service. You may not attempt to gain unauthorized access to
                                any portion of the service or any systems or networks connected to the service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. Payment and Billing</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Paid services are billed in advance on a monthly or annual basis. All fees are
                                non-refundable except as required by law. We may change our prices upon 30 days&apos;
                                notice. Continued use after a price change constitutes acceptance of the new price.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The Aranora platform and all content, features, and functionality are owned by
                                Aranora and are protected by international copyright, trademark, and other
                                intellectual property laws.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Aranora shall not be liable for any indirect, incidental, special, consequential,
                                or punitive damages resulting from your use of or inability to use the service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                For questions about these Terms of Service, please contact us at:
                            </p>
                            <p className="text-muted-foreground mt-2">
                                Email: <a href="mailto:legal@aranora.com" className="text-brand-primary hover:underline">legal@aranora.com</a>
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
