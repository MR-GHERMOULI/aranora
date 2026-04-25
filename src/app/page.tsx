import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Briefcase,
  FileText,
  Users,
  BarChart3,
  Shield,
  Zap,
  Star,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Link as LinkIcon,
  Clock,
  CheckSquare,
  CalendarDays,
  UserPlus,
  FileInput,
  FolderOpen,
  Globe,
  Sparkles,
  Lock,
  Rocket,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import PublicNavbar from "@/components/layout/public-navbar";

/* ─── CMS INTERFACE ─── */
interface HomepageContent {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_badge_text: string;
  hero_microcopy: string;
  nav_cta_text: string;
  features_title: string;
  features_subtitle: string;
  how_it_works_title: string;
  how_it_works_subtitle: string;
  how_it_works_steps: { title: string; desc: string }[];
  pricing_title: string;
  pricing_subtitle: string;
  testimonials_title: string;
  testimonials_subtitle: string;
  affiliate_title: string;
  affiliate_subtitle: string;
  affiliate_commission_rate: string;
  affiliate_monthly_earning: string;
  affiliate_annual_earning: string;
  affiliate_perks: { label: string; sub: string }[];
  cta_title: string;
  cta_subtitle: string;
  stats_min_threshold: number;
  features: { iconName: string; title: string; desc: string }[];
  pricing_features: string[];
}

const defaultContent: HomepageContent = {
  hero_title: "Your Freelance Business, Professionally Managed",
  hero_subtitle:
    "The all-in-one platform to manage clients, projects, invoices, contracts, time tracking, and team collaboration. Built by freelancers, for freelancers.",
  hero_cta_text: "Start Free — No Card Required",
  hero_badge_text: "Built for Freelancers, by Freelancers",
  hero_microcopy: "First month free • No credit card required • Cancel anytime",
  nav_cta_text: "Get Started Free",
  features_title: "Everything You Need to Succeed",
  features_subtitle:
    "A complete suite of professional tools designed specifically for freelancers and independent professionals.",
  how_it_works_title: "Get Started in 3 Simple Steps",
  how_it_works_subtitle:
    "Go from sign-up to managing your entire freelance business in minutes.",
  how_it_works_steps: [
    {
      title: "Sign Up Free",
      desc: "Create your account in under 60 seconds. Your first month is completely free — no credit card needed.",
    },
    {
      title: "Set Up Your Workspace",
      desc: "Add your first client, create a project, and configure your invoicing preferences.",
    },
    {
      title: "Run Your Business",
      desc: "Manage everything from one dashboard — clients, projects, invoices, contracts, and more.",
    },
  ],
  pricing_title: "Simple, Transparent Pricing",
  pricing_subtitle:
    "Start with your first month free. No credit card required. Upgrade when you're ready.",
  testimonials_title: "Trusted by Freelancers Worldwide",
  testimonials_subtitle:
    "See how {siteName} is helping freelancers run their businesses with confidence.",
  affiliate_title: "Earn by Spreading the Word",
  affiliate_subtitle:
    "Join our affiliate program and earn recurring commissions on every customer you refer.",
  affiliate_commission_rate: "30%",
  affiliate_monthly_earning: "$5.70",
  affiliate_annual_earning: "$57.00",
  affiliate_perks: [
    { label: "30% Commission", sub: "Industry-leading rate" },
    { label: "12-Month Window", sub: "On monthly plans" },
    { label: "Unique Links", sub: "Track every click" },
    { label: "$50 Min Payout", sub: "Via PayPal or Bank" },
  ],
  cta_title: "Ready to Run Your Freelance Business Like a Pro?",
  cta_subtitle:
    "Join a growing community of freelancers who trust {siteName} to manage every aspect of their business.",
  stats_min_threshold: 50,
  features: [
    {
      iconName: "Users",
      title: "Client Management",
      desc: "Organize contacts, track history, manage relationships and communications — all in one place.",
    },
    {
      iconName: "Briefcase",
      title: "Project Tracking",
      desc: "Manage projects with tasks, milestones, deadlines, and share real-time progress with clients.",
    },
    {
      iconName: "FileText",
      title: "Smart Invoicing",
      desc: "Create professional invoices, track payment status, and get paid faster with integrated billing.",
    },
    {
      iconName: "Shield",
      title: "Contracts & E-Signatures",
      desc: "Generate PDF contracts and collect legally binding digital signatures — no third-party tools needed.",
    },
    {
      iconName: "Clock",
      title: "Time Tracking",
      desc: "Log billable hours per project, track time entries, and convert them directly into invoices.",
    },
    {
      iconName: "CheckSquare",
      title: "Task Management",
      desc: "Create, assign, and prioritize tasks with deadlines. Delegate work and track completion across your team.",
    },
    {
      iconName: "CalendarDays",
      title: "Calendar & Scheduling",
      desc: "Visualize your timeline with deadlines, milestones, and appointments in a unified calendar view.",
    },
    {
      iconName: "UserPlus",
      title: "Team Collaboration",
      desc: "Invite collaborators to projects, delegate tasks, and monitor team activity with real-time feeds.",
    },
    {
      iconName: "FileInput",
      title: "Client Intake Forms",
      desc: "Build custom onboarding questionnaires to collect project requirements from new clients professionally.",
    },
    {
      iconName: "BarChart3",
      title: "Reports & Analytics",
      desc: "Get insights into your revenue, project metrics, client activity, and overall business performance.",
    },
  ],
  pricing_features: [
    "Unlimited clients & projects",
    "Smart invoicing & contracts",
    "E-signatures & PDF generation",
    "Time tracking & reports",
    "Team collaboration",
    "Calendar & task management",
    "Client intake forms",
    "File management",
    "Client portal with progress sharing",
    "Priority support",
  ],
};

