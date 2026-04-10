import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TestimonialCarousel from "@/components/auth/TestimonialCarousel";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    
    // Fetch active testimonials
    const { data: dbTestimonials } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

    const testimonials = dbTestimonials && dbTestimonials.length > 0
        ? dbTestimonials.map((t) => ({
            name: t.name,
            role: t.service,
            quote: t.content,
            avatarUrl: t.avatar_url,
            avatar: t.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
            rating: t.rating || 5,
        }))
        : [
            {
                name: "Sarah Chen",
                role: "UI/UX Designer",
                quote: "Aranora transformed how I manage my freelance business. It's like having a personal assistant that handles invoicing, contracts, and client management — all in one place.",
                avatar: "SC",
                rating: 5,
            }
        ];

    return (
        <div className="min-h-screen flex bg-background">
            {/* ── Left Side — Premium Branding Panel ── */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
                {/* Layered gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F2642] via-brand-primary to-[#1a4a7a]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* Animated mesh background blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07] animate-mesh"
                        style={{ background: 'radial-gradient(circle, #4ADE80, transparent 70%)' }}
                    />
                    <div
                        className="absolute -bottom-48 -left-24 w-[600px] h-[600px] rounded-full opacity-[0.06] animate-mesh"
                        style={{ background: 'radial-gradient(circle, #60A5FA, transparent 70%)', animationDelay: '8s' }}
                    />
                    <div
                        className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-[0.05] animate-mesh"
                        style={{ background: 'radial-gradient(circle, #4ADE80, transparent 70%)', animationDelay: '15s' }}
                    />
                </div>

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="auth-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.3" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#auth-grid)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
                    {/* Logo */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all duration-300">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Aranora</span>
                        </Link>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-10">
                        {/* Main headline */}
                        <div className="space-y-4 max-w-md">
                            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
                                Your freelance business,{' '}
                                <span className="bg-gradient-to-r from-[#4ADE80] to-[#86EFAC] bg-clip-text text-transparent">
                                    professionally
                                </span>{' '}
                                managed.
                            </h2>
                            <p className="text-white/60 text-base leading-relaxed">
                                Join thousands of freelancers who use Aranora to manage clients, projects, invoices, contracts, and team collaboration — all from one beautiful dashboard.
                            </p>
                        </div>



                        {/* Testimonials Carousel */}
                        <TestimonialCarousel testimonials={testimonials} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-8 text-xs text-white/40">
                        <span>© {new Date().getFullYear()} Aranora</span>
                        <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
                    </div>
                </div>
            </div>

            {/* ── Right Side — Form Area ── */}
            <div className="w-full lg:w-[48%] flex flex-col">
                {/* Mobile header */}
                <div className="lg:hidden p-5 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
                    <Link href="/" className="inline-flex items-center gap-2.5 group">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-brand-primary">Aranora</span>
                    </Link>
                </div>

                {/* Form container */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-10 xl:p-16 overflow-y-auto">
                    <div className="w-full max-w-[440px]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
