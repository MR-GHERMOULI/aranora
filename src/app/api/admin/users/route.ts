import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify the requester is an admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        }

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        const supabaseAdmin = createAdminClient()

        // Delete the user's profile first (cascade will handle related data)
        await supabaseAdmin.from("profiles").delete().eq("id", userId)

        // Delete the user via Supabase admin API (server-side only)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error("Error deleting user:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Log the activity using admin client to bypass RLS if necessary
        await supabaseAdmin.from("activity_logs").insert({
            admin_id: user.id,
            action: "Deleted User",
            action_type: "user",
            target_id: userId,
            metadata: {}
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error in delete user API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { userId, action } = body

        if (!userId || !action) {
            return NextResponse.json(
                { error: "Missing userId or action" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify the requester is an admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        }

        const supabaseAdmin = createAdminClient()

        // ── ACTION: activate ──
        // Extends user's trial by the specified duration and re-activates their account
        if (action === "activate") {
            const { months } = body

            if (!months || ![1, 6, 12].includes(months)) {
                return NextResponse.json(
                    { error: "months must be 1, 6, or 12" },
                    { status: 400 }
                )
            }

            const newTrialEnd = new Date()
            newTrialEnd.setMonth(newTrialEnd.getMonth() + months)

            const { error } = await supabaseAdmin
                .from("profiles")
                .update({
                    account_status: "active",
                    subscription_status: "trialing",
                    trial_ends_at: newTrialEnd.toISOString(),
                })
                .eq("id", userId)

            if (error) {
                console.error("Error activating user:", error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            await supabaseAdmin.from("activity_logs").insert({
                admin_id: user.id,
                action: `Activated User for ${months} month(s)`,
                action_type: "user",
                target_id: userId,
                metadata: { months, trial_ends_at: newTrialEnd.toISOString() }
            })

            return NextResponse.json({
                success: true,
                trial_ends_at: newTrialEnd.toISOString(),
                subscription_status: "trialing",
                account_status: "active",
            })
        }

        // ── ACTION: suspend ──
        // Suspends the account: sets account_status = 'suspended' and
        // subscription_status = 'expired', blocking all platform usage
        // until manually re-activated by admin.
        if (action === "suspend") {
            const { error } = await supabaseAdmin
                .from("profiles")
                .update({
                    account_status: "suspended",
                    subscription_status: "expired",
                })
                .eq("id", userId)

            if (error) {
                console.error("Error suspending user:", error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            await supabaseAdmin.from("activity_logs").insert({
                admin_id: user.id,
                action: "Suspended User",
                action_type: "user",
                target_id: userId,
                metadata: {}
            })

            return NextResponse.json({
                success: true,
                account_status: "suspended",
                subscription_status: "expired",
            })
        }

        // ── Legacy: simple status update ──
        if (action === "update_status") {
            const { status } = body
            if (!status) {
                return NextResponse.json({ error: "Missing status" }, { status: 400 })
            }

            const { error } = await supabaseAdmin
                .from("profiles")
                .update({ account_status: status })
                .eq("id", userId)

            if (error) {
                console.error("Error updating user status:", error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            await supabaseAdmin.from("activity_logs").insert({
                admin_id: user.id,
                action: `Changed User Status to ${status}`,
                action_type: "user",
                target_id: userId,
                metadata: { new_status: status }
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    } catch (error) {
        console.error("Error in update user API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