const LucideIcons: Record<string, any> = {
  Users, Briefcase, FileText, Shield, Clock, CheckSquare, CalendarDays, UserPlus, FileInput, BarChart3, Star, Zap, Lock, Rocket, Globe, Sparkles
};

/* ─── HOW IT WORKS ICONS ─── */
const stepIcons = [UserPlus, FolderOpen, Briefcase];

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch branding settings
  const { data: brandingSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  
  const siteName = brandingSetting?.value?.site_name || "Aranora";

  // Fetch homepage content from settings
  const { data: homepageSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage")
    .single();

  const content: HomepageContent = homepageSetting?.value
    ? { ...defaultContent, ...homepageSetting.value }
    : defaultContent;

  // Replace placeholders in content
  const processPlaceholder = (text: string) => text.replace(/\{siteName\}/g, siteName);
  content.testimonials_subtitle = processPlaceholder(content.testimonials_subtitle);
  content.cta_subtitle = processPlaceholder(content.cta_subtitle);

  const branding = brandingSetting?.value || {};
  const logoUrl = branding.logo_url;

  const { createServerClient } = await import("@supabase/ssr");
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() { } } }
  );

  // Fetch real user count for social proof
  const { count: userCount } = await serviceClient
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Fetch real country count
  const { data: countries } = await serviceClient
    .from("profiles")
    .select("country");

  const uniqueCountries = new Set(
    countries
      ?.map((c) => c.country)
      .filter((c) => c && c !== "Unknown" && c.trim() !== "")
  );
  const countryCount = Math.max(uniqueCountries.size, 1);

  // Fetch real projects created
  const { count: projectsCount } = await serviceClient
    .from("projects")
    .select("*", { count: "exact", head: true });

  // Fetch real contracts signed
  const { count: contractsCount } = await serviceClient
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("status", ["signed", "completed"]);

  // Fetch total invoices completed
  const { data: invoicesData } = await serviceClient
    .from("invoices")
    .select("total")
    .eq("status", "paid");

  const totalInvoicesAmount = invoicesData?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0;

  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    return `$${Math.round(amount)}`;
  };

  // Smart social proof threshold check
  const showStats = (userCount || 0) >= content.stats_min_threshold;

  // Fetch testimonials from DB
  const { data: dbTestimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const testimonials =
    dbTestimonials && dbTestimonials.length > 0
      ? dbTestimonials.map((t) => ({
        name: t.name,
        role: t.service,
        quote: t.content,
        avatarUrl: t.avatar_url,
        avatar: t.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        rating: t.rating || 5,
      }))
      : [
        {
          name: "Sarah Chen",
          role: "UI/UX Designer",
          quote:
            `$\{siteName\} transformed how I manage my freelance business. The invoicing feature alone saved me hours every week.`,
          avatar: "SC",
          avatarUrl: "",
          rating: 5,
        },
        {
          name: "Marcus Johnson",
          role: "Web Developer",
          quote:
            "Finally, a tool that understands freelancers. The project collaboration features are game-changing.",
          avatar: "MJ",
          avatarUrl: "",
          rating: 5,
        },
        {
          name: "Elena Rodriguez",
          role: "Content Strategist",
          quote:
            `The smart reminders keep me on top of everything. I've never missed a deadline since using $\{siteName\}.`,
          avatar: "ER",
          avatarUrl: "",
          rating: 5,
        },
      ];

  // Fetch platform links from DB
  const { data: platformLinks } = await supabase
    .from("platform_links")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const platforms =
    platformLinks && platformLinks.length > 0
      ? platformLinks.map((p) => p.name)
      : ["Upwork", "Fiverr", "Toptal", "Freelancer", "99designs"];

  // Prepare how-it-works steps (merge CMS data with icons)
  const howItWorksSteps = (content.how_it_works_steps || defaultContent.how_it_works_steps).map(
    (step, i) => ({
      ...step,
      icon: stepIcons[i] || Briefcase,
      step: String(i + 1).padStart(2, "0"),
    })
  );

  // Affiliate perks with icons
  const affiliatePerks = content.affiliate_perks || defaultContent.affiliate_perks;
  const perkIcons = [TrendingUp, CheckCircle2, LinkIcon, DollarSign];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* ═══════════ NAVIGATION ═══════════ */}
      <PublicNavbar />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-mesh" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-mesh" style={{ animationDelay: "5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/3 rounded-full blur-3xl animate-mesh" style={{ animationDelay: "10s" }} />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <FadeIn delay={0.2} className="text-center max-w-4xl mx-auto">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
              {content.hero_title.includes("Professionally") ? (
                <>
                  {content.hero_title.split("Professionally")[0]}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                    Professionally
                  </span>
                  {content.hero_title.split("Professionally")[1]}
                </>
              ) : content.hero_title.includes("Like a Pro") ? (
                <>
                  {content.hero_title.split("Like a Pro")[0]}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                    Like a Pro
                  </span>
                </>
              ) : (
                content.hero_title
              )}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {content.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-brand-primary hover:bg-brand-primary-light text-lg px-8 py-6 shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:scale-[1.02]"
              >
                <Link href="/signup">
                  {content.hero_cta_text}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 py-6 border-border hover:bg-muted/50 transition-all"
              >
                <a href="#features">
                  See All Features <ChevronRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {content.hero_microcopy}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF BAR ═══════════ */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showStats ? (
            /* Full metrics — only shown when stats are meaningful */
            <FadeIn>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-10">
                {[
                  { value: `${userCount || 0}+`, label: "Registered Freelancers", icon: Users },
                  { value: `${countryCount}+`, label: "Countries", icon: Globe },
                  { value: `${projectsCount || 0}+`, label: "Projects Created", icon: FolderOpen },
                  { value: `${contractsCount || 0}+`, label: "Contracts Signed", icon: FileText },
                  { value: `${formatCurrency(totalInvoicesAmount)}`, label: "Processed Invoices", icon: DollarSign },
                  { value: content.affiliate_commission_rate, label: "Affiliate Commission", icon: TrendingUp },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <stat.icon className="h-5 w-5 text-brand-primary" />
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          ) : (
            /* Trust badges — shown when stats are too low to be meaningful */
            <FadeIn>
              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 mb-10">
                {[
                  { icon: Lock, label: "Enterprise-Grade Security" },
                  { icon: Zap, label: "Lightning Fast" },
                  { icon: Globe, label: "Works Globally" },
                  { icon: Shield, label: "GDPR Compliant" },
                  { icon: Rocket, label: "99.9% Uptime" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <badge.icon className="h-4 w-4 text-brand-primary" />
                    <span className="text-sm font-medium">{badge.label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Freelancing Platforms */}
          <div className="border-t border-border pt-8">
            <p className="text-center text-xs text-muted-foreground mb-5 uppercase tracking-wider font-semibold">
              Ideal for freelancers working on the world&apos;s top platforms
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-50 hover:opacity-70 transition-opacity">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="text-lg font-bold text-muted-foreground tracking-wide"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {content.features_title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.features_subtitle}
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.features?.map((feature, i) => {
              const Icon = LucideIcons[feature.iconName] || Zap;
              return (
                <StaggerItem
                  key={i}
                  className="group p-6 rounded-2xl bg-card border border-border card-brand-hover"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand-primary/15">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <div className="section-divider" />
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {content.how_it_works_title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {content.how_it_works_subtitle}
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-0.5 bg-gradient-to-r from-brand-primary/30 via-brand-primary/15 to-brand-primary/30" />

            {howItWorksSteps.map((item) => (
              <StaggerItem key={item.step} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-bold text-brand-primary mb-2 tracking-widest uppercase">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════ PRICING SECTION ═══════════ */}
      <div className="section-divider" />
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              First Month Free
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {content.pricing_title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.pricing_subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Monthly Card */}
            <ScaleIn delay={0.1} className="relative rounded-2xl border border-border bg-card p-8 card-brand-hover group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-brand-primary/10">
                  <Star className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Monthly</h3>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-foreground">
                    $19
                  </span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Billed monthly. Cancel anytime.
                </p>
              </div>
              <Button
                size="lg"
                asChild
                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all"
              >
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </ScaleIn>

            {/* Annual Card */}
            <ScaleIn delay={0.2} className="relative rounded-2xl border-2 border-brand-primary/50 bg-card p-8 shadow-xl shadow-brand-primary/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-brand-primary to-brand-primary-light text-white px-4 py-1.5 rounded-full shadow-lg">
                  <Zap className="h-3 w-3" />
                  BEST VALUE — SAVE $38
                </span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-brand-secondary/10">
                  <Sparkles className="h-6 w-6 text-brand-secondary-dark dark:text-brand-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Annual</h3>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-foreground">
                    $190
                  </span>
                  <span className="text-muted-foreground text-lg">/year</span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  <span className="line-through">$228/year</span>
                  <span className="text-brand-secondary-dark dark:text-brand-secondary ml-2 font-semibold">
                    2 months free!
                  </span>
                </p>
              </div>
              <Button
                size="lg"
                asChild
                className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-light hover:from-brand-primary-light hover:to-brand-primary text-white shadow-lg shadow-brand-primary/25 transition-all"
              >
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </ScaleIn>
          </div>

          {/* Feature checklist */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center text-base font-semibold text-foreground mb-6">
              Everything included in both plans
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {(content.pricing_features || []).map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-secondary/15 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-secondary-dark dark:text-brand-secondary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/pricing"
                className="text-sm text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                View full pricing details <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <div className="section-divider" />
      <section
        id="testimonials"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {content.testimonials_title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {content.testimonials_subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border card-brand-hover relative group"
              >
                {/* Quote mark */}
                <div className="absolute top-4 right-4 text-4xl text-brand-primary/10 font-serif leading-none group-hover:text-brand-primary/20 transition-colors">
                  &ldquo;
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-brand-secondary text-brand-secondary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  {testimonial.avatarUrl ? (
                    <img
                      src={testimonial.avatarUrl}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {testimonial.avatar}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AFFILIATE PROGRAM ═══════════ */}
      <div className="section-divider" />
      <section
        id="affiliates"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        {/* Subtle brand gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/[0.03] via-transparent to-brand-secondary/[0.03] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary/10 text-brand-secondary-dark dark:text-brand-secondary text-sm font-semibold mb-6 border border-brand-secondary/20">
              <TrendingUp className="h-4 w-4" />
              Affiliate Partner Program
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {content.affiliate_title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.affiliate_subtitle}{" "}
              <span className="text-brand-secondary-dark dark:text-brand-secondary font-semibold">
                {content.affiliate_commission_rate} commission
              </span>{" "}
              on every customer you refer — for 12 full months.
            </p>
          </div>

          {/* Commission Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            <div className="relative group rounded-2xl border border-border bg-card p-8 card-brand-hover">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full font-medium">
                  Monthly
                </span>
              </div>
              <DollarSign className="h-12 w-12 text-brand-primary mb-4" />
              <div className="text-4xl font-extrabold text-foreground mb-1">
                {content.affiliate_monthly_earning}
              </div>
              <div className="text-muted-foreground text-sm mb-4">
                per month × 12 months
              </div>
              <div className="text-sm text-muted-foreground">
                For every customer who subscribes to the{" "}
                <span className="text-foreground font-medium">$19/month</span> plan,
                you earn {content.affiliate_monthly_earning} every month for a full year.
              </div>
              <div className="mt-4 pt-4 border-t border-border text-brand-primary font-bold">
                Up to $68.40 per referral
              </div>
            </div>
            <div className="relative group rounded-2xl border border-border bg-card p-8 card-brand-hover">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-brand-secondary/10 text-brand-secondary-dark dark:text-brand-secondary border border-brand-secondary/20 px-2.5 py-1 rounded-full font-medium">
                  Annual
                </span>
              </div>
              <DollarSign className="h-12 w-12 text-brand-secondary-dark dark:text-brand-secondary mb-4" />
              <div className="text-4xl font-extrabold text-foreground mb-1">
                {content.affiliate_annual_earning}
              </div>
              <div className="text-muted-foreground text-sm mb-4">
                one-time commission
              </div>
              <div className="text-sm text-muted-foreground">
                For every customer who subscribes to the{" "}
                <span className="text-foreground font-medium">$190/year</span> plan,
                you earn {content.affiliate_annual_earning} in a single payment.
              </div>
              <div className="mt-4 pt-4 border-t border-border text-brand-secondary-dark dark:text-brand-secondary font-bold">
                Instant {content.affiliate_annual_earning} per referral
              </div>
            </div>
          </div>

          {/* How It Works — Affiliate */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "1",
                title: "Apply & Get Approved",
                desc: "Register as an affiliate partner. No platform subscription required — just sign up and get your unique link.",
              },
              {
                step: "2",
                title: "Share Your Link",
                desc: "Share your personalized referral link via your website, social media, email newsletters, or YouTube channel.",
              },
              {
                step: "3",
                title: "Earn Commissions",
                desc: "Get 30% of every payment made by your referrals — automatically tracked and credited to your account.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-card border border-border rounded-2xl p-6 text-center card-brand-hover"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-foreground font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {affiliatePerks.map((perk, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 card-brand-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  {perkIcons[i] ? (
                    (() => {
                      const Icon = perkIcons[i];
                      return <Icon className="h-5 w-5 text-brand-primary" />;
                    })()
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                  )}
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">
                    {perk.label}
                  </div>
                  <div className="text-muted-foreground text-xs">{perk.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/become-affiliate"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-brand-primary-light hover:to-brand-primary transition-all shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-105"
            >
              Become an Affiliate Partner{" "}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              No platform subscription required • Free to join • Get paid
              monthly
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <div className="section-divider" />
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-primary rounded-3xl p-12 sm:p-16 text-white shadow-2xl shadow-brand-primary/20">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                {content.cta_title}
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto">
                {content.cta_subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="text-lg px-8 py-6 shadow-xl hover:scale-[1.02] transition-transform"
                >
                  <Link href="/signup">
                    {content.nav_cta_text}{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-lg px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all"
                >
                  <Link href="/pricing">
                    View Pricing{" "}
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <Footer />
    </div>
  );
}
