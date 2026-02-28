"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"

export default function ActiveLink({
    href,
    icon: Icon,
    children,
}: {
    href: string
    icon: LucideIcon
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href)

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
        >
            <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-brand-orange shadow-sm shadow-brand-orange/40' : 'group-hover:bg-white/10'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <span>{children}</span>
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange" />
            )}
        </Link>
    )
}
