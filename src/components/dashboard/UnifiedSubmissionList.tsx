"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AttendanceSubmission, OfferingSubmission, ServiceType, Center } from "@/types/database"
import { Loader2, Users, PhilippinePeso as Naira, Calendar, Building2, Eye, ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react"
import SubmissionDetailModal from "./SubmissionDetailModal"

export default function UnifiedSubmissionList({
    role,
    centerId
}: {
    role: string,
    centerId?: string | null
}) {
    const [unifiedData, setUnifiedData] = useState<any[]>([])
    const [serviceTypes, setServiceTypes] = useState<Record<string, string>>({})
    const [centers, setCenters] = useState<Record<string, string>>({})
    const [clusters, setClusters] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<{ attendance: any, offering: any, typeName: string, locationName: string, level: string } | null>(null)

    // Filtering, Sorting, Pagination States
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<'date' | 'attendance' | 'offering'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [itemsPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)
    const [groupByMonth, setGroupByMonth] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            // 1. Fetch Setting & Mapping Metadata
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase.from('profiles').select('region_id, cluster_id').eq('id', user?.id).single()

            let centerQuery = supabase.from('centers').select('id, name')
            let clusterQuery = supabase.from('clusters').select('id, name')

            // Apply scoping to metadata fetches
            if (role === 'region_admin' && profile?.region_id) {
                clusterQuery = clusterQuery.eq('region_id', profile.region_id)
                const { data: rClusters } = await supabase.from('clusters').select('id').eq('region_id', profile.region_id)
                const rClusterIds = rClusters?.map(cl => cl.id) || []
                centerQuery = centerQuery.in('cluster_id', rClusterIds)
            } else if (role === 'cluster_admin' && profile?.cluster_id) {
                clusterQuery = clusterQuery.eq('id', profile.cluster_id)
                centerQuery = centerQuery.eq('cluster_id', profile.cluster_id)
            }

            const [{ data: sTypes }, { data: cData }, { data: clData }] = await Promise.all([
                supabase.from('service_types').select('id, name'),
                centerQuery,
                clusterQuery
            ])

            const sMap = (sTypes || []).reduce((acc, curr: any) => ({ ...acc, [curr.id]: curr.name }), {})
            const cMap = (cData || []).reduce((acc, curr: any) => ({ ...acc, [curr.id]: curr.name }), {})
            const clMap = (clData || []).reduce((acc, curr: any) => ({ ...acc, [curr.id]: curr.name }), {})
            setServiceTypes(sMap)
            setCenters(cMap)
            setClusters(clMap)

            // 2. Fetch Submissions
            let attQuery = supabase.from('attendance_submissions').select('*')
            let offQuery = supabase.from('offering_submissions').select('*')

            if (centerId && role === 'center_rep') {
                attQuery = attQuery.eq('center_id', centerId).eq('submission_level', 'center')
                offQuery = offQuery.eq('center_id', centerId).eq('submission_level', 'center')
            } else if (role === 'cluster_admin' && profile?.cluster_id) {
                const centerIds = cData?.map(c => c.id) || []

                // Construct safe filter: submissions belonging to this cluster OR its centers
                let filters = [`cluster_id.eq.${profile.cluster_id}`]
                if (centerIds.length > 0) {
                    filters.push(`center_id.in.(${centerIds.join(',')})`)
                }
                const combined = filters.join(',')

                attQuery = attQuery.or(combined)
                offQuery = offQuery.or(combined)
            } else if (role === 'region_admin' && profile?.region_id) {
                const clusterIds = clData?.map(cl => cl.id) || []
                const centerIds = cData?.map(c => c.id) || []

                // Filter by identifying if the submission belongs to the region via its clusters, centers, OR is a regional general report
                let filters = [`region_id.eq.${profile.region_id}`]
                if (clusterIds.length > 0) filters.push(`cluster_id.in.(${clusterIds.join(',')})`)
                if (centerIds.length > 0) filters.push(`center_id.in.(${centerIds.join(',')})`)

                const combinedFilter = filters.join(',')
                attQuery = attQuery.or(combinedFilter)
                offQuery = offQuery.or(combinedFilter)
            }

            const [attRes, offRes] = await Promise.all([
                attQuery.order('service_date', { ascending: false }).limit(200),
                offQuery.order('service_date', { ascending: false }).limit(200)
            ])

            // 3. Collate/Join Data
            const attendance = attRes.data || []
            const offerings = offRes.data || []

            const collated: Record<string, any> = {}

            attendance.forEach(att => {
                const key = `${att.service_date}_${att.submission_level}_${att.center_id || att.cluster_id || 'general'}_${att.service_type_id}`
                collated[key] = { ...collated[key], attendance: att }
            })

            offerings.forEach(off => {
                const key = `${off.service_date}_${off.submission_level}_${off.center_id || off.cluster_id || 'general'}_${off.service_type_id}`
                collated[key] = { ...collated[key], offering: off }
            })

            console.log('--- Submissions Data fetched ---', Object.values(collated));
            setUnifiedData(Object.values(collated))
            setLoading(false)
        }
        fetchData()
    }, [centerId, role])

    // Derived Data (Filtering, Sorting, Pagination)
    const filteredData = unifiedData.filter(item => {
        const date = item.attendance?.service_date || item.offering?.service_date || ""
        const tId = item.attendance?.service_type_id || item.offering?.service_type_id
        const typeName = serviceTypes[tId] || ""
        return date.includes(searchTerm) || typeName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const sortedData = [...filteredData].sort((a, b) => {
        let valA, valB
        if (sortBy === 'date') {
            valA = new Date(a.attendance?.service_date || a.offering?.service_date).getTime()
            valB = new Date(b.attendance?.service_date || b.offering?.service_date).getTime()
        } else if (sortBy === 'attendance') {
            valA = a.attendance?.grand_total || 0
            valB = b.attendance?.grand_total || 0
        } else {
            valA = Number(a.offering?.amount_100 || 0)
            valB = Number(b.offering?.amount_100 || 0)
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA
    })

    const totalPages = Math.ceil(sortedData.length / itemsPerPage)
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const renderRow = (item: any, idx: number) => {
        const attendance = item.attendance
        const offering = item.offering
        const date = attendance?.service_date || offering?.service_date
        const level = attendance?.submission_level || offering?.submission_level
        const tId = attendance?.service_type_id || offering?.service_type_id
        const typeName = serviceTypes[tId] || "Unknown Service"

        let locationName = "General Organization"
        if (level === 'center') {
            locationName = centers[attendance?.center_id || offering?.center_id] || "Unknown Center"
        } else if (level === 'cluster') {
            locationName = `${clusters[attendance?.cluster_id || offering?.cluster_id] || "Unknown"} Cluster`
        } else if (level === 'general') {
            locationName = "Regional Combined Service"
        }

        return (
            <tr key={idx} className="group hover:bg-slate-50 transition-all cursor-pointer border-b border-transparent hover:border-slate-100" onClick={() => setSelectedItem({ attendance, offering, typeName, locationName, level })}>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{typeName}</span>
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                            <Calendar className="w-3 h-3" />
                            {new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                    </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">{locationName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-md w-fit ${level === 'center' ? 'bg-slate-100 text-slate-600' : level === 'cluster' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            {level === 'center' ? 'Center' : level === 'cluster' ? 'Cluster' : 'General'}
                        </span>
                    </div>
                </td>
                <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center justify-center bg-slate-50 text-slate-800 px-5 py-2.5 rounded-2xl font-black text-sm border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-100 transition-all shadow-sm">
                        {item.attendance ? (
                            (item.attendance.grand_total > 0 ? item.attendance.grand_total :
                                (item.attendance.adult_brothers + item.attendance.adult_sisters +
                                    item.attendance.youth_brothers + item.attendance.youth_sisters +
                                    item.attendance.children_brothers + item.attendance.children_sisters +
                                    item.attendance.visitors_brothers + item.attendance.visitors_sisters)).toLocaleString()
                        ) : "—"}
                    </div>
                </td>
                <td className="px-8 py-5 text-right">
                    <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        {item.offering ? `₦${Number(item.offering.amount_100).toLocaleString()}` : "—"}
                    </span>
                </td>
                <td className="px-8 py-5 text-right">
                    <button className="p-3 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all group-hover:scale-105 active:scale-90 border border-transparent hover:border-amber-100">
                        <Eye className="w-5 h-5" />
                    </button>
                </td>
            </tr>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 items-center flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                        <button
                            onClick={() => setGroupByMonth(false)}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest rounded-md transition-all ${!groupByMonth ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            LIST
                        </button>
                        <button
                            onClick={() => setGroupByMonth(true)}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest rounded-md transition-all ${groupByMonth ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            MONTHS
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="text-[10px] font-black tracking-widest px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none cursor-pointer hover:bg-slate-50 transition-colors uppercase"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="date">Date</option>
                            <option value="attendance">Attendance</option>
                            <option value="offering">Offering</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            <ArrowUpDown className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>

            {sortedData.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center space-y-6 shadow-xl shadow-gray-200/50">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-gray-50/50">
                        <Calendar className="w-10 h-10 text-gray-200" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">No records found</h3>
                        <p className="text-gray-400 max-w-sm mx-auto font-medium">Capture your first service session record to start tracking attendance and offerings.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                                    <th className="px-8 py-5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">Service Detail</th>
                                    <th className="px-8 py-5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">Location</th>
                                    <th className="px-8 py-5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-center font-black">Attendance</th>
                                    <th className="px-8 py-5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-right font-black">Offering (100%)</th>
                                    <th className="px-8 py-5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-right font-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {groupByMonth ? (
                                    (() => {
                                        const grouped: Record<string, any[]> = {}
                                        paginatedData.forEach(item => {
                                            const date = item.attendance?.service_date || item.offering?.service_date
                                            const month = new Date(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                                            if (!grouped[month]) grouped[month] = []
                                            grouped[month].push(item)
                                        })
                                        return Object.entries(grouped).map(([month, items]) => (
                                            <React.Fragment key={month}>
                                                <tr className="bg-slate-50/30">
                                                    <td colSpan={5} className="px-8 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{month}</td>
                                                </tr>
                                                {items.map((item, idx) => renderRow(item, idx))}
                                            </React.Fragment>
                                        ))
                                    })()
                                ) : (
                                    paginatedData.map((item, idx) => renderRow(item, idx))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">
                                Showing <span className="text-slate-800 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800 font-bold">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="text-slate-800 font-bold">{sortedData.length}</span> results
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="flex gap-1 items-center">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded text-[10px] font-black flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200 text-slate-500'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedItem && (
                <SubmissionDetailModal
                    attendance={selectedItem.attendance}
                    offering={selectedItem.offering}
                    serviceTypeName={selectedItem.typeName}
                    locationName={selectedItem.locationName}
                    level={selectedItem.level}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    )
}
