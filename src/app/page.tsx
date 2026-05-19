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
  X,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import PublicNavbar from "@/components/layout/public-navbar";
import { unstable_cache } from "next/cache";

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
    "The all-in-one freelancer management platform to manage clients, projects, invoices, contracts, time tracking, and team collaboration. Built by freelancers, for freelancers.",
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

/* ─── CACHED DATABASE QUERIES ─── */
const fetchPlatformSettings = (key: string) => 
  unstable_cache(
    async () => {
      const { createServerClient } = await import("@supabase/ssr");
      const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return [] }, setAll() { } } }
      );

      const { data: setting } = await serviceClient
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .single();

      return setting?.value || null;
    },
    [`platform-settings-${key}`],
    { revalidate: 600, tags: [`platform-setting-${key}`] }
  )();

const fetchPlatformStats = unstable_cache(
  async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() { } } }
    );

    const [
      { count: userCount },
      { data: countries },
      { count: projectsCount },
      { count: contractsCount },
      { data: invoicesData }
    ] = await Promise.all([
      serviceClient.from("profiles").select("*", { count: "exact", head: true }),
      serviceClient.from("profiles").select("country"),
      serviceClient.from("projects").select("*", { count: "exact", head: true }),
      serviceClient.from("contracts").select("*", { count: "exact", head: true }).in("status", ["signed", "completed"]),
      serviceClient.from("invoices").select("total").eq("status", "paid")
    ]);

    const uniqueCountries = new Set(
      countries
        ?.map((c) => c.country)
        .filter((c) => c && c !== "Unknown" && c.trim() !== "")
    );
    const countryCount = Math.max(uniqueCountries.size, 1);
    const totalInvoicesAmount = invoicesData?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0;

    return {
      userCount: userCount || 0,
      countryCount,
      projectsCount: projectsCount || 0,
      contractsCount: contractsCount || 0,
      totalInvoicesAmount,
    };
  },
  ["platform-global-stats"],
  { revalidate: 600, tags: ["platform-stats"] }
);

const fetchHomeTestimonials = unstable_cache(
  async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() { } } }
    );

    const { data: dbTestimonials } = await serviceClient
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3);

    return dbTestimonials || [];
  },
  ["platform-home-testimonials"],
  { revalidate: 600, tags: ["platform-testimonials"] }
);

const fetchPlatformLinks = unstable_cache(
  async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() { } } }
    );

    const { data: platformLinks } = await serviceClient
      .from("platform_links")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    return platformLinks || [];
  },
  ["platform-links-cache"],
  { revalidate: 600, tags: ["platform-links"] }
);

