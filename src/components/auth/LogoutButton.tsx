"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    return (
        <button onClick={handleLogout} className="p-1 hover:bg-white/10 rounded group transition-colors">
            <LogOut className="w-4 h-4 text-white/70 group-hover:text-white" />
        </button>
    )
}
