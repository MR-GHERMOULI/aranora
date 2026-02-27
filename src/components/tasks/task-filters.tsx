'use client';

import { useState, useTransition } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TaskFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    activeFilters: FilterState;
}

export interface FilterState {
    search: string;
    status: string;
    priority: string;
    sortBy: string;
}

const STATUSES = ['All', 'Todo', 'In Progress', 'Done', 'Postponed'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];
const SORT_OPTIONS = [
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'title', label: 'Title (A-Z)' },
];

export function TaskFilters({ onFilterChange, activeFilters }: TaskFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = activeFilters.status !== 'All' || activeFilters.priority !== 'All' || activeFilters.search !== '';

    const activeCount = [
        activeFilters.status !== 'All',
        activeFilters.priority !== 'All',
        activeFilters.search !== '',
    ].filter(Boolean).length;

    const clearAll = () => {
        onFilterChange({ search: '', status: 'All', priority: 'All', sortBy: 'due_date' });
    };

    return (
        <div className="space-y-3">
            {/* Main toolbar */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={activeFilters.search}
                        onChange={(e) => onFilterChange({ ...activeFilters, search: e.target.value })}
                        className="pl-9 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors"
                    />
                    {activeFilters.search && (
                        <button
                            onClick={() => onFilterChange({ ...activeFilters, search: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter toggle */}
                <Button
                    variant={showFilters ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 gap-2"
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeCount > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                            {activeCount}
                        </Badge>
                    )}
                </Button>

                {/* Sort */}
                <Select
                    value={activeFilters.sortBy}
                    onValueChange={(val) => onFilterChange({ ...activeFilters, sortBy: val })}
                >
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Expandable filter bar */}
            {showFilters && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {/* Status filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Status:</span>
                        <div className="flex gap-1">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onFilterChange({ ...activeFilters, status: s })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeFilters.status === s
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    {/* Priority filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Priority:</span>
                        <div className="flex gap-1">
                            {PRIORITIES.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => onFilterChange({ ...activeFilters, priority: p })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeFilters.priority === p
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <>
                            <div className="h-6 w-px bg-border" />
                            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
                                <X className="h-3 w-3" />
                                Clear all
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
