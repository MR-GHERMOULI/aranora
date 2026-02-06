import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Target, Heart, Zap } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Simple Header */}
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

            <main className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">About Aranora</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        We're on a mission to empower freelancers and independent professionals to run their business with confidence.
                    </p>
                </div>

                {/* Story */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed">
                            Aranora was born from a simple frustration: managing a freelance business shouldn't require juggling dozens of tools.
                            As freelancers ourselves, we experienced firsthand the chaos of tracking clients in one app, projects in another,
                            invoices elsewhere, and contracts somewhere buried in emails.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-4">
                            We built Aranora to be the all-in-one platform we always wished existed — intuitive, powerful, and designed
                            specifically for the way freelancers work. Today, thousands of independent professionals trust Aranora to
                            run their businesses smoothly.
                        </p>
                    </div>
                </section>

                {/* Values */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: Target, title: "Focus on What Matters", desc: "We build features that save you time, not add complexity." },
                            { icon: Heart, title: "Built with Empathy", desc: "We understand freelancers because we are freelancers." },
                            { icon: Users, title: "Community First", desc: "Your feedback shapes our product roadmap." },
                            { icon: Zap, title: "Always Improving", desc: "We ship updates weekly to make Aranora better every day." }
                        ].map((value, i) => (
                            <div key={i} className="flex gap-4 p-6 bg-white rounded-xl border border-slate-200">
                                <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                    <value.icon className="h-5 w-5 text-brand-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">{value.title}</h3>
                                    <p className="text-sm text-slate-600">{value.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-2xl p-12 text-white">
                    <h2 className="text-2xl font-bold mb-4">Ready to join us?</h2>
                    <p className="text-white/80 mb-6">Start your free trial today and see why freelancers love Aranora.</p>
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/signup">Get Started Free</Link>
                    </Button>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-8 text-center text-sm text-slate-500">
                © {new Date().getFullYear()} Aranora. All rights reserved.
            </footer>
        </div>
    );
}