export default async function LandingPage() {
  // Fetch branding settings
  const branding = await fetchPlatformSettings("branding") || {};
  const siteName = branding.site_name || "Aranora";

  // Fetch homepage content from settings
  const homepageSettingValue = await fetchPlatformSettings("homepage");

  const content: HomepageContent = homepageSettingValue
    ? { ...defaultContent, ...homepageSettingValue }
    : defaultContent;

  // Replace placeholders in content
  const processPlaceholder = (text: string) => text.replace(/\{siteName\}/g, siteName);
  content.testimonials_subtitle = processPlaceholder(content.testimonials_subtitle);
  content.cta_subtitle = processPlaceholder(content.cta_subtitle);

  const logoUrl = branding.logo_url;

  // Fetch cached stats in parallel
  const {
    userCount,
    countryCount,
    projectsCount,
    contractsCount,
    totalInvoicesAmount,
  } = await fetchPlatformStats();

  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    return `$${Math.round(amount)}`;
  };

  // Smart social proof threshold check
  const showStats = (userCount || 0) >= content.stats_min_threshold;

  // Fetch testimonials from DB (cached)
  const dbTestimonials = await fetchHomeTestimonials();

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

  // Fetch platform links from DB (cached)
  const platformLinks = await fetchPlatformLinks();

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
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs sm:text-sm font-semibold mb-6 tracking-wide animate-pulse-glow">
              <Sparkles className="h-4 w-4 text-brand-secondary" />
              The Professional Freelancer Management Platform
            </div>
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
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF BAR ═══════════ */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showStats ? (
            /* Full metrics — only shown when stats are meaningful */
            <FadeIn>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 mb-10 max-w-5xl mx-auto">
                {[
                  { value: `${userCount || 0}+`, label: "Registered Freelancers", icon: Users },
                  { value: `${countryCount}+`, label: "Countries", icon: Globe },
                  { value: `${projectsCount || 0}+`, label: "Projects Created", icon: FolderOpen },
                  { value: `${contractsCount || 0}+`, label: "Contracts Signed", icon: FileText },
                  { value: `${formatCurrency(totalInvoicesAmount)}`, label: "Processed Invoices", icon: DollarSign },
                  { value: content.affiliate_commission_rate, label: "Affiliate Commission", icon: TrendingUp },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 sm:p-4 bg-card border border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <stat.icon className="h-4 sm:h-5 w-4 sm:w-5 text-brand-primary" />
                      <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-tight">
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
            <div className="flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-10 gap-y-4 opacity-50 hover:opacity-70 transition-opacity">
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

      {/* ═══════════ COMPARISON MATRIX ═══════════ */}
      <div className="section-divider" />
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/20 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-brand-secondary/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs sm:text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4 text-brand-secondary" />
              Strategic Advantage
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Aranora vs. Legacy Freelancer Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how integrating your entire independent business workflow compares to disjointed folders, spreadsheets, and manual tracking.
            </p>
          </div>

          <FadeIn className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-5 font-semibold text-foreground text-sm sm:text-base">Operational Capability</th>
                  <th className="p-5 font-semibold text-brand-primary text-sm sm:text-base bg-brand-primary/5 text-center w-1/3 border-x border-brand-primary/10">
                    <span className="flex items-center justify-center gap-1.5 font-bold">
                      <Sparkles className="h-4 w-4 text-brand-secondary" />
                      {siteName} Workspace
                    </span>
                  </th>
                  <th className="p-5 font-semibold text-muted-foreground text-sm sm:text-base text-center w-1/3">Legacy / Disjointed Systems</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    capability: "Centralized Client Intake",
                    aranora: "Automated custom intake forms that map data directly into projects",
                    legacy: "Scattered emails, copy-pasting, and manually created folders",
                    check: true
                  },
                  {
                    capability: "Legally Binding Agreements",
                    aranora: "One-click templates with built-in professional e-signatures and PDF exports",
                    legacy: "Third-party paid electronic signature apps or scanned paper signatures",
                    check: true
                  },
                  {
                    capability: "Smart Global Invoicing",
                    aranora: "Automatic regional VAT/GST line calculation, local banking & auto-reminders",
                    legacy: "Manual Excel templates, manual calculations, and awkward follow-up messages",
                    check: true
                  },
                  {
                    capability: "Embedded Time Tracking",
                    aranora: "One-click timer linked directly to project tasks and invoice line items",
                    legacy: "Separate stopwatch apps and tedious manual calendar entries",
                    check: true
                  },
                  {
                    capability: "Dedicated Client Progress Portal",
                    aranora: "Transparent, secure client boards sharing real-time task milestone status",
                    legacy: "Endless status update emails, calls, and chat message threads",
                    check: true
                  },
                  {
                    capability: "Subscription Overhead Costs",
                    aranora: "All-in-one monthly plan covering all operations with zero hidden commissions",
                    legacy: "Multiple billing accounts, SaaS subscription fatigue, and platform percentage fees",
                    check: false
                  }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="p-5 font-medium text-foreground text-sm sm:text-base">
                      {row.capability}
                    </td>
                    <td className="p-5 text-center bg-brand-primary/5 border-x border-brand-primary/10 text-sm sm:text-base">
                      <div className="flex flex-col items-center gap-2">
                        {row.check ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <span className="text-xs font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">Included</span>
                        )}
                        <span className="text-xs font-semibold text-brand-primary max-w-[200px] leading-snug hidden sm:inline-block">
                          {row.aranora}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-center text-sm sm:text-base text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <X className="h-5 w-5 text-muted-foreground/35 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground/70 max-w-[200px] leading-snug hidden sm:inline-block">
                          {row.legacy}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ GLOBAL COMPLIANCE & GEO STANDARDS ═══════════ */}
      <div className="section-divider" />
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-brand-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-secondary/15 border border-brand-secondary/30 text-brand-secondary-dark dark:text-brand-secondary text-xs sm:text-sm font-semibold mb-4">
              <Globe className="h-4 w-4" />
              Geographic SEO & Global Readiness
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Global Standards, Localized Compliance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empowering independent businesses across the globe with bulletproof regional tax models, legal frameworks, and secure multi-currency operations.
            </p>
          </div>

          <StaggerContainer className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                region: "United States & North America",
                title: "IRS W-9 / 1099 Readiness & ACH",
                desc: "Generate professional contracts with W-9 document links, set up seamless 1099-NEC contractor reporting markers, and bill directly using ACH transfers. Fully optimized for EST, CST, MST, and PST business hours."
              },
              {
                icon: Lock,
                region: "European Union & United Kingdom",
                title: "100% GDPR Compliant & VAT Invoicing",
                desc: "Process client records under airtight GDPR data hosting protection. Automatically calculate localized EU/UK VAT tax invoice line items with proper reverse-charge tax terms, IBAN coordinates, and SEPA payouts."
              },
              {
                icon: DollarSign,
                region: "Australia & Asia-Pacific",
                title: "GST Regulations & Regional Banks",
                desc: "Create legally compliant GST tax invoices for clients in Australia, New Zealand, and Singapore. Configure localized bank details, dynamic currency setups (AUD, NZD, SGD), and custom business registration numbers."
              },
              {
                icon: Globe,
                region: "Global Infrastructure",
                title: "120+ Currencies & Multi-Timezones",
                desc: "Work internationally with smart multi-currency invoicing. Automatically convert rates, customize local regional contact endpoints, and share transparent client portal progress boards across all global timezones."
              }
            ].map((card, i) => {
              const CardIcon = card.icon;
              return (
                <StaggerItem
                  key={i}
                  className="group relative p-6 sm:p-8 bg-card border border-border rounded-2xl card-brand-hover shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-brand-primary/5">
                      <CardIcon className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-primary/80 uppercase tracking-widest block">
                        {card.region}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {card.desc}
                  </p>
                </StaggerItem>
              );
            })}
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
            <ScaleIn delay={0.1} className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 card-brand-hover group">
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
            <ScaleIn delay={0.2} className="relative rounded-2xl border-2 border-brand-primary/50 bg-card p-6 sm:p-8 shadow-xl shadow-brand-primary/10">
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
                      width={40}
                      height={40}
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
            <div className="relative group rounded-2xl border border-border bg-card p-6 sm:p-8 card-brand-hover">
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
            <div className="relative group rounded-2xl border border-border bg-card p-6 sm:p-8 card-brand-hover">
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

      {/* ═══════════ FREQUENTLY ASKED QUESTIONS (FAQ) ═══════════ */}
      <div className="section-divider" />
      <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about {siteName} and how it can help grow your freelance business.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: `What is ${siteName}?`,
                a: `${siteName} is the ultimate freelancer management platform. It unites your clients, projects, contracts, invoices, and time tracking in one elegant workspace built to help you run a successful independent business.`
              },
              {
                q: "Is my data secure?",
                a: "Yes, your data is completely secure. We use advanced database policies, encrypted payment channels, and industry-standard protection to ensure your business files and client records are safe."
              },
              {
                q: "How does the 30-day free trial work?",
                a: "You get full, unrestricted access to every feature—including PDF contract generation and automated invoicing reminders—for your first 30 days. No credit card is required to sign up, and you can cancel anytime."
              },
              {
                q: "Can I invite clients to collaborate on projects?",
                a: "Yes! You can invite clients directly into specific projects as external collaborators. This lets them view board progress, log feedback, check task milestones, and approve time entries with professional transparency."
              },
              {
                q: "How does the Affiliate Program work?",
                a: "Our affiliate program is free to join and does not require a paid platform subscription. You receive a unique partner link and earn a recurring 30% commission on every subscriber you refer for 12 full months."
              },
              {
                q: "Can I export invoices and signed contracts?",
                a: "Yes. You can generate legally binding digital signatures on custom contracts and instantly export both invoices and agreements as professional PDF documents with one-click."
              }
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-border bg-card rounded-2xl p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 open:shadow-lg open:shadow-brand-primary/5 hover:border-brand-primary/30"
              >
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="text-base sm:text-lg font-bold text-foreground pr-4 select-none">
                    {faq.q}
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:-rotate-180 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed transition-all">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Structured SEO Schema Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://aranora.com/#software",
                  "name": siteName,
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "All",
                  "offers": {
                    "@type": "Offer",
                    "price": "19.00",
                    "priceCurrency": "USD",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "19.00",
                      "priceCurrency": "USD",
                      "referenceQuantity": {
                        "@type": "QuantitativeValue",
                        "value": "1",
                        "unitCode": "MON"
                      }
                    }
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "384"
                  },
                  "featureList": [
                    "Centralized Client Intake",
                    "Legally Binding Digital Contracts & E-Signatures",
                    "Professional Invoicing & Dynamic VAT/GST Calculator",
                    "Real-Time Client & Project Time Tracker",
                    "Shared Client Collaboration Progress Portal"
                  ]
                },
                {
                  "@type": "Organization",
                  "@id": "https://aranora.com/#organization",
                  "name": siteName,
                  "url": "https://aranora.com",
                  "logo": "https://aranora.com/api/favicon",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "email": "support@aranora.com"
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "US",
                    "addressLocality": "San Francisco",
                    "addressRegion": "CA"
                  }
                },
                {
                  "@type": "FAQPage",
                  "@id": "https://aranora.com/#faq",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": `What is ${siteName}?`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `${siteName} is the ultimate freelancer management platform. It unites your clients, projects, contracts, invoices, and time tracking in one elegant workspace built to help you run a successful independent business.`
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Is my data secure?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, your data is completely secure. We use advanced database policies, encrypted payment channels, and industry-standard protection to ensure your business files and client records are safe."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How does the 30-day free trial work?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "You get full, unrestricted access to every feature—including PDF contract generation and automated invoicing reminders—for your first 30 days. No credit card is required to sign up, and you can cancel anytime."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I invite clients to collaborate on projects?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! You can invite clients directly into specific projects as external collaborators. This lets them view board progress, log feedback, check task milestones, and approve time entries with professional transparency."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How does the Affiliate Program work?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Our affiliate program is free to join and does not require a paid platform subscription. You receive a unique partner link and earn a recurring 30% commission on every subscriber you refer for 12 full months."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I export invoices and signed contracts?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. You can generate legally binding digital signatures on custom contracts and instantly export both invoices and agreements as professional PDF documents with one-click."
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <Footer />
    </div>
  );
}
