import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import NotFoundContent from "@/components/not-found-content";

import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: brandingSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "branding")
    .single();
  
  const siteName = brandingSetting?.value?.site_name || "Aranora";

  return {
    title: `404 — Page Not Found | ${siteName}`,
    description:
      `The page you're looking for doesn't exist or has been moved. Navigate back to ${siteName} to manage your freelance business.`,
  };
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
