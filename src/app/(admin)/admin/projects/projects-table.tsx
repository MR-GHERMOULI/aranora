"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Project {
    id: string
    title: string
    status: string
    budget: number | null
    start_date: string | null
    end_date: string | null
    created_at: string
    user_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles: any
}

interface ProjectsTableProps {
    projects: Project[]
}

// Helper to extract nested value (handles both array and object from Supabase)
function getNestedValue(obj: unknown, key: string): string | null {
    if (!obj) return null
    if (Array.isArray(obj)) {
        return obj[0]?.[key] ?? null
    }
    return (obj as Record<string, unknown>)[key] as string | null
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredProjects = projects.filter((project) => {
        const ownerName = getNestedValue(project.profiles, "full_name")
        return (
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            "Planning": "bg-blue-500/10 text-blue-600",
            "In Progress": "bg-yellow-500/10 text-yellow-600",
            "On Hold": "bg-orange-500/10 text-orange-600",
            "Completed": "bg-green-500/10 text-green-600",
            "Cancelled": "bg-red-500/10 text-red-600",
        }
        return <Badge className={styles[status] || "bg-gray-500/10 text-gray-600"}>{status}</Badge>
    }

    return (
        <>
            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Budget</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                        No projects found
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{project.title}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {getNestedValue(project.profiles, "full_name") || "Unknown"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(project.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {project.budget ? `$${project.budget.toLocaleString()}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(project.created_at).toLocaleDateString('en-US')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
            </div>
        </>
    )
}
