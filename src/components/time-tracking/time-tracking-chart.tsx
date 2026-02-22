"use client"

import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts"

interface TimeTrackingChartProps {
    data: {
        name: string
        hours: number
    }[]
}

export function TimeTrackingChart({ data }: TimeTrackingChartProps) {
    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-background/95 backdrop-blur-sm border border-border p-2 rounded-lg shadow-xl">
                                        <p className="text-xs font-semibold text-foreground">
                                            {payload[0].payload.name}
                                        </p>
                                        <p className="text-sm font-bold text-brand-primary">
                                            {payload[0].value} hours
                                        </p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar
                        dataKey="hours"
                        radius={[4, 4, 0, 0]}
                        className="fill-brand-primary transition-all duration-300"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                className="fill-brand-primary/80 hover:fill-brand-primary cursor-pointer"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
