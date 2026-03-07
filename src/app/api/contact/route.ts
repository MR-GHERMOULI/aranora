import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, subject, message } = body

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Use service role key since standard client might be blocked by RLS for anon inserts
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Insert message
        const { error } = await supabase
            .from("contact_messages")
            .insert({
                name,
                email,
                subject,
                message,
            })

        if (error) {
            console.error("Error saving message:", error)
            return NextResponse.json(
                { error: "Failed to save message" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error in contact API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
