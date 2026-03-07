import { createClient } from "@/lib/supabase/server"
import { BroadcastsList } from "./broadcasts-list"

export const metadata = {
    title: "Broadcasts | Aranora",
}

export default async function BroadcastsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .like('type', 'broadcast_%')
        .order('created_at', { ascending: false })

    return <BroadcastsList notifications={notifications || []} />
}
