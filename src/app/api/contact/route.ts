import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function normalizeEmail(email: string) {
    if (!email) return ""
    let normalized = email.toLowerCase().trim()
    if (normalized.endsWith('@gmail.com') || normalized.endsWith('@googlemail.com')) {
        const [localPart] = normalized.split('@')
        let cleanedLocal = localPart.replace(/\./g, '')
        const plusIndex = cleanedLocal.indexOf('+')
        if (plusIndex !== -1) {
            cleanedLocal = cleanedLocal.substring(0, plusIndex)
        }
        normalized = `${cleanedLocal}@gmail.com`
    }
    return normalized
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, subject, message, website_url } = body

        // 1. Honeypot check (hidden field filled by bots)
        if (website_url) {
            console.log("Spam bot detected via honeypot field. Dropping message.")
            return NextResponse.json({ success: true }) // Fake success
        }

        // 2. Link spam check (more than 2 URLs)
        const urlCount = (message?.match(/http:|https:|www\./gi) || []).length;
        if (urlCount > 2) {
             console.log("Spam bot detected via excessive links. Dropping message.")
             return NextResponse.json({ success: true }) // Fake success
        }

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

        // Normalize email to prevent dot-trick variations cluttering the DB
        const normalizedEmail = normalizeEmail(email)

        // Insert message
        const { error } = await supabase
            .from("contact_messages")
            .insert({
                name,
                email: normalizedEmail,
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
