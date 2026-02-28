"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Cluster } from "@/types/database"
import DashboardStats from "./DashboardStats"
import DashboardTrends from "./DashboardTrends"
import DashboardFilters, { DateFilter } from "./DashboardFilters"

interface DashboardContainerProps {
    role: string
    centerId: string | null
}

export default function DashboardContainer({ role, centerId }: DashboardContainerProps) {
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
    const [clusters, setClusters] = useState<Cluster[]>([])
    const [fetchingClusters, setFetchingClusters] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (role === 'super_admin') {
            async function fetchClusters() {
                setFetchingClusters(true)
                const { data } = await supabase.from('clusters').select('*').order('name')
                if (data) setClusters(data)
                setFetchingClusters(false)
            }
            fetchClusters()
        }
    }, [role])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Key Performance</h2>
                    <div className="h-px bg-gray-100 w-12 md:w-24" />
                </div>
                <DashboardFilters
                    onFilterChange={setDateFilter}
                    clusters={role === 'super_admin' ? clusters : undefined}
                    selectedClusterId={selectedClusterId}
                    onClusterChange={setSelectedClusterId}
                />
            </div>

            {/* Stats */}
            <DashboardStats
                role={role}
                centerId={centerId}
                filter={dateFilter}
                selectedClusterId={selectedClusterId}
            />

            {/* Charts */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Activity Trends</h2>
                    <div className="h-px bg-gray-100 flex-grow" />
                </div>
                <DashboardTrends
                    role={role}
                    centerId={centerId}
                    filter={dateFilter}
                    selectedClusterId={selectedClusterId}
                />
            </div>
        </div>
    )
}
