"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, MapPin, ClipboardList, Package, Building2 } from "lucide-react"
import ActiveLink from "./ActiveLink"

const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "region_admin", "cluster_admin", "center_rep"] },
    { label: "Regions", href: "/dashboard/regions", icon: MapPin, roles: ["super_admin"] },
    { label: "Clusters", href: "/dashboard/clusters", icon: MapPin, roles: ["super_admin", "region_admin"] },
    { label: "Centers", href: "/dashboard/centers", icon: Building2, roles: ["super_admin", "region_admin", "cluster_admin"] },
    { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList, roles: ["super_admin", "region_admin", "cluster_admin", "center_rep"] },
    { label: "Offerings", href: "/dashboard/offerings", icon: ClipboardList, roles: ["super_admin", "region_admin", "cluster_admin", "center_rep"] },
    { label: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["super_admin", "region_admin", "cluster_admin", "center_rep"] },
    { label: "Users", href: "/dashboard/users", icon: Users, roles: ["super_admin", "region_admin"] },
]

interface DashboardNavProps {
    role: string
    onClose?: () => void
}

export default function DashboardNav({ role, onClose }: DashboardNavProps) {
    const filtered = navItems.filter(item => item.roles.includes(role))
    const pathname = usePathname()

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (onClose) onClose()
    }, [pathname])

    return (
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[9px] font-black text-white/30 uppercase tracking-[0.15em] mb-3 mt-1">Main Menu</p>
            {filtered.map(item => (
                <ActiveLink key={item.href} href={item.href} icon={item.icon}>
                    {item.label}
                </ActiveLink>
            ))}
        </nav>
    )
}
