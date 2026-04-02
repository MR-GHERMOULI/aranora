import Link from "next/link";
import Image from "next/image";
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
  Menu,
  Globe,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

interface HomepageContent {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  features_title: string;
  features_subtitle: string;
  pricing_title: string;
  pricing_subtitle: string;
  testimonials_title: string;
  testimonials_subtitle: string;
  cta_title: string;
  cta_subtitle: string;
}

const defaultContent: HomepageContent = {
  hero_title: "Your Freelance Business, Professionally Managed",
  hero_subtitle:
    "The all-in-one platform to manage clients, projects, invoices, contracts, time tracking, and team collaboration. Built by freelancers, for freelancers.",
  hero_cta_text: "Start Free — No Card Required",
  features_title: "Everything You Need to Succeed",
  features_subtitle:
    "A complete suite of professional tools designed specifically for freelancers and independent professionals.",
  pricing_title: "Simple, Transparent Pricing",
  pricing_subtitle:
    "Start with your first month free. No credit card required. Upgrade when you're ready.",
  testimonials_title: "Trusted by Freelancers Worldwide",
  testimonials_subtitle:
    "See how Aranora is helping freelancers run their businesses with confidence.",
  cta_title: "Ready to Run Your Freelance Business Like a Pro?",
  cta_subtitle:
    "Join a growing community of freelancers who trust Aranora to manage every aspect of their business.",
};

const features = [
  {
    icon: Users,
    title: "Client Management",
    desc: "Organize contacts, track client history, manage relationships and communications — all in one place.",
    color: "bg-blue-500",
    gradient: "from-blue-500/10 to-blue-600/5",
  },
  {
    icon: Briefcase,
    title: "Project Tracking",
    desc: "Manage projects with tasks, milestones, deadlines, and share real-time progress with clients.",
    color: "bg-violet-500",
    gradient: "from-violet-500/10 to-violet-600/5",
  },
  {
    icon: FileText,
    title: "Smart Invoicing",
    desc: "Create professional invoices, track payment status, and get paid faster with integrated billing.",
    color: "bg-orange-500",
    gradient: "from-orange-500/10 to-orange-600/5",
  },
  {
    icon: Shield,
    title: "Contracts & E-Signatures",
    desc: "Generate PDF contracts and collect legally binding digital signatures — no third-party tools needed.",
    color: "bg-emerald-500",
    gradient: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Log billable hours per project, track time entries, and convert them directly into invoices.",
    color: "bg-cyan-500",
    gradient: "from-cyan-500/10 to-cyan-600/5",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    desc: "Create, assign, and prioritize tasks with deadlines. Delegate work and track completion across your team.",
    color: "bg-pink-500",
    gradient: "from-pink-500/10 to-pink-600/5",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Scheduling",
    desc: "Visualize your timeline with deadlines, milestones, and appointments in a unified calendar view.",
    color: "bg-amber-500",
    gradient: "from-amber-500/10 to-amber-600/5",
  },
  {
    icon: UserPlus,
    title: "Team Collaboration",
    desc: "Invite collaborators to projects, delegate tasks, and monitor team activity with real-time feeds.",
    color: "bg-indigo-500",
    gradient: "from-indigo-500/10 to-indigo-600/5",
  },
  {
    icon: FileInput,
    title: "Client Intake Forms",
    desc: "Build custom onboarding questionnaires to collect project requirements from new clients professionally.",
    color: "bg-teal-500",
    gradient: "from-teal-500/10 to-teal-600/5",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Get insights into your revenue, project metrics, client activity, and overall business performance.",
    color: "bg-rose-500",
    gradient: "from-rose-500/10 to-rose-600/5",
  },
];

