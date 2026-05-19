import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: brandingSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  
  const siteName = brandingSetting?.value?.site_name || "Aranora";

  const headerList = await headers();
  const host = headerList.get("host") || "aranora.com";
  const proto = headerList.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  return {
    title: `${siteName} | Freelancer Management Platform`,
    description: `Aranora is the ultimate all-in-one freelancer management platform. Streamline clients, projects, contracts, invoices, and time tracking built professionally for ${siteName}.`,
    keywords: [
      "freelancer platform",
      "freelance management",
      "client portal",
      "project tracking",
      "time tracking",
      "smart invoicing",
      "digital contracts",
      "e-signatures",
      "freelance dashboard"
    ],
    metadataBase: new URL(origin),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${siteName} | Freelancer Management Platform`,
      description: `Aranora is the ultimate all-in-one freelancer management platform. Streamline clients, projects, contracts, invoices, and time tracking built professionally for ${siteName}.`,
      url: origin,
      siteName: siteName,
      images: [
        {
          url: "/api/favicon",
          width: 512,
          height: 512,
          alt: `${siteName} Platform Logo`,
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${siteName} | Freelancer Management Platform`,
      description: `Aranora is the ultimate all-in-one freelancer management platform. Streamline clients, projects, contracts, invoices, and time tracking built professionally for ${siteName}.`,
      images: ["/api/favicon"],
    },
    icons: {
      icon: "/api/favicon",
      shortcut: "/api/favicon",
      apple: "/api/favicon",
    }
  };
}

import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/sonner"

// ... imports
import SupabaseProvider from "@/components/providers/supabase-provider";
import { DynamicBranding } from "@/components/providers/dynamic-branding";
import { GoogleHeadIntegrations, GoogleBodyIntegrations } from "@/components/providers/google-integrations";
import { LemonSqueezyAffiliate } from "@/components/providers/lemon-squeezy-affiliate";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <DynamicBranding />
        <GoogleHeadIntegrations />
        <LemonSqueezyAffiliate />
      </head>

      <body className="antialiased font-sans" suppressHydrationWarning>
        <GoogleBodyIntegrations />
        <SupabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
