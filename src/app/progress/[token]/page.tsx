export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server"
import PublicProgressClient from "./public-progress-client"

async function getProjectData(token: string) {
    const supabase = await createClient()

    // Fetch project by share token
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status, start_date, end_date, created_at, user_id')
        .eq('share_token', token)
        .single()

    if (projectError || !project) return null

    // Fetch tasks for this project
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true })

    // Fetch the owner's profile for branding
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', project.user_id)
        .single()

    const safeTasks = (tasks || []).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
    }))

    const totalTasks = safeTasks.length
    const completedTasks = safeTasks.filter(t => t.status === 'Done').length
    const inProgressTasks = safeTasks.filter(t => t.status === 'In Progress').length
    const todoTasks = safeTasks.filter(t => t.status === 'Todo' || t.status === 'Postponed').length

    return {
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
    }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const data = await getProjectData(token)

    if (data) {
        return {
            title: `${data.project.title} — Project Progress | Aranora`,
            description: `Track the progress of ${data.project.title}. ${data.stats.percentage}% complete.`,
        }
    }

    return {
        title: 'Project Progress | Aranora',
        description: 'Track project progress in real-time.',
    }
}

export default async function PublicProgressPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const data = await getProjectData(token)

    return <PublicProgressClient data={data} />
}
