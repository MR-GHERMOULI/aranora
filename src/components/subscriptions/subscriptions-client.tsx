"use client";

import { useState, useMemo } from "react";
import { Subscription } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubscriptionDialog } from "./subscription-dialog";
import { SubscriptionCard } from "./subscription-card";
import {
    CreditCard, Search, Plus, Filter, LayoutGrid, List,
    TrendingUp, Calendar, AlertCircle, Clock, PieChart,
    ChevronRight, ArrowUpRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, parseISO, isPast } from "date-fns";

interface SubscriptionsClientProps {
    subscriptions: Subscription[];
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const categories = useMemo(() => {
        const cats = new Set(subscriptions.map(s => s.category || "Other"));
        return ["All", ...Array.from(cats)].sort();
    }, [subscriptions]);

    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter(sub => {
            const matchesSearch = !search || sub.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = categoryFilter === "All" || (sub.category || "Other") === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [subscriptions, search, categoryFilter]);

    const stats = useMemo(() => {
        const active = subscriptions.filter(s => s.status === 'active');
        const monthlyTotal = active.reduce((sum, s) => {
            const price = Number(s.price) || 0;
            return sum + (s.billing_cycle === 'yearly' ? price / 12 : price);
        }, 0);
        const yearlyTotal = monthlyTotal * 12;

        return {
            count: active.length,
            monthlyTotal,
            yearlyTotal,
        };
    }, [subscriptions]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Subscriptions
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Monitor your recurring expenses and renewals.
                    </p>
                </div>
                <SubscriptionDialog
                    trigger={
                        <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Add Subscription
                        </Button>
                    }
                />
            </div>

            {/* Stats Row */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
                                <p className="text-xl font-bold">{stats.count}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly Spend</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.monthlyTotal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <PieChart className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Yearly Spend</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.yearlyTotal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search subscriptions..."
                        className="pl-9 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                        {categories.slice(0, 5).map((cat) => (
                            <Button
                                key={cat}
                                variant={categoryFilter === cat ? "default" : "ghost"}
                                size="sm"
                                className="h-7 px-3 text-xs whitespace-nowrap"
                                onClick={() => setCategoryFilter(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List / Grid */}
            {filteredSubscriptions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <CreditCard className="h-6 w-6 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="font-semibold text-lg">No subscriptions tracked</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            Start tracking your software and service costs by adding your first subscription.
                        </p>
                        <SubscriptionDialog
                            trigger={
                                <Button className="mt-4 bg-brand-primary" variant="default">
                                    Add Subscription
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {filteredSubscriptions.map((sub) => (
                        <SubscriptionCard key={sub.id} subscription={sub} />
                    ))}
                </div>
            )}
        </div>
    );
}
