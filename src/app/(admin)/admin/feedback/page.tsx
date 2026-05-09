import { createClient } from "@/lib/supabase/server"
import { FeedbackTable } from "./feedback-table"
import { MessageSquare, Inbox } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
    const supabase = await createClient()

    // Fetch feedback with project titles
    const { data: feedback, error } = await supabase
        .from("customer_feedback")
        .select(`
            id,
            name,
            comment,
            photos,
            is_read,
            created_at,
            project:projects(title)
        `)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching feedback:", error)
    }

    const unreadCount = feedback?.filter(f => !f.is_read).length || 0

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        <Inbox className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Feedback Inbox</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Direct comments from project progress portals
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                        {unreadCount} New Comments
                    </div>
                )}
            </div>

            <FeedbackTable initialFeedback={feedback || []} />
        </div>
    )
}
