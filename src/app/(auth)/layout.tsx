import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-secondary relative overflow-hidden">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <Link href="/" className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold">Aranora</span>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <blockquote className="text-2xl font-medium leading-relaxed">
                            "Aranora transformed how I manage my freelance business. It's like having a personal assistant that never sleeps."
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                SC
                            </div>
                            <div>
                                <p className="font-semibold">Sarah Chen</p>
                                <p className="text-white/70 text-sm">UI/UX Designer, 5+ years freelancing</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 text-sm text-white/60">
                        <span>© 2024 Aranora</span>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col">
                {/* Mobile header */}
                <div className="lg:hidden p-6 border-b">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-brand-primary">Aranora</span>
                    </Link>
                </div>

                {/* Form container */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
