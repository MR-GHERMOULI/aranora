import Link from "next/link";
import { notFound } from "next/navigation";
import * as Icons from "lucide-react";
import { ArrowLeft, CheckCircle2, ChevronRight, Star, Sparkles, Award } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import PublicNavbar from "@/components/layout/public-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { toolsRegistry, getToolBySlug } from "@/lib/tools-data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return toolsRegistry.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  const siteName = data?.value?.site_name || "Aranora";

  if (!tool) {
    return { title: `Tool Not Found | ${siteName}` };
  }

  return {
    title: `${tool.title} for Freelancers | Detailed Summary & Features | ${siteName}`,
    description: tool.shortDesc,
  };
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return notFound();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  const siteName = data?.value?.site_name || "Aranora";

  const IconComponent = (Icons as any)[tool.iconName] || Icons.HelpCircle;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20 relative">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>
            Back to Tools Directory
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid md:grid-cols-3 gap-8 items-start mb-16 border-b border-border/60 pb-12">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-4">
              <Award className="h-3.5 w-3.5" />
              Core Freelance Tool
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/10 shrink-0">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              {tool.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {tool.shortDesc}
            </p>
          </div>
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm text-center">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Ready to automate?
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Access {tool.title} and 9 other premium tools instantly.
            </p>
            <Button
              asChild
              className="w-full bg-brand-primary hover:bg-brand-primary-light text-white font-bold"
            >
              <Link href="/signup">Start Your Free Trial</Link>
            </Button>
            <p className="mt-2 text-[10px] text-muted-foreground">
              First month free • No credit card required
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main detailed content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Definition section */}
            <section className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-foreground mb-4">What is {tool.title}?</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                {tool.fullDesc}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {tool.detailedPoints.map((pt, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-brand-secondary-dark dark:text-brand-secondary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground m-0">{pt}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Core Sub-features */}
            <section className="pt-6 border-t border-border/50">
              <h2 className="text-2xl font-bold text-foreground mb-6">Key Capabilities</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {tool.features.map((feat, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-foreground mb-1 text-base">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Real-world Use Cases */}
            <section className="pt-6 border-t border-border/50">
              <h2 className="text-2xl font-bold text-foreground mb-6">How Freelancers Use {tool.title}</h2>
              <div className="space-y-4">
                {tool.useCases.map((uc, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-5 rounded-xl bg-muted/40 border border-border/60"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">{uc.role}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{uc.scenario}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-8">
            {/* Tool specific testimonial */}
            <div className="relative p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="absolute top-4 right-4 text-4xl text-brand-primary/15 font-serif leading-none">
                &ldquo;
              </div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-secondary text-brand-secondary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                &ldquo;{tool.testimonial.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white font-bold text-xs">
                  {tool.testimonial.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-xs">{tool.testimonial.author}</h4>
                  <p className="text-[10px] text-muted-foreground">{tool.testimonial.role}</p>
                </div>
              </div>
            </div>

            {/* Core Yield Metrics / Benefits */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border">
              <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide">
                Key Performance Indicators
              </h3>
              <ul className="space-y-3">
                {tool.benefits.map((benefit, index) => (
                  <li key={index} className="flex gap-2 items-start text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trial Call to Action */}
        <section className="mt-20 text-center bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-3xl p-12 text-white shadow-xl relative overflow-hidden">
          <h2 className="text-3xl font-extrabold mb-4">
            Try {tool.title} Free for 30 Days
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Experience the productivity and simplicity of a unified freelance portal. No obligation, no risk.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="bg-white hover:bg-neutral-100 text-brand-primary font-bold shadow-md hover:scale-[1.02] transition-transform"
          >
            <Link href="/signup">
              Get Started Free <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-6 text-xs text-white/50">
            First month completely free • Cancel anytime
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
