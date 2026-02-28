"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, PhilippinePeso as Naira, MapPin, Building2, TrendingUp, TrendingDown } from "lucide-react"
import { StatCardSkeleton } from "@/components/ui/Skeletons"
import { DateFilter } from "./DashboardFilters"

export default function DashboardStats({
    role,
    centerId,
    filter = 'all',
    selectedClusterId = null
}: {
    role: string,
    centerId?: string | null,
    filter?: DateFilter,
    selectedClusterId?: string | null
}) {
    const [stats, setStats] = useState({
        totalAttendance: 0,
        totalOffering: 0,
        clusters: 0,
        centers: 0
    })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            setLoading(true)
            let clusterId = null
            if (role === 'cluster_admin' || role === 'center_rep') {
                const { data: profile } = await supabase.from('profiles').select('cluster_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()
                clusterId = profile?.cluster_id
            }

            let attendanceQuery = supabase.from('attendance_submissions').select('*')
            let offeringQuery = supabase.from('offering_submissions').select('*')

            // Apply Date Filter
            if (filter !== 'all') {
                const now = new Date()
                let startDate = new Date()
                if (filter === '7d') startDate.setDate(now.getDate() - 7)
                else if (filter === '30d') startDate.setDate(now.getDate() - 30)
                else if (filter === '90d') startDate.setDate(now.getDate() - 90)

                const dateStr = startDate.toISOString().split('T')[0]
                attendanceQuery = attendanceQuery.gte('service_date', dateStr)
                offeringQuery = offeringQuery.gte('service_date', dateStr)
            }

            // Role and Cluster based filtering
            if (role === 'center_rep' && centerId) {
                attendanceQuery = attendanceQuery.eq('center_id', centerId).eq('submission_level', 'center')
                offeringQuery = offeringQuery.eq('center_id', centerId).eq('submission_level', 'center')
            } else if (role === 'cluster_admin' && clusterId) {
                const { data: centers } = await supabase.from('centers').select('id').eq('cluster_id', clusterId)
                const centerIds = centers?.map(c => c.id) || []
                attendanceQuery = attendanceQuery.or(`cluster_id.eq.${clusterId},center_id.in.(${centerIds.join(',')})`)
                offeringQuery = offeringQuery.or(`cluster_id.eq.${clusterId},center_id.in.(${centerIds.join(',')})`)
            } else if (role === 'super_admin' && selectedClusterId) {
                // Super Admin selecting a specific cluster
                const { data: centers } = await supabase.from('centers').select('id').eq('cluster_id', selectedClusterId)
                const centerIds = centers?.map(c => c.id) || []
                attendanceQuery = attendanceQuery.or(`cluster_id.eq.${selectedClusterId},center_id.in.(${centerIds.join(',')})`)
                offeringQuery = offeringQuery.or(`cluster_id.eq.${selectedClusterId},center_id.in.(${centerIds.join(',')})`)
            }

            const [attRes, offRes, clusRes, centRes] = await Promise.all([
                attendanceQuery,
                offeringQuery,
                supabase.from('clusters').select('id', { count: 'exact' }),
                supabase.from('centers').select('id', { count: 'exact' })
            ])

            // Robust calculation for attendance (sum up columns if grand_total is missing/buggy)
            const totalAtt = attRes.data?.reduce((sum, item) => {
                const manualTotal = (
                    (item.adult_brothers || 0) + (item.adult_sisters || 0) +
                    (item.youth_brothers || 0) + (item.youth_sisters || 0) +
                    (item.children_brothers || 0) + (item.children_sisters || 0) +
                    (item.visitors_brothers || 0) + (item.visitors_sisters || 0)
                )
                return sum + (manualTotal > 0 ? manualTotal : (item.grand_total || 0))
            }, 0) || 0

            const totalOff = offRes.data?.reduce((sum, item) => sum + Number(item.amount_100 || 0), 0) || 0

            setStats({
                totalAttendance: totalAtt,
                totalOffering: totalOff,
                clusters: clusRes.count || 0,
                centers: centRes.count || 0
            })
            setLoading(false)
        }
        fetchStats()
    }, [centerId, role, filter, selectedClusterId])

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
        )
    }

    const displayStats = [
        {
            label: "Total Attendance",
            value: stats.totalAttendance.toLocaleString(),
            icon: Users,
            gradient: "from-blue-500 to-brand-blue",
            bg: "bg-blue-50",
            trend: filter === 'all' ? "Historical total" : `Last ${filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} days`,
            up: true,
        },
        {
            label: "Total Offering (100%)",
            value: `₦${stats.totalOffering.toLocaleString()}`,
            icon: Naira,
            gradient: "from-amber-400 to-brand-orange",
            bg: "bg-amber-50",
            trend: filter === 'all' ? "Historical total" : `Last ${filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} days`,
            up: true,
        },
        {
            label: "Total Clusters",
            value: stats.clusters.toString(),
            icon: MapPin,
            gradient: "from-violet-500 to-purple-700",
            bg: "bg-violet-50",
            trend: "Active zones",
            up: null,
        },
        {
            label: "Total Centers",
            value: stats.centers.toString(),
            icon: Building2,
            gradient: "from-emerald-400 to-green-600",
            bg: "bg-emerald-50",
            trend: "All locations",
            up: null,
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayStats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group overflow-hidden relative">
                    <div className={`absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 -translate-y-4 translate-x-4 group-hover:opacity-10 transition-opacity`} />
                    <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 text-gray-700`} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">{stat.label}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 font-medium">{stat.trend}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
