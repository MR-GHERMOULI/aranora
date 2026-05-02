"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    HeartPulse, Users, AlertTriangle, XCircle, TrendingUp,
    TrendingDown, Minus, Search, RefreshCw, Activity,
    BarChart3, Zap, Clock, ArrowUpRight, ArrowDownRight,
    ChevronDown, ChevronUp, CheckCircle2, Loader2
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"

// ── Types ────────────────────────────────────────────────
interface UserProfile {
    id: string
    full_name: string | null
    company_email: string | null
    username: string | null
    health_score: number | null
    health_trend: string | null
    last_active_at: string | null
    last_login_at: string | null
    subscription_status: string | null
    trial_ends_at: string | null
    is_admin: boolean
    engagement_alerts_sent: number | null
    created_at: string
    events30d: number
    events7d: number
    featuresUsed: string[]
    lastEventAt: string | null
    eventsByCategory: Record<string, number>
}

interface Stats {
    totalUsers: number
    healthyCount: number
    moderateCount: number
    atRiskCount: number
    criticalCount: number
    churningCount: number
    avgScore: number
    totalEvents30d: number
}

interface EngagementClientProps {
    profiles: UserProfile[]
    stats: Stats
    featureUsage: { feature: string; count: number }[]
}

// ── Health Score Helpers ──────────────────────────────────
function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    if (score >= 20) return "text-red-500"
    return "text-zinc-500"
}

function getScoreBg(score: number): string {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20"
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20"
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20"
    if (score >= 20) return "bg-red-500/10 border-red-500/20"
    return "bg-zinc-500/10 border-zinc-500/20"
}

function getScoreLabel(score: number): string {
    if (score >= 80) return "Healthy"
    if (score >= 60) return "Moderate"
    if (score >= 40) return "At Risk"
    if (score >= 20) return "Critical"
    return "Churning"
}

function getScoreEmoji(score: number): string {
    if (score >= 80) return "🟢"
    if (score >= 60) return "🟡"
    if (score >= 40) return "🟠"
    if (score >= 20) return "🔴"
    return "⚫"
}

function getTrendIcon(trend: string | null) {
    switch (trend) {
        case 'improving': return <TrendingUp className="h-4 w-4 text-emerald-500" />
        case 'declining': return <TrendingDown className="h-4 w-4 text-orange-500" />
        case 'critical': return <ArrowDownRight className="h-4 w-4 text-red-500" />
        default: return <Minus className="h-4 w-4 text-muted-foreground" />
    }
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never"
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
}

const PIE_COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#71717A"]
const FEATURE_COLORS: Record<string, string> = {
    "projects": "#6366F1",
    "invoices": "#F59E0B",
    "tasks": "#10B981",
    "contracts": "#8B5CF6",
    "clients": "#EC4899",
    "time-tracking": "#06B6D4",
    "collaborators": "#F97316",
    "intake-forms": "#14B8A6",
    "reports": "#3B82F6",
    "calendar": "#A855F7",
    "dashboard": "#64748B",
    "settings": "#94A3B8",
    "broadcasts": "#D946EF",
    "search": "#78716C",
}

