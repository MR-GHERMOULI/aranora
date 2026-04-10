import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Font loaded via CSS fallback stack in globals.css
const inter = { variable: "font-sans" };

export const metadata: Metadata = {
  title: "Aranora | Freelancer Management Platform",
  description: "Professional freelancer management platform for clients, projects, and invoices.",
  icons: {
    icon: "/api/favicon",
    shortcut: "/api/favicon",
    apple: "/api/favicon",
  }
};

import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/sonner"

// ... imports
import SupabaseProvider from "@/components/providers/supabase-provider";
import { DynamicBranding } from "@/components/providers/dynamic-branding";
import { GoogleHeadIntegrations, GoogleBodyIntegrations } from "@/components/providers/google-integrations";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <GoogleHeadIntegrations />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <GoogleBodyIntegrations />
        <DynamicBranding />
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
