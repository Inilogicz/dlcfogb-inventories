import { getUserProfile } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardContainer from "@/components/dashboard/DashboardContainer"
import { Calendar } from "lucide-react"

export default async function DashboardPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/login')
    }

    const now = new Date()
    const dateString = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const roleLabels: Record<string, string> = {
        super_admin: "Super Admin",
        region_admin: "Region Admin",
        cluster_admin: "Cluster Admin",
        center_rep: "Center Representative",
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <p className="text-xs font-black text-brand-orange uppercase tracking-[0.2em]">
                        {roleLabels[profile.role] || profile.role}
                    </p>
                    <h1 className="text-3xl font-black text-gray-900">
                        Welcome back, {(profile.full_name || "Brother/Sister").split(" ")[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Here's a live overview of your portal activity.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-brand-blue shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-gray-900">{dateString}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Today</p>
                    </div>
                </div>
            </div>

            {/* Combined Dashboard Container (Filters + Stats + Trends) */}
            <DashboardContainer role={profile.role} centerId={profile.center_id} />
        </div>
    )
}
