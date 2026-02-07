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
} from "recharts"

interface ChartCardProps {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
    return (
        <div className={`rounded-2xl border bg-card p-6 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="h-[300px]">{children}</div>
        </div>
    )
}

interface UserGrowthChartProps {
    data: { month: string; users: number; newUsers: number }[]
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="New Users"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

interface ProjectsChartProps {
    data: { status: string; count: number }[]
}

export function ProjectsChart({ data }: ProjectsChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis
                    dataKey="status"
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
                <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

interface GeoChartProps {
    data: { country: string; users: number; color: string }[]
}

const COLORS = ["#1E3A5F", "#2E5A8F", "#4ADE80", "#22C55E", "#F59E0B", "#EF4444"]

export function GeoChart({ data }: GeoChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="users"
                    nameKey="country"
                    label={({ name, percent }) =>
                        `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface InvoicesChartProps {
    data: { month: string; amount: number; count: number }[]
}

export function InvoicesChart({ data }: InvoicesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                    yAxisId="left"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [
                        name === "amount" && value !== undefined ? `$${value.toLocaleString()}` : value,
                        name === "amount" ? "Revenue" : "Invoices",
                    ]}
                />
                <Legend />
                <Bar
                    yAxisId="left"
                    dataKey="amount"
                    name="Revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    yAxisId="right"
                    dataKey="count"
                    name="Invoices"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
