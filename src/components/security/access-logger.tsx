"use client"

import { useEffect } from "react"

/**
 * AccessLogger — invisible component that logs the user's IP and device info
 * once per 24 hours. It checks for a flag in sessionStorage to avoid duplicate
 * calls within the same browsing session, and the server sets a cookie that
 * prevents re-logging for 24 hours across sessions.
 */
export function AccessLogger() {
    useEffect(() => {
        // Only fire once per browser session to avoid spamming
        if (sessionStorage.getItem("aranora_access_logged")) return

        const logAccess = async () => {
            try {
                const res = await fetch("/api/auth/log-access", {
                    method: "POST",
                    credentials: "include", // send cookies
                })
                if (res.ok) {
                    sessionStorage.setItem("aranora_access_logged", "1")
                }
            } catch {
                // Silently fail — logging is non-critical
            }
        }

        logAccess()
    }, [])

    return null // This component renders nothing
}
