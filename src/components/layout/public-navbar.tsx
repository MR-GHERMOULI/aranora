import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PublicNavbar() {
  const supabase = await createClient()

  // Fetch logo URL
  const { data: brandingSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single()
  const logoUrl = brandingSetting?.value?.logo_url

  // Fetch homepage settings for CTA text
  const { data: homepageSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage")
    .single()
  const navCtaText = homepageSetting?.value?.nav_cta_text || "Get Started Free"

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border/50 transition-all duration-300 left-0 right-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
              <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
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
                )}
              </div>
              <span className="text-xl font-bold text-brand-primary tracking-tight">
                Aranora
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/#testimonials"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Testimonials
            </Link>
            <Link
              href="/#affiliates"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Affiliates
            </Link>
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
                {navCtaText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
