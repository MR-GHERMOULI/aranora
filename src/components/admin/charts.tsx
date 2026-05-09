"use client"

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
} from "recharts"
import { motion } from "framer-motion"

interface ChartCardProps {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
        >
            <div className="mb-6">
                <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground font-medium">{description}</p>
                )}
            </div>
            <div className="h-[300px] w-full">{children}</div>
        </motion.div>
    )
}

const CHART_COLORS = {
    primary: "#1E3A5F",
    primaryLight: "#2E5A8F",
    secondary: "#4ADE80",
    secondaryDark: "#22C55E",
    accent: "#F59E0B",
    muted: "#94A3B8",
}

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border bg-card/95 backdrop-blur-md p-3 shadow-xl ring-1 ring-black/5">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                            </span>
                            <span className="font-bold text-foreground">
                                {prefix}{entry.value.toLocaleString()}{suffix}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

interface UserGrowthChartProps {
    data: { month: string; users: number; newUsers: number }[]
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 500 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    animationDuration={1500}
                />
                <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="New Users"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNewUsers)"
                    strokeDasharray="5 5"
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

interface ProjectsChartProps {
    data: { status: string; count: number }[]
}

export function ProjectsChart({ data }: ProjectsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="status"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar
                    dataKey="count"
                    name="Projects"
                    fill={CHART_COLORS.primary}
                    radius={[0, 8, 8, 0]}
                    barSize={32}
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? CHART_COLORS.primary : CHART_COLORS.primaryLight} 
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

interface GeoChartProps {
    data: { country: string; users: number; color: string }[]
}

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.primaryLight, CHART_COLORS.accent, "#10B981", "#6366F1"]

export function GeoChart({ data }: GeoChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="users"
                    nameKey="country"
                    stroke="none"
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight ml-1">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface InvoicesChartProps {
    data: { month: string; amount: number; count: number }[]
}

export function InvoicesChart({ data }: InvoicesChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 500 }}
                    dy={10}
                />
                <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="rect"
                    wrapperStyle={{ paddingBottom: "20px" }}
                />
                <Bar
                    yAxisId="left"
                    dataKey="amount"
                    name="Revenue"
                    fill={CHART_COLORS.primary}
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                />
                <Bar
                    yAxisId="right"
                    dataKey="count"
                    name="Invoices"
                    fill={CHART_COLORS.secondary}
                    radius={[6, 6, 0, 0]}
                    animationDuration={2000}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
