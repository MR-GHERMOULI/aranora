import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import PublicNavbar from "@/components/layout/public-navbar";

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

            {/* Footer */}
            <Footer />
        </div>
    );
}
