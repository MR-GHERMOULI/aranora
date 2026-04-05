import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Target, Heart, Zap } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import PublicNavbar from "@/components/layout/public-navbar";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <PublicNavbar />

            <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 relative">
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

                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-foreground mb-4">About Aranora</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We&apos;re on a mission to empower freelancers and independent professionals to run their business with confidence.
                    </p>
                </div>

                {/* Story */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            Aranora was born from a simple frustration: managing a freelance business shouldn&apos;t require juggling dozens of tools.
                            As freelancers ourselves, we experienced firsthand the chaos of tracking clients in one app, projects in another,
                            invoices elsewhere, and contracts somewhere buried in emails.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We built Aranora to be the all-in-one platform we always wished existed — intuitive, powerful, and designed
                            specifically for the way freelancers work. Today, thousands of independent professionals trust Aranora to
                            run their businesses smoothly.
                        </p>
                    </div>
                </section>

                {/* Values */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-foreground mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: Target, title: "Focus on What Matters", desc: "We build features that save you time, not add complexity." },
                            { icon: Heart, title: "Built with Empathy", desc: "We understand freelancers because we are freelancers." },
                            { icon: Users, title: "Community First", desc: "Your feedback shapes our product roadmap." },
                            { icon: Zap, title: "Always Improving", desc: "We ship updates weekly to make Aranora better every day." }
                        ].map((value, i) => (
                            <div key={i} className="flex gap-4 p-6 bg-card rounded-xl border border-border">
                                <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                    <value.icon className="h-5 w-5 text-brand-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">{value.title}</h3>
                                    <p className="text-sm text-muted-foreground">{value.desc}</p>
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
            <Footer />
        </div>
    );
}
