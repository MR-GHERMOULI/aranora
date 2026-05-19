import Link from "next/link";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { ArrowRight, ChevronRight, Sparkles, CheckCircle2, Shield, Lock, Zap } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import PublicNavbar from "@/components/layout/public-navbar";
import { createClient } from "@/lib/supabase/server";
import { toolsRegistry } from "@/lib/tools-data";

export async function generateMetadata() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  const siteName = data?.value?.site_name || "Aranora";

  return {
    title: `Freelance Tools & Features Directory | ${siteName}`,
    description: `Explore ${siteName}'s complete suite of professional freelance tools: Client CRM, invoicing, project tracking, e-signatures, task lists, and reports.`,
  };
}

export default async function ToolsDirectoryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  const siteName = data?.value?.site_name || "Aranora";

  // Category mapping for quick badges
  const getCategory = (slug: string) => {
    if (["client-management", "client-intake-forms", "team-collaboration"].includes(slug)) {
      return { name: "Client & Team", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    }
    if (["project-tracking", "task-management", "calendar-scheduling"].includes(slug)) {
      return { name: "Management", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
    }
    return { name: "Finance & Time", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-semibold mb-6 animate-pulse-glow">
            <Sparkles className="h-4 w-4" />
            Empowering Independent Professionals
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 tracking-tight">
            Our Premium Suite of{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Freelance Tools
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Everything you need to run your independent business like a professional agency. 
            Discover the tools we built to simplify your operations, protect your revenues, and delight your clients.
          </p>
        </div>
      </section>

      {/* Grid Directory Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolsRegistry.map((tool, i) => {
              const IconComp = (Icons as any)[tool.iconName] || Icons.HelpCircle;
              const category = getCategory(tool.slug);

              return (
                <div
                  key={tool.slug}
                  className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border p-6 shadow-sm card-brand-hover"
                >
                  <div>
                    {/* Icon & Category Badge */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-md shadow-brand-primary/15 group-hover:scale-110 transition-transform">
                        <IconComp className="h-6 w-6 text-white" />
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${category.color}`}>
                        {category.name}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-brand-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {tool.shortDesc}
                    </p>

                    {/* Features list bullet previews */}
                    <ul className="space-y-2 mb-6">
                      {tool.features.slice(0, 2).map((feat, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-secondary-dark dark:text-brand-secondary mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground font-medium">{feat.title}:</strong> {feat.desc}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 border-t border-border/50">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline group/btn"
                    >
                      Read full definition
                      <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof/Overview Benefits */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Built to Work Harmoniously Together</h2>
            <p className="text-muted-foreground leading-relaxed">
              Why pay for five separate software subscriptions when you can run your client pipeline, contracts, milestones, billing, and collaboration in one seamlessly unified ecosystem?
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="p-6 bg-card border border-border rounded-2xl text-center">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Airtight Safety</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bank-level encryption and secure e-signatures guarantee complete security for you and your clients.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl text-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Lightning Fast Setup</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No complex training needed. Sign up in under 60 seconds and start managing your workspace in minutes.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl text-center">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Compliance Ready</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Perfect for international freelancers. Standardized contracts and multi-currency billing built-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Call to Action */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-3xl p-12 text-white shadow-xl relative overflow-hidden">
          {/* Shimmer background */}
          <div className="absolute inset-0 bg-white/5 opacity-10 blur-xl animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Experience the Complete Ecosystem
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Ready to streamline your client workflows, track time, collect signatures, and automate invoices? Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white hover:bg-neutral-100 text-brand-primary font-bold shadow-md hover:scale-[1.02] transition-transform"
            >
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 text-white hover:bg-white/10 hover:border-white transition-colors"
            >
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/60">
            First month free • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
