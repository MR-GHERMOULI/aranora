import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/admin/stats-card"
import { ProjectsTable } from "./projects-table"

export default async function AdminProjectsPage() {
    const supabase = await createClient()

    // Fetch all projects with client info
    const { data: projects } = await supabase
        .from("projects")
        .select(`
            id,
            title,
            status,
            budget,
            start_date,
            end_date,
            created_at,
            user_id,
            profiles:user_id (full_name, company_email)
        `)
        .order("created_at", { ascending: false })

    // Get stats
    const [
        { count: totalProjects },
        { count: activeProjects },
        { count: completedProjects },
        { data: budgetData },
    ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "In Progress"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "Completed"),
        supabase.from("projects").select("budget"),
    ])

    const totalBudget = (budgetData || []).reduce((sum: number, p: { budget?: number }) => sum + (p.budget || 0), 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects Overview</h1>
                <p className="text-muted-foreground mt-1">
                    View all projects across the platform
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <StatsCard
                    title="Total Projects"
                    value={totalProjects || 0}
                    iconName="Briefcase"
                />
                <StatsCard
                    title="Active"
                    value={activeProjects || 0}
                    iconName="Briefcase"
                    description="in progress"
                />
                <StatsCard
                    title="Completed"
                    value={completedProjects || 0}
                    iconName="Briefcase"
                    description="finished"
                />
                <StatsCard
                    title="Total Budget"
                    value={`$${totalBudget.toLocaleString()}`}
                    iconName="Briefcase"
                    description="across all projects"
                />
            </div>

            {/* Projects Table */}
            <ProjectsTable projects={projects || []} />
        </div>
    )
}
