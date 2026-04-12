import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import NotFoundContent from "@/components/not-found-content";

export const metadata = {
  title: "404 — Page Not Found | Aranora",
  description:
    "The page you're looking for doesn't exist or has been moved. Navigate back to Aranora to manage your freelance business.",
};

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
