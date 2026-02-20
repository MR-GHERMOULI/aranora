import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                <p className="text-slate-500 mb-8">Last updated: January 2026</p>

                <div className="prose prose-slate max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We collect information you provide directly to us, such as when you create an account,
                            use our services, make a purchase, or contact us for support. This may include your name,
                            email address, phone number, company information, and payment details.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use the information we collect to provide, maintain, and improve our services,
                            process transactions, send you technical notices and updates, respond to your comments
                            and questions, and communicate with you about products, services, and events.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Information Sharing</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We do not sell, trade, or otherwise transfer your personal information to outside parties
                            except to provide our services, comply with the law, or protect our rights. Trusted third
                            parties who assist us in operating our platform adhere to strict confidentiality obligations.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Security</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We implement industry-standard security measures to protect your personal information
                            against unauthorized access, alteration, disclosure, or destruction. This includes
                            encryption, secure servers, and regular security assessments.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your Rights</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You have the right to access, correct, or delete your personal information at any time.
                            You can also opt out of marketing communications. To exercise any of these rights,
                            please contact us at privacy@aranora.com.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-slate-600 mt-2">
                            Email: <a href="mailto:privacy@aranora.com" className="text-brand-primary hover:underline">privacy@aranora.com</a>
                        </p>
                    </section>
                </div>
            </main>

            <Footer simple />
        </div>
    );
}
