"use client"

import { useState } from "react"
import { Calendar, ChevronDown, Filter, MapPin } from "lucide-react"
import { Cluster, Region } from "@/types/database"

export type DateFilter = '7d' | '30d' | '90d' | 'all'

interface DashboardFiltersProps {
    onFilterChange: (filter: DateFilter) => void
    regions?: Region[]
    selectedRegionId?: string | null
    onRegionChange?: (regionId: string | null) => void
    clusters?: Cluster[]
    selectedClusterId?: string | null
    onClusterChange?: (clusterId: string | null) => void
}

export default function DashboardFilters({
    onFilterChange,
    regions,
    selectedRegionId,
    onRegionChange,
    clusters,
    selectedClusterId,
    onClusterChange
}: DashboardFiltersProps) {
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [dateOpen, setDateOpen] = useState(false)
    const [regionOpen, setRegionOpen] = useState(false)
    const [clusterOpen, setClusterOpen] = useState(false)

    const dateOptions: { label: string, value: DateFilter }[] = [
        { label: "Last 7 Days", value: '7d' },
        { label: "Last 30 Days", value: '30d' },
        { label: "Last 3 Months", value: '90d' },
        { label: "All Time", value: 'all' },
    ]

    const handleDateSelect = (val: DateFilter) => {
        setDateFilter(val)
        onFilterChange(val)
        setDateOpen(false)
    }

    const handleRegionSelect = (id: string | null) => {
        onRegionChange?.(id)
        setRegionOpen(false)
    }

    const handleClusterSelect = (id: string | null) => {
        onClusterChange?.(id)
        setClusterOpen(false)
    }

    const selectedRegionName = regions?.find(r => r.id === selectedRegionId)?.name || "All Regions"
    const selectedClusterName = clusters?.find(c => c.id === selectedClusterId)?.name || "All Clusters"

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="relative">
                <button
                    onClick={() => { setDateOpen(!dateOpen); setRegionOpen(false); setClusterOpen(false); }}
                    className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                >
                    <div className="p-1.5 bg-brand-orange/10 rounded-lg">
                        <Filter className="w-3.5 h-3.5 text-brand-orange" />
                    </div>
                    <span>{dateOptions.find(o => o.value === dateFilter)?.label}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dateOpen ? 'rotate-180' : ''}`} />
                </button>

                {dateOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
                        <div className="absolute top-full left-0 md:right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 z-50 animate-in zoom-in-95 origin-top-left md:origin-top-right">
                            {dateOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleDateSelect(opt.value)}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${dateFilter === opt.value ? 'text-brand-blue bg-blue-50/50' : 'text-gray-600'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Region Filter */}
            {regions && regions.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => { setRegionOpen(!regionOpen); setClusterOpen(false); setDateOpen(false); }}
                        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="max-w-[120px] truncate">{selectedRegionName}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {regionOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setRegionOpen(false)} />
                            <div className="absolute top-full left-0 md:right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 z-50 animate-in zoom-in-95 origin-top-left md:origin-top-right overflow-hidden">
                                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">Filter by Region</p>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => handleRegionSelect(null)}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${!selectedRegionId ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600'}`}
                                    >
                                        All Regions
                                    </button>
                                    {regions.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => handleRegionSelect(r.id)}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${selectedRegionId === r.id ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600'}`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Cluster Filter (Super Admin only - usually based on if clusters prop is present) */}
            {clusters && clusters.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => { setClusterOpen(!clusterOpen); setRegionOpen(false); setDateOpen(false); }}
                        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <div className="p-1.5 bg-violet-50 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <span className="max-w-[120px] truncate">{selectedClusterName}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${clusterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {clusterOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setClusterOpen(false)} />
                            <div className="absolute top-full left-0 md:right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 z-50 animate-in zoom-in-95 origin-top-left md:origin-top-right overflow-hidden">
                                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">Filter by Zone</p>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => handleClusterSelect(null)}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${!selectedClusterId ? 'text-violet-700 bg-violet-50' : 'text-gray-600'}`}
                                    >
                                        All Clusters
                                    </button>
                                    {clusters.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleClusterSelect(c.id)}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${selectedClusterId === c.id ? 'text-violet-700 bg-violet-50' : 'text-gray-600'}`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
