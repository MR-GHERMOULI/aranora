import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

    if (!profile?.is_admin) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="lg:pl-72">
                <AdminTopbar />
                <main className="p-6 pt-20 lg:pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
