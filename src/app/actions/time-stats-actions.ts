"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTeamId } from "@/lib/team-helpers";
import { differenceInSeconds, subDays, startOfDay, endOfDay, format } from "date-fns";

export async function getTimeTrackingStats() {
    const supabase = await createClient();
    const teamId = await getActiveTeamId();

    if (!teamId) {
        return {
            totalSecondsThisWeek: 0,
            totalSecondsLastWeek: 0,
            unbilledRevenue: 0,
            weeklyChartData: [],
        };
    }

    // Date calculations
    const now = new Date();
    const startOfThisWeek = startOfDay(subDays(now, 6)); // Last 7 days including today
    const startOfLastWeek = startOfDay(subDays(now, 13)); // Previous 7 days
    const endOfLastWeek = endOfDay(subDays(now, 7));

    // Fetch all entries for the last 14 days
    const { data: entries, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("team_id", teamId)
        .gte("start_time", startOfLastWeek.toISOString())
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Error fetching time tracking stats:", error);
        return {
            totalSecondsThisWeek: 0,
            totalSecondsLastWeek: 0,
            unbilledRevenue: 0,
            weeklyChartData: [],
        };
    }

    let totalSecondsThisWeek = 0;
    let totalSecondsLastWeek = 0;
    let unbilledRevenue = 0;

    // Initialize chart data for the last 7 days
    const chartDataMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        // Format as 'Mon', 'Tue', etc.
        chartDataMap.set(format(date, "EEE"), 0);
    }

    entries?.forEach((entry) => {
        if (!entry.end_time) return; // Skip active timers for stats

        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const durationSeconds = differenceInSeconds(end, start);
        const durationHours = durationSeconds / 3600;

        // Bucket into This Week vs Last Week
        if (start >= startOfThisWeek) {
            totalSecondsThisWeek += durationSeconds;

            // Add to chart data
            const dayName = format(start, "EEE");
            if (chartDataMap.has(dayName)) {
                chartDataMap.set(dayName, chartDataMap.get(dayName)! + durationHours);
            }

            // Calculate unbilled revenue
            if (entry.is_billable && !entry.invoice_id) {
                const rate = entry.hourly_rate || 0;
                unbilledRevenue += durationHours * rate;
            }
        } else if (start >= startOfLastWeek && start <= endOfLastWeek) {
            totalSecondsLastWeek += durationSeconds;
        }
    });

    // Format chart data for Recharts
    const weeklyChartData = Array.from(chartDataMap.entries()).map(([name, hours]) => ({
        name,
        hours: Number(hours.toFixed(1)), // Round to 1 decimal place
    }));

    return {
        totalSecondsThisWeek,
        totalSecondsLastWeek,
        unbilledRevenue,
        weeklyChartData,
    };
}
