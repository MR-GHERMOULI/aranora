'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getAnalyticsData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch Invoices for Revenue
    const { data: invoices } = await supabase
        .from('invoices')
        .select('total, created_at, status')
        .eq('user_id', user.id);

    // Fetch Clients
    const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Fetch Projects
    const { data: projects } = await supabase
        .from('projects')
        .select('status')
        .eq('user_id', user.id);

    // Process Revenue Data (Monthly)
    const revenueByMonth = new Map<string, number>();
    let totalRevenue = 0;
    let pendingRevenue = 0;

    invoices?.forEach(inv => {
        if (inv.status === 'Paid') {
            totalRevenue += inv.total;
            const month = new Date(inv.created_at).toLocaleString('default', { month: 'short' });
            revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + inv.total);
        } else if (inv.status === 'Sent' || inv.status === 'Overdue') {
            pendingRevenue += inv.total;
        }
    });

    const chartData = Array.from(revenueByMonth.entries()).map(([name, total]) => ({ name, total }));

    // Process Project Status
    const projectStats = {
        pending: projects?.filter(p => p.status === 'Pending').length || 0,
        inProgress: projects?.filter(p => p.status === 'In Progress').length || 0,
        completed: projects?.filter(p => p.status === 'Completed').length || 0,
    };

    return {
        totalRevenue,
        pendingRevenue,
        totalClients: clientCount || 0,
        totalProjects: projects?.length || 0,
        chartData,
        projectStats
    };
}

export async function getClientAnalytics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch clients with their projects and invoices
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id);

    const { data: projects } = await supabase
        .from('projects')
        .select('client_id')
        .eq('user_id', user.id);

    const { data: invoices } = await supabase
        .from('invoices')
        .select('client_id, total, status')
        .eq('user_id', user.id);

    // Process data for each client
    const clientData = clients?.map(client => {
        const clientProjects = projects?.filter(p => p.client_id === client.id) || [];
        const clientInvoices = invoices?.filter(i => i.client_id === client.id) || [];
        const revenue = clientInvoices
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => sum + i.total, 0);

        return {
            id: client.id,
            name: client.name,
            projectCount: clientProjects.length,
            invoiceCount: clientInvoices.length,
            revenue
        };
    }) || [];

    // Sort by revenue descending
    return clientData.sort((a, b) => b.revenue - a.revenue);
}

export async function getExportData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number, status, total, issue_date, due_date, client:clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return invoices?.map(inv => ({
        invoice_number: inv.invoice_number,
        // @ts-ignore
        client: inv.client?.name || 'N/A',
        status: inv.status,
        total: inv.total,
        issue_date: inv.issue_date,
        due_date: inv.due_date || 'N/A'
    })) || [];
}

export async function getTaskAnalytics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: tasks } = await supabase.from('tasks')
        .select('id, status, created_at, updated_at')
        .eq('user_id', user.id);

    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.status === 'Done').length || 0;
    const inProgress = tasks?.filter(t => t.status === 'In Progress').length || 0;
    const todo = tasks?.filter(t => t.status === 'Todo').length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, todo, completionRate };
}

export async function getExpenseData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: subscriptions } = await supabase.from('subscriptions')
        .select('id, name, price, billing_cycle, category, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

    let totalMonthly = 0;
    let totalYearly = 0;
    const byCategory: Record<string, number> = {};

    subscriptions?.forEach((sub: any) => {
        const monthlyPrice = sub.billing_cycle === 'yearly' ? sub.price / 12 : sub.price;
        totalMonthly += monthlyPrice;
        totalYearly += sub.billing_cycle === 'yearly' ? sub.price : sub.price * 12;
        const cat = sub.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + monthlyPrice;
    });

    const categoryBreakdown = Object.entries(byCategory).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
    }));

    return { totalMonthly: Math.round(totalMonthly * 100) / 100, totalYearly: Math.round(totalYearly * 100) / 100, categoryBreakdown, count: subscriptions?.length || 0 };
}

export async function getProjectProfitability() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: projects } = await supabase.from('projects')
        .select('id, title, budget, status')
        .eq('user_id', user.id);

    const { data: invoices } = await supabase.from('invoices')
        .select('project_id, total, status')
        .eq('user_id', user.id)
        .eq('status', 'Paid');

    const invoicesByProject: Record<string, number> = {};
    invoices?.forEach((inv: any) => {
        if (inv.project_id) {
            invoicesByProject[inv.project_id] = (invoicesByProject[inv.project_id] || 0) + Number(inv.total);
        }
    });

    return (projects || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        budget: Number(p.budget) || 0,
        invoiced: invoicesByProject[p.id] || 0,
        status: p.status,
        utilization: p.budget ? Math.round(((invoicesByProject[p.id] || 0) / Number(p.budget)) * 100) : 0,
    })).filter((p: any) => p.budget > 0 || p.invoiced > 0);
}
