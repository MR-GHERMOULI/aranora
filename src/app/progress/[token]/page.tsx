import PublicProgressClient from "./public-progress-client"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    try {
        const res = await fetch(`${baseUrl}/api/projects/shared/${token}`, {
            cache: 'no-store',
        })
        if (res.ok) {
            const data = await res.json()
            return {
                title: `${data.project.title} — Project Progress | Aranora`,
                description: `Track the progress of ${data.project.title}. ${data.stats.percentage}% complete.`,
            }
        }
    } catch { }

    return {
        title: 'Project Progress | Aranora',
        description: 'Track project progress in real-time.',
    }
}

export default async function PublicProgressPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')

    let data = null
    try {
        const res = await fetch(`${baseUrl}/api/projects/shared/${token}`, {
            cache: 'no-store',
        })
        if (res.ok) {
            data = await res.json()
        }
    } catch (err) {
        console.error('Error fetching shared project:', err)
    }

    return <PublicProgressClient data={data} />
}
