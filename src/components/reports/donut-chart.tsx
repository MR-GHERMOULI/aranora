"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DonutChartProps {
    data: { name: string; value: number }[];
    colors?: string[];
}

const DEFAULT_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6", "#ec4899", "#14b8a6"];

export function DonutChart({ data, colors = DEFAULT_COLORS }: DonutChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No data to display
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                        <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
