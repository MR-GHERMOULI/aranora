import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch project by share token (RLS policy allows anonymous access when share_token matches)
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status, start_date, end_date, created_at, user_id')
        .eq('share_token', token)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ error: "Project not found or sharing is disabled" }, { status: 404 });
    }

    // Fetch tasks for this project
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

    // Fetch the owner's profile for branding
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', project.user_id)
        .single();

    const safeTasks = (tasks || []).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
    }));

    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = safeTasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = safeTasks.filter(t => t.status === 'Todo' || t.status === 'Postponed').length;

    return NextResponse.json({
        project: {
            title: project.title,
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date,
        },
        tasks: safeTasks,
        stats: {
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            todo: todoTasks,
            percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        owner: {
            name: profile?.full_name || profile?.company_name || 'Freelancer',
            company: profile?.company_name || null,
        }
    });
}