// ── Main Component ───────────────────────────────────────
export function EngagementClient({ profiles, stats, featureUsage }: EngagementClientProps) {
    const [search, setSearch] = useState("")
    const [filterLevel, setFilterLevel] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"score" | "events" | "lastActive">("score")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const [isRecalculating, setIsRecalculating] = useState(false)
    const [expandedUser, setExpandedUser] = useState<string | null>(null)

    // Recalculate health scores
    const handleRecalculate = async () => {
        setIsRecalculating(true)
        try {
            const res = await fetch("/api/admin/health-scores", { method: "POST" })
            if (res.ok) {
                window.location.reload()
            }
        } catch (err) {
            console.error("Recalculate error:", err)
        } finally {
            setIsRecalculating(false)
        }
    }

    // Filter and sort
    const filtered = profiles
        .filter(u => {
            if (search) {
                const q = search.toLowerCase()
                return (
                    u.full_name?.toLowerCase().includes(q) ||
                    u.company_email?.toLowerCase().includes(q) ||
                    u.username?.toLowerCase().includes(q)
                )
            }
            return true
        })
        .filter(u => {
            if (filterLevel === "all") return true
            const score = u.health_score || 0
            switch (filterLevel) {
                case "healthy": return score >= 80
                case "moderate": return score >= 60 && score < 80
                case "at_risk": return score >= 40 && score < 60
                case "critical": return score >= 20 && score < 40
                case "churning": return score < 20
                default: return true
            }
        })
        .sort((a, b) => {
            let valA: number, valB: number
            switch (sortBy) {
                case "score":
                    valA = a.health_score || 0
                    valB = b.health_score || 0
                    break
                case "events":
                    valA = a.events30d
                    valB = b.events30d
                    break
                case "lastActive":
                    valA = a.last_active_at ? new Date(a.last_active_at).getTime() : 0
                    valB = b.last_active_at ? new Date(b.last_active_at).getTime() : 0
                    break
                default:
                    valA = a.health_score || 0
                    valB = b.health_score || 0
            }
            return sortDir === "asc" ? valA - valB : valB - valA
        })

    // Pie chart data
    const pieData = [
        { name: "Healthy", value: stats.healthyCount, color: PIE_COLORS[0] },
        { name: "Moderate", value: stats.moderateCount, color: PIE_COLORS[1] },
        { name: "At Risk", value: stats.atRiskCount, color: PIE_COLORS[2] },
        { name: "Critical", value: stats.criticalCount, color: PIE_COLORS[3] },
        { name: "Churning", value: stats.churningCount, color: PIE_COLORS[4] },
    ].filter(d => d.value > 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-emerald-500" />
                        Client Engagement
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor client health, track feature usage, and prevent churn
                    </p>
                </div>
                <Button
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    className="gap-2"
                    variant="outline"
                >
                    {isRecalculating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Recalculate Scores
                </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                <Card className="p-4 col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Avg Score</p>
                            <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                                {stats.avgScore}
                            </p>
                        </div>
                    </div>
                </Card>

                <StatMini icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="Healthy" value={stats.healthyCount} color="emerald" />
                <StatMini icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />} label="Moderate" value={stats.moderateCount} color="yellow" />
                <StatMini icon={<AlertTriangle className="h-5 w-5 text-orange-500" />} label="At Risk" value={stats.atRiskCount} color="orange" />
                <StatMini icon={<XCircle className="h-5 w-5 text-red-500" />} label="Critical" value={stats.criticalCount} color="red" />
                <StatMini icon={<Zap className="h-5 w-5 text-blue-500" />} label="Events (30d)" value={stats.totalEvents30d} color="blue" />
                <StatMini icon={<Users className="h-5 w-5 text-purple-500" />} label="Total Users" value={stats.totalUsers} color="purple" />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Score Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Health Distribution</h3>
                    <p className="text-sm text-muted-foreground mb-4">User health score breakdown</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Feature Usage */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Feature Usage</h3>
                    <p className="text-sm text-muted-foreground mb-4">Most used features (last 30 days)</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={featureUsage.slice(0, 8)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                                <YAxis
                                    dataKey="feature"
                                    type="category"
                                    width={100}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {featureUsage.slice(0, 8).map((entry, i) => (
                                        <Cell key={i} fill={FEATURE_COLORS[entry.feature] || "#6366F1"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: "all", label: "All", count: stats.totalUsers },
                        { key: "healthy", label: "🟢 Healthy", count: stats.healthyCount },
                        { key: "moderate", label: "🟡 Moderate", count: stats.moderateCount },
                        { key: "at_risk", label: "🟠 At Risk", count: stats.atRiskCount },
                        { key: "critical", label: "🔴 Critical", count: stats.criticalCount },
                        { key: "churning", label: "⚫ Churning", count: stats.churningCount },
                    ].map(f => (
                        <Button
                            key={f.key}
                            size="sm"
                            variant={filterLevel === f.key ? "default" : "outline"}
                            onClick={() => setFilterLevel(f.key)}
                            className="gap-1"
                        >
                            {f.label}
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                                {f.count}
                            </Badge>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                                <th
                                    className="text-center p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => { setSortBy("score"); setSortDir(d => d === "asc" ? "desc" : "asc") }}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        Score
                                        {sortBy === "score" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                    </span>
                                </th>
                                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Trend</th>
                                <th
                                    className="text-center p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => { setSortBy("lastActive"); setSortDir(d => d === "asc" ? "desc" : "asc") }}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        Last Active
                                        {sortBy === "lastActive" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                    </span>
                                </th>
                                <th
                                    className="text-center p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => { setSortBy("events"); setSortDir(d => d === "asc" ? "desc" : "asc") }}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        Events (30d)
                                        {sortBy === "events" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                    </span>
                                </th>
                                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Features</th>
                                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Plan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => {
                                const score = user.health_score || 0
                                const isExpanded = expandedUser === user.id
                                return (
                                    <tr
                                        key={user.id}
                                        className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                    >
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-sm">{user.full_name || "—"}</p>
                                                <p className="text-xs text-muted-foreground">{user.company_email || user.username || "—"}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="text-base">{getScoreEmoji(score)}</span>
                                                <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
                                            </div>
                                            <p className={`text-[10px] font-medium mt-0.5 ${getScoreColor(score)}`}>
                                                {getScoreLabel(score)}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getTrendIcon(user.health_trend)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className={!user.last_active_at ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                                    {timeAgo(user.last_active_at || user.last_login_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="font-semibold text-sm">{user.events30d}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({user.events7d} this week)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
                                                {user.featuresUsed.length > 0 ? (
                                                    user.featuresUsed.slice(0, 4).map(f => (
                                                        <Badge
                                                            key={f}
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0"
                                                            style={{ borderColor: FEATURE_COLORS[f] || "#6366F1", color: FEATURE_COLORS[f] || "#6366F1" }}
                                                        >
                                                            {f}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">None</span>
                                                )}
                                                {user.featuresUsed.length > 4 && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                        +{user.featuresUsed.length - 4}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <PlanBadge status={user.subscription_status} />
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

// ── Sub-Components ───────────────────────────────────────
function StatMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <Card className={`p-4 border-${color}-500/20`}>
            <div className="flex items-center gap-2">
                {icon}
                <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
        </Card>
    )
}

function PlanBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        active: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        trialing: { label: "Trial", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        expired: { label: "Expired", className: "bg-red-500/10 text-red-600 border-red-500/20" },
        canceled: { label: "Canceled", className: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" },
    }

    const s = config[status || ""] || { label: status || "—", className: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" }
    return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
}
