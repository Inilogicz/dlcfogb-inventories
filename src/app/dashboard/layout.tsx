import { requireUser } from "@/lib/auth-utils"
import LogoutButton from "../../components/auth/LogoutButton"
import DashboardNav from "../../components/dashboard/DashboardNav"
import MobileHeader from "../../components/dashboard/MobileHeader"
import Image from "next/image"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await requireUser()

    const roleLabels: Record<string, string> = {
        super_admin: "Super Admin",
        cluster_admin: "Cluster Admin",
        center_rep: "Center Rep",
    }

    const initials = (profile.full_name || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex h-screen bg-[#F4F6FB] overflow-hidden">
            {/* Sidebar (desktop always visible; mobile controlled by MobileHeader) */}
            <div className="hidden lg:flex w-64 flex-col">
                <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2f6e] to-[#0f1e4a] shadow-xl shadow-brand-blue/20">
                    {/* Logo */}
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-3">
                            <Image src="/dlcf-logo.png" alt="dlcf-logo" width={50} height={50} />
                            <div>
                                <p className="text-white font-bold text-sm leading-tight">DLCF Oyo South</p>
                                <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Portal</p>
                            </div>
                        </div>
                    </div>
                    <div className="mx-6 h-px bg-white/10" />

                    {/* Nav */}
                    <DashboardNav role={profile.role} />

                    {/* User info at bottom */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-white shadow-lg shadow-brand-orange/30">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{profile.full_name || "User"}</p>
                                <p className="text-[10px] text-white/50 font-medium">{roleLabels[profile.role] || profile.role}</p>
                            </div>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sidebar + topbar */}
            <MobileHeader role={profile.role} fullName={profile.full_name} initials={initials} roleLabel={roleLabels[profile.role] || profile.role} />

            {/* Main content area */}
            <main className="flex-1 overflow-auto">
                {/* Topbar (desktop only) */}
                <div className="hidden lg:flex sticky top-0 z-10 bg-[#F4F6FB]/80 backdrop-blur border-b border-gray-200/60 px-8 py-3 items-center justify-between">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        DLCF Oyo South Portal
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-gray-500 font-medium">Live</span>
                    </div>
                </div>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
