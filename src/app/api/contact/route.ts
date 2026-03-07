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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl) {
            console.error("NEXT_PUBLIC_SUPABASE_URL is not set")
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            )
        }

        if (!supabaseServiceKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not set - cannot bypass RLS for contact form insert")
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            )
        }

        // Use service role key to bypass RLS so anonymous users can submit
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Insert message
        const { error } = await supabase
            .from("contact_messages")
            .insert({
                name,
                email,
                subject: subject || null,
                message,
            })

        if (error) {
            console.error("Supabase error saving contact message:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
            })
            return NextResponse.json(
                { error: "Failed to save message" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Unexpected error in contact API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
