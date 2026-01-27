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

