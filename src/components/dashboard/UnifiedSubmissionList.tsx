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
            setLoading(true)

            // 1. Fetch Mapping Metadata
            const [{ data: sTypes }, { data: cData }, { data: clData }] = await Promise.all([
                supabase.from('service_types').select('id, name'),
                supabase.from('centers').select('id, name'),
                supabase.from('clusters').select('id, name')
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
            } else if (role === 'cluster_admin') {
                const { data: { user } } = await supabase.auth.getUser()
                const { data: profile } = await supabase.from('profiles').select('cluster_id').eq('id', user?.id).single()
                if (profile?.cluster_id) {
                    const { data: clusterCenters } = await supabase.from('centers').select('id').eq('cluster_id', profile.cluster_id)
                    const centerIds = clusterCenters?.map(c => c.id) || []
                    attQuery = attQuery.or(`cluster_id.eq.${profile.cluster_id},center_id.in.(${centerIds.join(',')})`)
                    offQuery = offQuery.or(`cluster_id.eq.${profile.cluster_id},center_id.in.(${centerIds.join(',')})`)
                }
            } else if (role === 'region_admin') {
                const { data: { user } } = await supabase.auth.getUser()
                const { data: profile } = await supabase.from('profiles').select('region_id').eq('id', user?.id).single()
                if (profile?.region_id) {
                    const { data: regionClusters } = await supabase.from('clusters').select('id').eq('region_id', profile.region_id)
                    const clusterIds = regionClusters?.map(cl => cl.id) || []
                    const { data: regionCenters } = await supabase.from('centers').select('id').in('cluster_id', clusterIds)
                    const centerIds = regionCenters?.map(c => c.id) || []

                    // Filter by identifying if the submission belongs to the region via cluster or center
                    if (clusterIds.length > 0 || centerIds.length > 0) {
                        const clusterFilter = clusterIds.length > 0 ? `cluster_id.in.(${clusterIds.join(',')})` : ''
                        const centerFilter = centerIds.length > 0 ? `center_id.in.(${centerIds.join(',')})` : ''
                        const combinedFilter = [clusterFilter, centerFilter].filter(Boolean).join(',')

                        attQuery = attQuery.or(combinedFilter)
                        offQuery = offQuery.or(combinedFilter)
                    }
                }
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
        }

        return (
            <tr key={idx} className="group hover:bg-brand-blue/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedItem({ attendance, offering, typeName, locationName, level })}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{typeName}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{locationName}</span>
                        <span className={`text-[10px] font-bold uppercase ${level === 'center' ? 'text-brand-blue' : level === 'cluster' ? 'text-blue-600' : 'text-orange-600'}`}>
                            {level === 'center' ? 'Center' : level === 'cluster' ? 'Cluster Combined' : 'General Combined'}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center bg-blue-50 text-brand-blue px-3 py-1 rounded-full font-black text-sm border border-blue-100">
                        {item.attendance?.grand_total || "—"}
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-green-700">
                        {item.offering ? `₦${Number(item.offering.amount_100).toLocaleString()}` : "—"}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-full transition-all group-hover:scale-110">
                        <Eye className="w-5 h-5" />
                    </button>
                </td>
            </tr>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
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
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                        <button
                            onClick={() => setGroupByMonth(false)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!groupByMonth ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            LIST
                        </button>
                        <button
                            onClick={() => setGroupByMonth(true)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${groupByMonth ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            MONTHS
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="text-xs font-bold px-3 py-2 border rounded-lg bg-white outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="date">Date</option>
                            <option value="attendance">Attendance</option>
                            <option value="offering">Offering</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            <ArrowUpDown className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {sortedData.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">No records found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-brand-blue/5 border-b border-gray-100 font-bold text-gray-700">
                                    <th className="px-6 py-4 text-xs uppercase tracking-wider font-black">Service Detail</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-wider font-black">Location</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-center font-black">Attendance</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-right font-black">Offering (100%)</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-right font-black">Actions</th>
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
                                                <tr className="bg-gray-50/80">
                                                    <td colSpan={5} className="px-6 py-2 text-[10px] font-black text-brand-blue uppercase tracking-widest">{month}</td>
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
                                Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="text-gray-900 font-bold">{sortedData.length}</span> results
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex gap-1 items-center">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-gray-200 text-gray-600'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
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
