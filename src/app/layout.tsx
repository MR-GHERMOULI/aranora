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