const pricingFeatures = [
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
];

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch homepage content from settings
  const { data: homepageSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage")
    .single();

  const content: HomepageContent = homepageSetting?.value
    ? { ...defaultContent, ...homepageSetting.value }
    : defaultContent;

  // Fetch real user count for social proof
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Fetch real country count for social proof
  const { data: countries } = await supabase
    .from("profiles")
    .select("country");

  const uniqueCountries = new Set(
    countries
      ?.map((c) => c.country)
      .filter((c) => c && c !== "Unknown" && c.trim() !== "")
  );
  const countryCount = Math.max(uniqueCountries.size, 1);

  // Fetch real contracts signed
  const { count: contractsCount } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("status", ["signed", "completed"]);

  // Fetch total invoices completed
  const { data: invoicesData } = await supabase
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
          name: t.author_name,
          role: t.author_role,
          quote: t.content,
          avatar: t.author_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        }))
      : [
          {
            name: "Sarah Chen",
            role: "UI/UX Designer",
            quote:
              "Aranora transformed how I manage my freelance business. The invoicing feature alone saved me hours every week.",
            avatar: "SC",
          },
          {
            name: "Marcus Johnson",
            role: "Web Developer",
            quote:
              "Finally, a tool that understands freelancers. The project collaboration features are game-changing.",
            avatar: "MJ",
          },
          {
            name: "Elena Rodriguez",
            role: "Content Strategist",
            quote:
              "The smart reminders keep me on top of everything. I've never missed a deadline since using Aranora.",
            avatar: "ER",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* ========== NAVIGATION ========== */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-brand-primary tracking-tight">
                Aranora
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Testimonials
              </a>
              <a
                href="#affiliates"
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors"
              >
                Affiliates
              </a>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Blog
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="bg-brand-primary hover:bg-brand-primary-light shadow-lg shadow-brand-primary/20 transition-all hover:shadow-brand-primary/30"
              >
                <Link href="/signup">
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <FadeIn delay={0.2} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-sm font-semibold mb-8 border border-brand-primary/20 hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-4 w-4" />
              Built for Freelancers, by Freelancers
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
              {content.hero_title.includes("Professionally") ? (
                <>
                  {content.hero_title.split("Professionally")[0]}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent opacity-90 hover:opacity-100 transition-opacity">
                    Professionally
                  </span>
                  {content.hero_title.split("Professionally")[1]}
                </>
              ) : content.hero_title.includes("Like a Pro") ? (
                <>
                  {content.hero_title.split("Like a Pro")[0]}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent opacity-90 hover:opacity-100 transition-opacity">
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
              First month free • No credit card required • Cancel anytime
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ========== SOCIAL PROOF BAR ========== */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Real metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-10">
            {[
              {
                value: `${userCount || 0}+`,
                label: "Registered Freelancers",
                icon: Users,
              },
              {
                value: `${countryCount}+`,
                label: "Countries",
                icon: Globe,
              },
              {
                value: `${features.length}+`,
                label: "Professional Tools",
                icon: Zap,
              },
              {
                value: `${contractsCount || 0}+`,
                label: "Contracts Signed",
                icon: FileText,
              },
              {
                value: `${formatCurrency(totalInvoicesAmount)}`,
                label: "Processed Invoices",
                icon: DollarSign,
              },
              {
                value: "30%",
                label: "Affiliate Commission",
                icon: TrendingUp,
              },
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

      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary/10 text-brand-secondary-dark dark:text-brand-secondary text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              Complete Toolkit
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {content.features_title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.features_subtitle}
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {features.map((feature, i) => (
              <StaggerItem
                key={i}
                className={`group p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-card border border-border hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 hover:-translate-y-1 ${i < 5 ? "" : ""}`}
              >
                <div
                  className={`h-11 w-11 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Go from sign-up to managing your entire freelance business in
              minutes.
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-0.5 bg-gradient-to-r from-brand-primary/30 via-brand-secondary/30 to-brand-primary/30" />

            {[
              {
                step: "01",
                title: "Sign Up Free",
                desc: "Create your account in under 60 seconds. Your first month is completely free — no credit card needed.",
                icon: UserPlus,
                color: "from-brand-primary to-brand-primary-light",
              },
              {
                step: "02",
                title: "Set Up Your Workspace",
                desc: "Add your first client, create a project, and configure your invoicing preferences.",
                icon: FolderOpen,
                color: "from-brand-secondary-dark to-brand-secondary",
              },
              {
                step: "03",
                title: "Run Your Business",
                desc: "Manage everything from one dashboard — clients, projects, invoices, contracts, and more.",
                icon: Briefcase,
                color: "from-brand-primary to-brand-secondary",
              },
            ].map((item) => (
              <StaggerItem key={item.step} className="relative text-center group">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform`}
                >
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

      {/* ========== PRICING SECTION ========== */}
      <section
        id="pricing"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-4">
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
            <ScaleIn delay={0.1} className="relative rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10">
                  <Star className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
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
                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"
              >
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </ScaleIn>

            {/* Annual Card */}
            <ScaleIn delay={0.2} className="relative rounded-2xl border-2 border-indigo-500/50 bg-card p-8 shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full shadow-lg">
                  <Zap className="h-3 w-3" />
                  BEST VALUE — SAVE $38
                </span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Sparkles className="h-6 w-6 text-purple-500 dark:text-purple-400" />
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
                  <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-semibold">
                    2 months free!
                  </span>
                </p>
              </div>
              <Button
                size="lg"
                asChild
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
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
              {pricingFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
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

      {/* ========== TESTIMONIALS ========== */}
      <section
        id="testimonials"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border"
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
                className="p-6 rounded-2xl bg-card border border-border hover:border-brand-primary/20 hover:shadow-lg transition-all duration-300 relative group"
              >
                {/* Quote mark */}
                <div className="absolute top-4 right-4 text-4xl text-brand-primary/10 font-serif leading-none group-hover:text-brand-primary/20 transition-colors">
                  &ldquo;
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {testimonial.avatar}
                  </div>
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

      {/* ========== AFFILIATE PROGRAM ========== */}
      <section
        id="affiliates"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-teal-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-sm font-semibold mb-6 border border-teal-500/20">
              <TrendingUp className="h-4 w-4" />
              Affiliate Partner Program
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Earn by Spreading the Word
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join our affiliate program and earn{" "}
              <span className="text-teal-400 font-semibold">
                30% commission
              </span>{" "}
              on every customer you refer — for 12 full months.
            </p>
          </div>

          {/* Commission Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            <div className="relative group bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 hover:border-teal-500/40 hover:bg-slate-800/80 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full font-medium">
                  Monthly
                </span>
              </div>
              <DollarSign className="h-12 w-12 text-teal-400 mb-4" />
              <div className="text-4xl font-extrabold text-white mb-1">
                $5.70
              </div>
              <div className="text-slate-400 text-sm mb-4">
                per month × 12 months
              </div>
              <div className="text-slate-300 text-sm">
                For every customer who subscribes to the{" "}
                <span className="text-white font-medium">$19/month</span> plan,
                you earn $5.70 every month for a full year.
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-teal-400 font-bold">
                Up to $68.40 per referral
              </div>
            </div>
            <div className="relative group bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                  Annual
                </span>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-400 mb-4" />
              <div className="text-4xl font-extrabold text-white mb-1">
                $57.00
              </div>
              <div className="text-slate-400 text-sm mb-4">
                one-time commission
              </div>
              <div className="text-slate-300 text-sm">
                For every customer who subscribes to the{" "}
                <span className="text-white font-medium">$190/year</span> plan,
                you earn $57 in a single payment.
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-emerald-400 font-bold">
                Instant $57 per referral
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "1",
                title: "Apply & Get Approved",
                desc: "Register as an affiliate partner. No platform subscription required — just sign up and get your unique link.",
                color: "from-teal-500/20 to-teal-600/20",
                border: "border-teal-500/20",
                text: "text-teal-400",
              },
              {
                step: "2",
                title: "Share Your Link",
                desc: "Share your personalized referral link via your website, social media, email newsletters, or YouTube channel.",
                color: "from-blue-500/20 to-blue-600/20",
                border: "border-blue-500/20",
                text: "text-blue-400",
              },
              {
                step: "3",
                title: "Earn Commissions",
                desc: "Get 30% of every payment made by your referrals — automatically tracked and credited to your account.",
                color: "from-emerald-500/20 to-emerald-600/20",
                border: "border-emerald-500/20",
                text: "text-emerald-400",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform`}
              >
                <div
                  className={`w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4 text-xl font-bold ${item.text}`}
                >
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                icon: TrendingUp,
                label: "30% Commission",
                sub: "Industry-leading rate",
              },
              {
                icon: CheckCircle2,
                label: "12-Month Window",
                sub: "On monthly plans",
              },
              {
                icon: LinkIcon,
                label: "Unique Links",
                sub: "Track every click",
              },
              {
                icon: DollarSign,
                label: "$50 Min Payout",
                sub: "Via PayPal or Bank",
              },
            ].map((perk, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <perk.icon className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">
                    {perk.label}
                  </div>
                  <div className="text-slate-500 text-xs">{perk.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/become-affiliate"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105"
            >
              Become an Affiliate Partner{" "}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-slate-500 text-sm">
              No platform subscription required • Free to join • Get paid
              monthly
            </p>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
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
                    Get Started Free{" "}
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

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
}
