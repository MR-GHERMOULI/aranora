import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

export default async function RefundPage() {
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("static_pages")
        .select("title, content")
        .eq("slug", "refund")
        .single();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
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
                <h1 className="text-4xl font-bold text-foreground mb-2">
                    {page?.title || "Refund Policy"}
                </h1>
                <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

                {page?.content ? (
                    <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            Our refund policy details are being prepared. Please contact us at{" "}
                            <a href="mailto:support@aranora.com" className="text-brand-primary hover:underline">
                                support@aranora.com
                            </a>{" "}
                            for any refund inquiries.
                        </p>
                    </div>
                )}
            </main>

            <Footer simple />
        </div>
    );
}
