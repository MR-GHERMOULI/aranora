'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { unstable_cache } from "next/cache";

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now).toISOString();
    const endOfCurrentMonth = endOfMonth(now).toISOString();
    const prevMonth = subMonths(now, 1);
    const startOfPrevMonth = startOfMonth(prevMonth).toISOString();
    const endOfPrevMonth = endOfMonth(prevMonth).toISOString();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5)).toISOString();

    const [
        profile,
        { count: totalClients },
        { count: activeProjects },
        { count: pendingInvoices },
        { data: montlyPaidInvoices },
        { data: allPaidInvoices },
        { data: revenueHistoryData },
        { data: recentProjects },
        { data: recentInvoices },
        { data: allProjects },
        { data: upcomingDeadlines },
        { data: prevMonthPaidInvoices },
        { data: pendingInvitations },
        timeEntriesResponse,
        activeTimerResponse
    ] = await Promise.all([
        // Cache profile data as it rarely changes
        unstable_cache(
            async () => {
                const { data } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single();
                return data;
            },
            [`profile-${user.id}`],
            { revalidate: 3600, tags: [`profile-${user.id}`] }
        )(),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'In Progress'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['Sent', 'Overdue']),
        supabase.from('invoices').select('total')
            .eq('user_id', user.id)
            .eq('status', 'Paid')
            .gte('issue_date', startOfCurrentMonth)
            .lte('issue_date', endOfCurrentMonth),
        supabase.from('invoices').select('total').eq('user_id', user.id).eq('status', 'Paid'),
        supabase.from('invoices').select('total, issue_date')
            .eq('user_id', user.id)
            .eq('status', 'Paid')
            .gte('issue_date', sixMonthsAgo),
        supabase.from('projects').select('id, title, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('id, invoice_number, created_at, total, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('projects').select('status').eq('user_id', user.id),
        supabase.from('tasks').select('id, title, due_date, project:projects(title)')
            .eq('user_id', user.id)
            .neq('status', 'Done')
            .gte('due_date', now.toISOString())
            .order('due_date', { ascending: true })
            .limit(5),
        supabase.from('invoices').select('total')
            .eq('user_id', user.id)
            .eq('status', 'Paid')
            .gte('issue_date', startOfPrevMonth)
            .lte('issue_date', endOfPrevMonth),
        supabase.from('notifications').select('*')
            .eq('user_id', user.id)
            .eq('type', 'invite')
            .eq('read', false)
            .order('created_at', { ascending: false }),
        supabase.from('time_entries').select('start_time, end_time')
            .eq('user_id', user.id)
            .gte('start_time', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('time_entries').select('id')
            .eq('user_id', user.id)
            .is('end_time', null)
            .maybeSingle()
    ]);

    const timeEntriesThisWeek = (timeEntriesResponse?.data as any[]) || [];
    const activeTimer = activeTimerResponse?.data;

    const totalSecondsThisWeek = timeEntriesThisWeek.reduce((sum: number, entry: any) => {
        if (!entry.start_time || !entry.end_time) return sum;
        return sum + (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000;
    }, 0);

    const monthlyRevenue = montlyPaidInvoices?.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0) || 0;
    const totalRevenue = allPaidInvoices?.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0) || 0;
    const prevMonthRevenue = prevMonthPaidInvoices?.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0) || 0;

    // Project Status Distribution
    const projectStatusCounts = {
        'Planning': 0, 'In Progress': 0, 'On Hold': 0, 'Completed': 0, 'Cancelled': 0
    };
    allProjects?.forEach(p => {
        if (p.status && projectStatusCounts.hasOwnProperty(p.status)) {
            projectStatusCounts[p.status as keyof typeof projectStatusCounts]++;
        }
    });

    // Process revenue history
    const revenueMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const key = format(date, 'MMM yyyy');
        revenueMap.set(key, 0);
    }
    revenueHistoryData?.forEach(invoice => {
        if (invoice.issue_date) {
            const key = format(new Date(invoice.issue_date), 'MMM yyyy');
            if (revenueMap.has(key)) {
                revenueMap.set(key, (revenueMap.get(key) || 0) + Number(invoice.total));
            }
        }
    });
    const revenueChartData = Array.from(revenueMap.entries()).map(([name, total]) => ({ name, total }));

    // Process Recent Activity (Only projects and invoices for now, removed clients for query optimization)
    const activities = [
        ...(recentProjects || []).map(p => ({ type: 'project', id: p.id, title: `Project created: ${p.title}`, date: p.created_at, link: `/projects/${p.id}` })),
        ...(recentInvoices || []).map(i => ({ type: 'invoice', id: i.id, title: `Invoice generated: ${i.invoice_number}`, date: i.created_at, link: `/invoices/${i.id}` }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return {
        profile: { full_name: profile?.full_name || user.email, username: profile?.username },
        totalClients: totalClients || 0,
        activeProjects: activeProjects || 0,
        pendingInvoices: pendingInvoices || 0,
        monthlyRevenue,
        prevMonthRevenue,
        totalRevenue,
        revenueChartData,
        projectStatusCounts,
        activities,
        recentProjects: recentProjects || [],
        recentInvoices: recentInvoices || [],
        upcomingDeadlines: upcomingDeadlines || [],
        pendingInvitations: pendingInvitations || [],
        totalSecondsThisWeek,
        hasActiveTimer: !!activeTimer
    };
}

export type ReminderSeverity = 'high' | 'medium' | 'low';

export interface SmartReminder {
    id: string;
    title: string;
    description: string;
    severity: ReminderSeverity;
    actionLabel: string;
    actionLink: string;
    date?: string;
}

export async function getSmartReminders(): Promise<SmartReminder[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const [
        { data: overdueInvoices },
        { data: upcomingTasks },
        { data: pendingContracts },
        { data: staleClients }
    ] = await Promise.all([
        // 1. Overdue Invoices
        supabase.from('invoices')
            .select('id, invoice_number, total, due_date, client:clients(name)')
            .eq('user_id', user.id)
            .or(`status.eq.Overdue,and(status.eq.Sent,due_date.lt.${today.toISOString()})`)
            .limit(3),

        // 2. Upcoming Task Deadlines
        supabase.from('tasks')
            .select('id, title, due_date, project:projects(title)')
            .eq('user_id', user.id)
            .neq('status', 'Done')
            .gte('due_date', today.toISOString())
            .lte('due_date', threeDaysFromNow.toISOString())
            .limit(3),

        // 3. Stale Pending Contracts (older than 3 days)
        supabase.from('contracts')
            .select('id, title, client:clients(name), created_at')
            .eq('user_id', user.id)
            .eq('status', 'Sent')
            .lte('created_at', new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())
            .limit(3),

        // 4. Clients with no active projects/invoices (Low priority re-engagement)
        // This is a bit complex for a single query, so we'll simplify: 
        // Just get clients created > 30 days ago. Ideally we'd join but keep it simple for MVP.
        supabase.from('clients')
            .select('id, name, created_at')
            .eq('user_id', user.id)
            .lte('created_at', new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .limit(2)
    ]);

    const reminders: SmartReminder[] = [];

    // Process Overdue Invoices (High Priority)
    overdueInvoices?.forEach(inv => {
        reminders.push({
            id: `inv-${inv.id}`,
            title: `Overdue Invoice #${inv.invoice_number}`,
            // @ts-ignore
            description: `${inv.client?.name || 'Client'} owes $${inv.total}`,
            severity: 'high',
            actionLabel: 'Send Reminder',
            actionLink: `/invoices/${inv.id}`,
            date: inv.due_date
        });
    });

    // Process Upcoming Tasks (High/Medium Priority)
    upcomingTasks?.forEach(task => {
        reminders.push({
            id: `task-${task.id}`,
            title: `Task Due Soon: ${task.title}`,
            // @ts-ignore
            description: task.project?.title ? `Project: ${task.project.title}` : 'General Task',
            severity: 'medium',
            actionLabel: 'Complete Task',
            actionLink: `/calendar`,
            date: task.due_date
        });
    });

    // Process Stale Contracts (Medium Priority)
    pendingContracts?.forEach(contract => {
        reminders.push({
            id: `contract-${contract.id}`,
            title: `Pending Contract: ${contract.title}`,
            // @ts-ignore
            description: `Sent to ${contract.client?.name} over 3 days ago`,
            severity: 'medium',
            actionLabel: 'Follow Up',
            actionLink: `/contracts/${contract.id}`,
            date: contract.created_at
        });
    });

    // Process Stale Clients (Low Priority) - Only if we have space
    if (reminders.length < 5) {
        staleClients?.forEach(client => {
            reminders.push({
                id: `client-${client.id}`,
                title: `Re-engage ${client.name}`,
                description: 'Client inactive for 30+ days. Pitch a new project?',
                severity: 'low',
                actionLabel: 'View Profile',
                actionLink: `/clients/${client.id}`
            });
        });
    }

    // Sort by severity (high > medium > low) and then date
    const severityMap = { high: 3, medium: 2, low: 1 };
    return reminders.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);
}
