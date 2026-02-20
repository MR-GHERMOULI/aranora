import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-brand-primary">Aranora</span>
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                    </Button>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-8">Last updated: January 2026</p>

                <div className="prose prose-slate max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-slate-600 leading-relaxed">
                            By accessing or using Aranora, you agree to be bound by these Terms of Service.
                            If you do not agree to all of these terms, you may not use our services.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Aranora provides a platform for freelancers and independent professionals to manage
                            their clients, projects, invoices, contracts, and team collaboration. We reserve the
                            right to modify or discontinue any aspect of the service at any time.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Accounts</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials
                            and for all activities that occur under your account. You must notify us immediately
                            of any unauthorized use of your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Acceptable Use</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You agree not to use Aranora for any unlawful purpose or in any way that could damage,
                            disable, or impair the service. You may not attempt to gain unauthorized access to
                            any portion of the service or any systems or networks connected to the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Payment and Billing</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Paid services are billed in advance on a monthly or annual basis. All fees are
                            non-refundable except as required by law. We may change our prices upon 30 days'
                            notice. Continued use after a price change constitutes acceptance of the new price.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Intellectual Property</h2>
                        <p className="text-slate-600 leading-relaxed">
                            The Aranora platform and all content, features, and functionality are owned by
                            Aranora and are protected by international copyright, trademark, and other
                            intellectual property laws.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Limitation of Liability</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Aranora shall not be liable for any indirect, incidental, special, consequential,
                            or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contact Information</h2>
                        <p className="text-slate-600 leading-relaxed">
                            For questions about these Terms of Service, please contact us at:
                        </p>
                        <p className="text-slate-600 mt-2">
                            Email: <a href="mailto:legal@aranora.com" className="text-brand-primary hover:underline">legal@aranora.com</a>
                        </p>
                    </section>
                </div>
            </main>

            <Footer simple />
        </div>
    );
}
