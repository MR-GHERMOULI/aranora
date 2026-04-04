import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Font loaded via CSS fallback stack in globals.css
const inter = { variable: "font-sans" };

import { createClient } from "@supabase/supabase-js";

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = "/favicon.ico";
  
  try {
    // using clean fetch client, no caching so updates appear instantly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' })
        }
      }
    );
    
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'branding')
      .single();

    if (data?.value?.favicon_url) {
      faviconUrl = data.value.favicon_url;
    }
  } catch (error) {
    console.error("Error fetching branding metadata:", error);
  }

  return {
    title: "Aranora | Freelancer Management Platform",
    description: "Professional freelancer management platform for clients, projects, and invoices.",
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl
    }
  };
}

import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/sonner"

// ... imports
import SupabaseProvider from "@/components/providers/supabase-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
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
