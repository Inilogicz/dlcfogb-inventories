"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import DashboardNav from "./DashboardNav"
import LogoutButton from "@/components/auth/LogoutButton"

interface MobileHeaderProps {
    role: string
    fullName: string | null
    initials: string
    roleLabel: string
}

export default function MobileHeader({ role, fullName, initials, roleLabel }: MobileHeaderProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Mobile Topbar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200/60 px-4 py-3 flex items-center gap-3 shadow-sm">
                <button
                    onClick={() => setOpen(true)}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <p className="font-bold text-brand-blue text-sm flex-1">DLCF Portal</p>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center text-xs font-black text-white">
                        {initials}
                    </div>
                    <LogoutButton />
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <div className={`
                fixed top-0 left-0 h-full w-72 z-50 flex flex-col
                bg-gradient-to-b from-[#1a2f6e] to-[#0f1e4a]
                shadow-2xl transition-transform duration-300 ease-in-out lg:hidden
                ${open ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Header */}
                <div className="px-5 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/dlcf-logo.png" alt="dlcf-logo" width={40} height={40} />
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">DLCF Oyo South</p>
                            <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="mx-5 h-px bg-white/10" />

                {/* Nav — pass onClose so clicking a link closes drawer */}
                <DashboardNav role={role} onClose={() => setOpen(false)} />

                {/* User info */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-white">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{fullName || "User"}</p>
                            <p className="text-[10px] text-white/50 font-medium">{roleLabel}</p>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {/* Push content down for mobile topbar */}
            <div className="lg:hidden h-[57px] w-0 flex-shrink-0" />
        </>
    )
}
