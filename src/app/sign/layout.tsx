import PublicNavbar from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";

export default function SignLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
}
