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
  Link as LinkIcon
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

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
  hero_title: "Manage Your Freelance Business Like a Pro",
  hero_subtitle: "All-in-one platform to manage clients, projects, invoices, contracts, and team collaboration. Focus on what you do best — we handle the rest.",
  hero_cta_text: "Start Free Trial",
  features_title: "Everything You Need to Succeed",
  features_subtitle: "Powerful features designed specifically for freelancers and independent professionals.",
  pricing_title: "No Pricing Plans. Just Free.",
  pricing_subtitle: "Aranora is completely free for all freelancers. No hidden fees, no credit card required, no limits.",
  testimonials_title: "Loved by Freelancers",
  testimonials_subtitle: "See what our users have to say.",
  cta_title: "Ready to Level Up Your Freelance Game?",
  cta_subtitle: "Join thousands of freelancers who trust Aranora to run their business.",
};

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch homepage content from settings
  const { data: homepageSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage")
    .single();

  const content: HomepageContent = homepageSetting?.value || defaultContent;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-brand-primary">Aranora</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-brand-primary transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-brand-primary transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm text-slate-600 hover:text-brand-primary transition-colors">Testimonials</a>
              <a href="#affiliates" className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">Affiliates</a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary-light">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary/10 text-brand-secondary-dark text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              The #1 Platform for Freelancers
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
              {content.hero_title.includes("Like a Pro") ? (
                <>
                  {content.hero_title.split("Like a Pro")[0]}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"> Like a Pro</span>
                </>
              ) : (
                content.hero_title
              )}
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              {content.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-brand-primary hover:bg-brand-primary-light text-lg px-8 py-6">
                <Link href="/signup">
                  {content.hero_cta_text} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-4 shadow-2xl shadow-slate-200/50 border border-slate-200">
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center text-xs text-slate-400">aranora.com/dashboard</div>
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-8">Trusted by 10,000+ freelancers worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
            {['Upwork', 'Fiverr', 'Toptal', 'Freelancer', '99designs'].map((company) => (
              <span key={company} className="text-xl font-bold text-slate-400">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{content.features_title}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {content.features_subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Client Management", desc: "Keep track of all your clients, their projects, and communications in one place.", color: "bg-blue-500" },
              { icon: Briefcase, title: "Project Tracking", desc: "Manage projects with tasks, milestones, deadlines, and team collaboration.", color: "bg-violet-500" },
              { icon: FileText, title: "Smart Invoicing", desc: "Create professional invoices, track payments, and get paid faster.", color: "bg-orange-500" },
              { icon: Shield, title: "E-Signatures", desc: "Send contracts and get them signed digitally — legally binding.", color: "bg-emerald-500" },
              { icon: BarChart3, title: "Reports & Analytics", desc: "Insights into your revenue, client activity, and business growth.", color: "bg-pink-500" },
              { icon: Zap, title: "Smart Reminders", desc: "AI-powered suggestions for follow-ups, overdue payments, and tasks.", color: "bg-amber-500" },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Forever Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary/10 text-brand-secondary-dark text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            100% Free Forever
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{content.pricing_title}</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {content.pricing_subtitle}
          </p>
          <div className="bg-white rounded-2xl border-2 border-brand-primary shadow-xl shadow-brand-primary/10 p-8 max-w-md mx-auto">
            <div className="mb-6">
              <span className="text-5xl font-bold text-brand-primary">$0</span>
              <span className="text-slate-500 text-lg"> / forever</span>
            </div>
            <ul className="space-y-3 mb-8 text-left">
              {[
                "Unlimited clients & projects",
                "Smart invoicing & contracts",
                "E-signatures",
                "Team collaboration",
                "Reports & analytics",
                "Smart reminders"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-brand-secondary-dark flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full bg-brand-primary hover:bg-brand-primary-light" asChild>
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{content.testimonials_title}</h2>
            <p className="text-lg text-slate-600">{content.testimonials_subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Chen", role: "UI/UX Designer", quote: "Aranora transformed how I manage my freelance business. The invoicing feature alone saved me hours every week.", avatar: "SC" },
              { name: "Marcus Johnson", role: "Web Developer", quote: "Finally, a tool that understands freelancers. The project collaboration features are game-changing.", avatar: "MJ" },
              { name: "Elena Rodriguez", role: "Content Strategist", quote: "The smart reminders keep me on top of everything. I've never missed a deadline since using Aranora.", avatar: "ER" }
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-medium text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Program Section */}
      <section id="affiliates" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-teal-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-sm font-medium mb-6 border border-teal-500/20">
              <TrendingUp className="h-4 w-4" />
              Affiliate Program
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Earn by Spreading the Word
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join our affiliate program and earn <span className="text-teal-400 font-semibold">30% commission</span> on every customer you refer — for 12 full months.
            </p>
          </div>

          {/* Commission Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            <div className="relative group bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 hover:border-teal-500/40 hover:bg-slate-800/80 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded-full">Monthly</span>
              </div>
              <DollarSign className="h-12 w-12 text-teal-400 mb-4" />
              <div className="text-4xl font-bold text-white mb-1">$5.70</div>
              <div className="text-slate-400 text-sm mb-4">per month × 12 months</div>
              <div className="text-slate-300 text-sm">
                For every customer who subscribes to the <span className="text-white font-medium">$19/month</span> plan, you earn $5.70 every month for a full year.
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-teal-400 font-semibold">
                Up to $68.40 per referral
              </div>
            </div>
            <div className="relative group bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">Annual</span>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-400 mb-4" />
              <div className="text-4xl font-bold text-white mb-1">$57.00</div>
              <div className="text-slate-400 text-sm mb-4">one-time commission</div>
              <div className="text-slate-300 text-sm">
                For every customer who subscribes to the <span className="text-white font-medium">$190/year</span> plan, you earn $57 in a single payment.
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-emerald-400 font-semibold">
                Instant $57 per referral
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { step: "1", title: "Apply & Get Approved", desc: "Register as an affiliate partner. No platform subscription required — just sign up and get your unique link.", color: "from-teal-500/20 to-teal-600/20", border: "border-teal-500/20", text: "text-teal-400" },
              { step: "2", title: "Share Your Link", desc: "Share your personalized referral link via your website, social media, email newsletters, or YouTube channel.", color: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/20", text: "text-blue-400" },
              { step: "3", title: "Earn Commissions", desc: "Get 30% of every payment made by your referrals automatically tracked and credited to your account.", color: "from-emerald-500/20 to-emerald-600/20", border: "border-emerald-500/20", text: "text-emerald-400" },
            ].map((item) => (
              <div key={item.step} className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-6 text-center`}>
                <div className={`w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4 text-xl font-bold ${item.text}`}>
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: TrendingUp, label: "30% Commission", sub: "Industry-leading rate" },
              { icon: CheckCircle2, label: "12-Month Window", sub: "On monthly plans" },
              { icon: LinkIcon, label: "Unique Links", sub: "Track every click" },
              { icon: DollarSign, label: "$50 Min Payout", sub: "Via PayPal or Bank" },
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <perk.icon className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{perk.label}</div>
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
              Become an Affiliate Partner <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-3 text-slate-500 text-sm">No platform subscription required • Free to join • Get paid monthly</p>
          </div>
        </div>
      </section>


      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">{content.cta_title}</h2>
          <p className="text-xl text-white/80 mb-8">{content.cta_subtitle}</p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
            <Link href="/signup">
              Get Started Free <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
