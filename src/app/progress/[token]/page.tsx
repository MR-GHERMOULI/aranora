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
        .select('full_name, company_name, logo_url, company_email, address, bio, portfolio_url')
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
            id: project.id,
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
            logo_url: profile?.logo_url || null,
            email: profile?.company_email || null,
            address: profile?.address || null,
            bio: profile?.bio || null,
            portfolio_url: profile?.portfolio_url || null,
        }
    }
}

import { headers } from "next/headers"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const { token } = await params
    const data = await getProjectData(token)
    const supabase = await createClient()
    const { data: brandingSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "branding")
        .single()
    
    const siteName = brandingSetting?.value?.site_name || "Aranora"

    const headerList = await headers()
    const host = headerList.get("host") || "aranora.com"
    const proto = headerList.get("x-forwarded-proto") || "https"
    const origin = `${proto}://${host}`

    if (data) {
        const titleText = `${data.project.title} — Project Progress`
        const descText = `Track the progress of ${data.project.title} securely. Current completion: ${data.stats.percentage}%.`
        const ogImage = `${origin}/api/og?type=project&badge=PROJECT+PORTAL&title=${encodeURIComponent(data.project.title)}&subtitle=${encodeURIComponent(`Current completion: ${data.stats.percentage}% done. Track tasks, files, and milestones.`)}&progress=${data.stats.percentage}`

        return {
            title: `${titleText} | ${siteName}`,
            description: descText,
            openGraph: {
                title: `${titleText} | ${siteName}`,
                description: descText,
                url: `${origin}/progress/${token}`,
                siteName: siteName,
                images: [
                    {
                        url: ogImage,
                        width: 1200,
                        height: 630,
                        alt: `Track Project Progress: ${data.project.title}`,
                    }
                ],
                locale: "en_US",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: `${titleText} | ${siteName}`,
                description: descText,
                images: [ogImage],
            }
        }
    }

    const defaultTitle = `Project Progress | ${siteName}`
    const defaultDesc = 'Track project progress in real-time.'
    const defaultOg = `${origin}/api/og?type=project&badge=PROJECT+PORTAL&title=${encodeURIComponent(defaultTitle)}&subtitle=${encodeURIComponent(defaultDesc)}&progress=0`

    return {
        title: defaultTitle,
        description: defaultDesc,
        openGraph: {
            title: defaultTitle,
            description: defaultDesc,
            url: `${origin}/progress/${token}`,
            siteName: siteName,
            images: [
                {
                    url: defaultOg,
                    width: 1200,
                    height: 630,
                    alt: `Project Progress`,
                }
            ],
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: defaultTitle,
            description: defaultDesc,
            images: [defaultOg],
        }
    }
}

export default async function PublicProgressPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const data = await getProjectData(token)

    const supabase = await createClient()
    const { data: brandingSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "branding")
        .single()
    const platformLogoUrl = brandingSetting?.value?.logo_url || null;
    const platformSiteName = brandingSetting?.value?.site_name || "Aranora";

    return <PublicProgressClient 
        data={data} 
        platformLogoUrl={platformLogoUrl} 
        platformSiteName={platformSiteName} 
        projectId={data?.project?.id} 
    />
}
