"use client"

import { LogOut } from "lucide-react"
import { logout } from "@/app/(auth)/actions"
import { cn } from "@/lib/utils"

export function LogoutButton() {
    const handleLogout = async () => {
        await logout()
    }

    return (
        <div
            onClick={handleLogout}
            className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
            )}
        >
            <div className="flex items-center flex-1">
                <LogOut className="h-5 w-5 mr-3 text-red-500" />
                Logout
            </div>
        </div>
    )
}
