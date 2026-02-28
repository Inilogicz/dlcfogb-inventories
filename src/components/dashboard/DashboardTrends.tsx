"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AttendanceChart, OfferingChart } from "./DashboardCharts"
import { ChartSkeleton } from "@/components/ui/Skeletons"
import { Users, PhilippinePeso as Naira, TrendingUp } from "lucide-react"
import { DateFilter } from "./DashboardFilters"

export default function DashboardTrends({
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
    const [loading, setLoading] = useState(true)
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [offeringData, setOfferingData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        async function fetchTrends() {
            setLoading(true)

            let profileClusterId = null
            if (role === 'cluster_admin') {
                const { data: profile } = await supabase.from('profiles').select('cluster_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()
                profileClusterId = profile?.cluster_id
            }

            let attQuery = supabase.from('attendance_submissions').select('*')
            let offQuery = supabase.from('offering_submissions').select('*')

            // Apply Date Filter
            if (filter !== 'all') {
                const now = new Date()
                let startDate = new Date()
                if (filter === '7d') startDate.setDate(now.getDate() - 7)
                else if (filter === '30d') startDate.setDate(now.getDate() - 30)
                else if (filter === '90d') startDate.setDate(now.getDate() - 90)

                const dateStr = startDate.toISOString().split('T')[0]
                attQuery = attQuery.gte('service_date', dateStr)
                offQuery = offQuery.gte('service_date', dateStr)
            }

            if (role === 'center_rep' && centerId) {
                attQuery = attQuery.eq('center_id', centerId).eq('submission_level', 'center')
                offQuery = offQuery.eq('center_id', centerId).eq('submission_level', 'center')
            } else if (role === 'cluster_admin' && profileClusterId) {
                const { data: centers } = await supabase.from('centers').select('id').eq('cluster_id', profileClusterId)
                const centerIds = centers?.map(c => c.id) || []
                attQuery = attQuery.or(`cluster_id.eq.${profileClusterId},center_id.in.(${centerIds.join(',')})`)
                offQuery = offQuery.or(`cluster_id.eq.${profileClusterId},center_id.in.(${centerIds.join(',')})`)
            } else if (role === 'super_admin' && selectedClusterId) {
                // Super Admin selecting a specific cluster
                const { data: centers } = await supabase.from('centers').select('id').eq('cluster_id', selectedClusterId)
                const centerIds = centers?.map(c => c.id) || []
                attQuery = attQuery.or(`cluster_id.eq.${selectedClusterId},center_id.in.(${centerIds.join(',')})`)
                offQuery = offQuery.or(`cluster_id.eq.${selectedClusterId},center_id.in.(${centerIds.join(',')})`)
            }

            const [attRes, offRes] = await Promise.all([
                attQuery.order('service_date', { ascending: true }).limit(100),
                offQuery.order('service_date', { ascending: true }).limit(100)
            ])

            const attMap: Record<string, number> = {}
            attRes.data?.forEach(item => {
                const manualTotal = (
                    (item.adult_brothers || 0) + (item.adult_sisters || 0) +
                    (item.youth_brothers || 0) + (item.youth_sisters || 0) +
                    (item.children_brothers || 0) + (item.children_sisters || 0) +
                    (item.visitors_brothers || 0) + (item.visitors_sisters || 0)
                )
                const total = manualTotal > 0 ? manualTotal : (item.grand_total || 0)
                attMap[item.service_date] = (attMap[item.service_date] || 0) + total
            })

            const offMap: Record<string, number> = {}
            offRes.data?.forEach(item => {
                offMap[item.service_date] = (offMap[item.service_date] || 0) + Number(item.amount_100 || 0)
            })

            const allDates = Array.from(new Set([...Object.keys(attMap), ...Object.keys(offMap)])).sort()

            // For charts, we show a subset or all depending on filter
            let displayDates = allDates
            if (filter === 'all' || filter === '90d') displayDates = allDates.slice(-14) // Last 14 points to avoid overcrowding
            else displayDates = allDates

            const formattedAtt = displayDates.map(date => ({
                name: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
                attendance: attMap[date] || 0
            }))

            const formattedOff = displayDates.map(date => ({
                name: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
                amount: offMap[date] || 0
            }))

            setAttendanceData(formattedAtt)
            setOfferingData(formattedOff)
            setLoading(false)
        }
        fetchTrends()
    }, [role, centerId, filter, selectedClusterId])

    const EmptyState = ({ label }: { label: string }) => (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">No {label} data for this period</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Users className="w-4 h-4 text-brand-orange" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">Attendance Trends</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                    {filter === 'all' ? 'Historical Overview' : `Last ${filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} Days`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    {loading ? <ChartSkeleton /> : attendanceData.length > 0 ? (
                        <AttendanceChart data={attendanceData} />
                    ) : (
                        <EmptyState label="attendance" />
                    )}
                </div>
            </div>

            {/* Offering Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <Naira className="w-4 h-4 text-brand-blue" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">Offering Trends</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                    {filter === 'all' ? 'Historical Overview' : `Last ${filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} Days`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    {loading ? <ChartSkeleton /> : offeringData.length > 0 ? (
                        <OfferingChart data={offeringData} />
                    ) : (
                        <EmptyState label="offering" />
                    )}
                </div>
            </div>
        </div>
    )
}
