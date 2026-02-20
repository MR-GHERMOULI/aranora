"use client";

import { useState, useMemo } from "react";
import { Client } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import {
    Users, Search, UserCheck, UserMinus, UserPlus,
    Mail, Phone, StickyNote, Grid3X3, List
} from "lucide-react";
import Link from "next/link";

interface ClientsClientProps {
    clients: Client[];
}

const STATUS_FILTERS = ["All", "Active", "Potential", "Inactive"] as const;

const statusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Potential: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const avatarColors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
    "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500"
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ClientsClient({ clients }: ClientsClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = !search ||
                client.name.toLowerCase().includes(search.toLowerCase()) ||
                client.email?.toLowerCase().includes(search.toLowerCase()) ||
                client.company?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "All" || client.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clients, search, statusFilter]);

    const stats = useMemo(() => ({
        total: clients.length,
        active: clients.filter(c => c.status === "Active").length,
        potential: clients.filter(c => c.status === "Potential").length,
        inactive: clients.filter(c => c.status === "Inactive").length,
    }), [clients]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Clients
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage your client relationships.
                    </p>
                </div>
                <AddClientDialog />
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-brand-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Clients</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="h-5 w-5 text-brand-primary opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Active</p>
                                <p className="text-2xl font-bold">{stats.active}</p>
                            </div>
                            <UserCheck className="h-5 w-5 text-green-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Potential</p>
                                <p className="text-2xl font-bold">{stats.potential}</p>
                            </div>
                            <UserPlus className="h-5 w-5 text-blue-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Inactive</p>
                                <p className="text-2xl font-bold">{stats.inactive}</p>
                            </div>
                            <UserMinus className="h-5 w-5 text-gray-400 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter + View Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clients..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    {STATUS_FILTERS.map(filter => (
                        <Button
                            key={filter}
                            variant={statusFilter === filter ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setStatusFilter(filter)}
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 ml-auto">
                    <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("grid")}>
                        <Grid3X3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("list")}>
                        <List className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Client Cards / List */}
            {filteredClients.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                            <Users className="h-8 w-8 opacity-30" />
                        </div>
                        <p className="font-medium text-foreground">
                            {search || statusFilter !== "All" ? "No clients match your filters" : "No clients yet"}
                        </p>
                        <p className="text-sm mt-1">
                            {search || statusFilter !== "All" ? "Try adjusting your search or filter." : "Add your first client to get started."}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map(client => (
                        <Card key={client.id} className="group hover:shadow-md transition-all duration-200 hover:border-brand-primary/30">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className={`h-12 w-12 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                                        {getInitials(client.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <Link href={`/clients/${client.id}`} className="font-semibold text-sm hover:text-brand-primary transition-colors truncate">
                                                {client.name}
                                            </Link>
                                            <Badge className={`text-[10px] shrink-0 ml-2 ${statusColors[client.status || ''] || statusColors.Active}`} variant="secondary">
                                                {client.status || "Active"}
                                            </Badge>
                                        </div>
                                        {client.company && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.company}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.notes && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <StickyNote className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{client.notes}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                                    <EditClientDialog client={client} />
                                    <DeleteClientDialog clientId={client.id} clientName={client.name} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* List View */
                <Card>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredClients.map(client => (
                                        <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center text-white font-medium text-xs shrink-0`}>
                                                        {getInitials(client.name)}
                                                    </div>
                                                    <Link href={`/clients/${client.id}`} className="font-medium hover:text-brand-primary transition-colors">
                                                        {client.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">{client.email || "—"}</td>
                                            <td className="p-4 align-middle text-muted-foreground">{client.phone || "—"}</td>
                                            <td className="p-4 align-middle text-center">
                                                <Badge className={`text-[10px] ${statusColors[client.status || ''] || statusColors.Active}`} variant="secondary">
                                                    {client.status || "Active"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <EditClientDialog client={client} />
                                                    <DeleteClientDialog clientId={client.id} clientName={client.name} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
