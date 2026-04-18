"use server";

import { createClient } from "@/lib/supabase/server";
import { TimeEntry } from "@/types";
import { revalidatePath } from "next/cache";
import { requireActiveSubscription } from "@/lib/subscription-guard";

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
            task:tasks(title)
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
    await requireActiveSubscription();
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
    await requireActiveSubscription();
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
    await requireActiveSubscription();
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
    await requireActiveSubscription();
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
    await requireActiveSubscription();
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
    await requireActiveSubscription();
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
        .eq("user_id", user.id)
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

/**
 * Fetch ALL time entries for a project across every member (owner + collaborators).
 * Returns entries enriched with the tracked-by user's profile.
 * Only callable if the current user is the project owner or an active collaborator.
 */
export async function getProjectTimeEntries(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Use admin client to fetch all entries for this project regardless of user_id
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createAdminClient();

    // Verify access: user must be project owner or active collaborator
    const { data: project } = await adminSupabase
        .from("projects")
        .select("user_id")
        .eq("id", projectId)
        .single();

    if (!project) throw new Error("Project not found");

    const isOwner = project.user_id === user.id;

    if (!isOwner) {
        const { data: collabCheck } = await adminSupabase
            .from("project_collaborators")
            .select("id")
            .eq("project_id", projectId)
            .eq("collaborator_email", user.email)
            .eq("status", "active")
            .maybeSingle();

        if (!collabCheck) throw new Error("Access denied");
    }

    // Fetch ALL time entries for this project from every user
    const { data: entries, error } = await adminSupabase
        .from("time_entries")
        .select(`
            *,
            project:projects(title, user_id),
            task:tasks(title)
        `)
        .eq("project_id", projectId)
        .order("start_time", { ascending: false });

    if (error) {
        console.error("Error fetching project time entries:", error);
        throw new Error("Failed to fetch project time entries");
    }

    if (!entries || entries.length === 0) return [];

    // Collect unique user IDs and fetch their profiles
    const userIds = [...new Set(entries.map(e => e.user_id))];
    const { data: profiles } = await adminSupabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

    const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
    );

    // Enrich each entry with the member's profile
    return entries.map(entry => ({
        ...entry,
        member: profileMap.get(entry.user_id) || {
            id: entry.user_id,
            full_name: "Unknown",
            username: null,
            avatar_url: null,
        },
    }));
}

