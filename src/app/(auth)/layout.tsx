import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
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

                        {/* Glass feature cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: '📊', title: 'Smart Dashboard', desc: 'All your metrics in one view' },
                                { icon: '📄', title: 'Auto Invoicing', desc: 'Get paid faster with smart billing' },
                                { icon: '🤝', title: 'Client Portal', desc: 'Share progress in real-time' },
                                { icon: '⏱️', title: 'Time Tracking', desc: 'Log hours, bill accurately' },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="p-4 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.10] transition-all duration-300 group"
                                >
                                    <div className="text-xl mb-2">{feature.icon}</div>
                                    <p className="text-sm font-semibold text-white/90 mb-0.5">{feature.title}</p>
                                    <p className="text-xs text-white/45">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial */}
                        <div className="p-5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-4 w-4 text-[#4ADE80]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <blockquote className="text-sm text-white/80 leading-relaxed mb-3 italic">
                                &ldquo;Aranora transformed how I manage my freelance business. It&apos;s like having a personal assistant that handles invoicing, contracts, and client management — all in one place.&rdquo;
                            </blockquote>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-[#0F2642] font-bold text-xs">
                                    SC
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/90">Sarah Chen</p>
                                    <p className="text-xs text-white/45">UI/UX Designer • 5+ years freelancing</p>
                                </div>
                            </div>
                        </div>
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
