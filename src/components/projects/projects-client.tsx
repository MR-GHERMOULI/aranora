"use client";

import { useState, useMemo } from "react";
import { Project, Client } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniProgressBar } from "@/components/projects/project-progress-bar";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import {
    Briefcase, Search, Clock, CheckCircle2, PauseCircle, Pencil,
    Calendar, DollarSign, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface ProjectsClientProps {
    projects: any[];
    clients: Client[];
}

const STATUS_FILTERS = ["All", "Planning", "In Progress", "On Hold", "Completed", "Cancelled"] as const;

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
    Planning: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Pencil },
    "In Progress": { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
    "On Hold": { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: PauseCircle },
    Completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    Cancelled: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: CheckCircle2 },
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export function ProjectsClient({ projects, clients }: ProjectsClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = !search ||
                project.title.toLowerCase().includes(search.toLowerCase()) ||
                project.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
                project.description?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "All" || project.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projects, search, statusFilter]);

    const stats = useMemo(() => ({
        total: projects.length,
        active: projects.filter((p: any) => p.status === "In Progress").length,
        planning: projects.filter((p: any) => p.status === "Planning").length,
        completed: projects.filter((p: any) => p.status === "Completed").length,
        onHold: projects.filter((p: any) => p.status === "On Hold").length,
    }), [projects]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Projects
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Track and manage your projects.
                    </p>
                </div>
                <AddProjectDialog clients={clients} />
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-brand-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Projects</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Briefcase className="h-5 w-5 text-brand-primary opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                                <p className="text-2xl font-bold">{stats.active}</p>
                            </div>
                            <Clock className="h-5 w-5 text-blue-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">On Hold</p>
                                <p className="text-2xl font-bold">{stats.onHold}</p>
                            </div>
                            <PauseCircle className="h-5 w-5 text-orange-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 overflow-x-auto">
                    {STATUS_FILTERS.map(filter => (
                        <Button
                            key={filter}
                            variant={statusFilter === filter ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-7 whitespace-nowrap"
                            onClick={() => setStatusFilter(filter)}
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Project Cards */}
            {filteredProjects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="h-8 w-8 opacity-30" />
                        </div>
                        <p className="font-medium text-foreground">
                            {search || statusFilter !== "All" ? "No projects match your filters" : "No projects yet"}
                        </p>
                        <p className="text-sm mt-1">
                            {search || statusFilter !== "All" ? "Try adjusting your search or filter." : "Create your first project to start tracking your work."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project: any) => {
                        const config = statusConfig[project.status] || statusConfig.Planning;
                        const taskProgress = project.task_count > 0
                            ? Math.round((project.completed_task_count / project.task_count) * 100)
                            : 0;

                        return (
                            <Link key={project.id} href={`/projects/${project.slug || project.id}`}>
                                <Card className="group hover:shadow-md transition-all duration-200 hover:border-brand-primary/30 cursor-pointer h-full">
                                    <CardContent className="p-5 flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm group-hover:text-brand-primary transition-colors truncate">
                                                    {project.title}
                                                </h3>
                                                {project.client?.name && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                        {project.client.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className={`text-[10px] shrink-0 ml-2 ${config.color}`} variant="secondary">
                                                {project.status}
                                            </Badge>
                                        </div>

                                        {/* Description */}
                                        {project.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Budget + Dates */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                                            {project.budget && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    <span>{formatCurrency(Number(project.budget))}</span>
                                                </div>
                                            )}
                                            {project.end_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(new Date(project.end_date), "MMM d, yyyy")}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Task Progress */}
                                        {project.task_count > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <div className="flex justify-between items-center text-xs mb-1.5">
                                                    <span className="text-muted-foreground">Tasks</span>
                                                    <span className="font-medium">{project.completed_task_count}/{project.task_count}</span>
                                                </div>
                                                <MiniProgressBar percentage={taskProgress} />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-4 w-4 text-brand-primary" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
