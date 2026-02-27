"use server";

import { createClient } from "@/lib/supabase/server";
import { TimeEntry } from "@/types";
import { revalidatePath } from "next/cache";

export async function getTimeEntries(filters?: {
    projectId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("time_entries")
        .select(`
            *,
            project:projects(title, user_id),
            task:tasks(title),
            profiles:user_id(full_name, avatar_url, email)
        `)
        .eq("user_id", user.id)
        .order("start_time", { ascending: false });

    // RLS handles the filtering, but we can be explicit if we want for performance
    // or to allow a "View All" for projects where I am a collaborator.

    if (filters?.projectId) query = query.eq("project_id", filters.projectId);
    if (filters?.taskId) query = query.eq("task_id", filters.taskId);
    if (filters?.startDate) query = query.gte("start_time", filters.startDate);
    if (filters?.endDate) query = query.lte("start_time", filters.endDate);

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching time entries:", error);
        throw new Error("Failed to fetch time entries");
    }

    return data as TimeEntry[];
}

export async function getActiveTimer() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("time_entries")
        .select(`
            *,
            project:projects(title),
            task:tasks(title)
        `)
        .eq("user_id", user.id)
        .is("end_time", null)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
        console.error("Error fetching active timer:", error);
        return null;
    }

    return data as TimeEntry | null;
}

export async function startTimeEntry(data: {
    projectId?: string;
    taskId?: string;
    description?: string;
    isBillable?: boolean;
    hourlyRate?: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check for existing active timer and stop it
    const activeTimer = await getActiveTimer();
    if (activeTimer) {
        await stopTimeEntry(activeTimer.id);
    }

    let hourlyRate = data.hourlyRate;

    // If no hourly rate provided, try to fetch project default
    if (hourlyRate === undefined && data.projectId) {
        const { data: project } = await supabase
            .from("projects")
            .select("hourly_rate")
            .eq("id", data.projectId)
            .single();

        if (project?.hourly_rate) {
            hourlyRate = project.hourly_rate;
        }
    }

    const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        project_id: data.projectId,
        task_id: data.taskId,
        description: data.description,
        is_billable: data.isBillable ?? true,
        hourly_rate: hourlyRate,
        start_time: new Date().toISOString(),
    });

    if (error) {
        console.error("Error starting time entry:", error);
        throw new Error("Failed to start timer");
    }

    revalidatePath("/time-tracking");
}

export async function stopTimeEntry(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("time_entries")
        .update({
            end_time: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error stopping time entry:", error);
        throw new Error("Failed to stop timer");
    }

    revalidatePath("/time-tracking");
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntry>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("time_entries")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating time entry:", error);
        throw new Error("Failed to update time entry");
    }

    revalidatePath("/time-tracking");
}

export async function deleteTimeEntry(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error deleting time entry:", error);
        throw new Error("Failed to delete time entry");
    }

    revalidatePath("/time-tracking");
}

export async function createTimeEntry(data: {
    projectId?: string;
    taskId?: string;
    description?: string;
    startTime: string;
    endTime: string;
    isBillable?: boolean;
    hourlyRate?: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        project_id: data.projectId,
        task_id: data.taskId,
        description: data.description,
        start_time: data.startTime,
        end_time: data.endTime,
        is_billable: data.isBillable ?? true,
        hourly_rate: data.hourlyRate,
    });

    if (error) {
        console.error("Error creating time entry:", error);
        throw new Error("Failed to create time entry");
    }

    revalidatePath("/time-tracking");
}

export async function bulkLinkToInvoice(timeEntryIds: string[], invoiceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("time_entries")
        .update({ invoice_id: invoiceId })
        .in("id", timeEntryIds);

    if (error) {
        console.error("Error linking time entries to invoice:", error);
        throw new Error("Failed to link time entries to invoice");
    }

    revalidatePath("/invoices");
    revalidatePath("/time-tracking");
}

export async function getUnbilledEntries(projectId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
        .from("time_entries")
        .select(`
            *,
            project:projects(title),
            task:tasks(title)
        `)
        .is("invoice_id", null)
        .eq("is_billable", true)
        .not("end_time", "is", null);

    if (projectId) {
        query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching unbilled entries:", error);
        return [];
    }

    return data as TimeEntry[];
}

export async function getTaskTotalTime(taskId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data, error } = await supabase
        .from("time_entries")
        .select("start_time, end_time")
        .eq("task_id", taskId)
        .not("end_time", "is", null);

    if (error) {
        console.error("Error fetching task time:", error);
        return 0;
    }

    return (data || []).reduce((total, entry) => {
        const start = new Date(entry.start_time).getTime();
        const end = new Date(entry.end_time!).getTime();
        return total + (end - start) / 1000;
    }, 0);
}

