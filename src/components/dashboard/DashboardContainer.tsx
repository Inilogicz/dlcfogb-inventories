"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Cluster, Region } from "@/types/database"
import DashboardStats from "./DashboardStats"
import DashboardTrends from "./DashboardTrends"
import DashboardFilters, { DateFilter } from "./DashboardFilters"

interface DashboardContainerProps {
    role: string
    centerId: string | null
}

export default function DashboardContainer({ role, centerId }: DashboardContainerProps) {
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
    const [regions, setRegions] = useState<Region[]>([])
    const [clusters, setClusters] = useState<Cluster[]>([])
    const [fetchingData, setFetchingData] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchInitialData() {
            setFetchingData(true)

            if (role === 'super_admin') {
                const { data: regionsData } = await supabase.from('regions').select('*').order('name')
                if (regionsData) setRegions(regionsData)

                const { data: clustersData } = await supabase.from('clusters').select('*').order('name')
                if (clustersData) setClusters(clustersData)
            } else if (role === 'region_admin') {
                const { data: profile } = await supabase.auth.getUser().then(({ data: { user } }) =>
                    supabase.from('profiles').select('region_id').eq('id', user?.id || '').single()
                )
                const regionId = profile?.region_id
                setSelectedRegionId(regionId || null)

                if (regionId) {
                    const { data: clustersData } = await supabase.from('clusters').select('*').eq('region_id', regionId).order('name')
                    if (clustersData) setClusters(clustersData)
                }
            }

            setFetchingData(false)
        }
        fetchInitialData()
    }, [role])

    // Update clusters when region changes for Super Admin
    useEffect(() => {
        if (role === 'super_admin' && selectedRegionId) {
            async function fetchFilteredClusters() {
                const { data } = await supabase
                    .from('clusters')
                    .select('*')
                    .eq('region_id', selectedRegionId)
                    .order('name')
                if (data) setClusters(data)
                setSelectedClusterId(null) // Reset cluster when region changes
            }
            fetchFilteredClusters()
        } else if (role === 'super_admin' && !selectedRegionId) {
            async function fetchAllClusters() {
                const { data } = await supabase.from('clusters').select('*').order('name')
                if (data) setClusters(data)
            }
            fetchAllClusters()
        }
    }, [selectedRegionId, role])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Key Performance</h2>
                    <div className="h-px bg-gray-100 w-12 md:w-24" />
                </div>
                <DashboardFilters
                    onFilterChange={setDateFilter}
                    regions={role === 'super_admin' ? regions : undefined}
                    selectedRegionId={selectedRegionId}
                    onRegionChange={setSelectedRegionId}
                    clusters={clusters}
                    selectedClusterId={selectedClusterId}
                    onClusterChange={setSelectedClusterId}
                />
            </div>

            {/* Stats */}
            <DashboardStats
                role={role}
                centerId={centerId}
                filter={dateFilter}
                selectedRegionId={selectedRegionId}
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
                    selectedRegionId={selectedRegionId}
                    selectedClusterId={selectedClusterId}
                />
            </div>
        </div>
    )
}
