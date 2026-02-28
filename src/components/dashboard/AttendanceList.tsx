"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AttendanceSubmission, ServiceType, Center } from "@/types/database"
import { Loader2, Users, Calendar, Building2 } from "lucide-react"

export default function AttendanceList({ role, centerId }: { role: string, centerId?: string | null }) {
    const [submissions, setSubmissions] = useState<AttendanceSubmission[]>([])
    const [serviceTypes, setServiceTypes] = useState<Record<string, string>>({})
    const [centers, setCenters] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // Fetch service types and centers mapping
            const [{ data: sTypes }, { data: cData }] = await Promise.all([
                supabase.from('service_types').select('id, name'),
                supabase.from('centers').select('id, name')
            ])

            if (sTypes) {
                const sMap = sTypes.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {})
                setServiceTypes(sMap)
            }
            if (cData) {
                const cMap = cData.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {})
                setCenters(cMap)
            }

            // Fetch submissions
            let query = supabase
                .from('attendance_submissions')
                .select('*')
                .order('service_date', { ascending: false })
                .order('created_at', { ascending: false })

            if (centerId && role === 'center_rep') {
                query = query.eq('center_id', centerId)
            }

            const { data, error } = await query

            if (data) setSubmissions(data)
            if (error) console.error("Error fetching attendance:", error)
            setLoading(false)
        }
        fetchData()
    }, [centerId, role])

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        )
    }

    if (submissions.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl border border-gray-100 text-center space-y-3">
                <Users className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">No attendance records found</h3>
                <p className="text-gray-500">Submissions will appear here once they are recorded.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-600">
                            <th className="px-4 py-3 text-sm">Date</th>
                            <th className="px-4 py-3 text-sm">Center</th>
                            <th className="px-4 py-3 text-sm">Service Type</th>
                            <th className="px-4 py-3 text-sm text-center">Adults</th>
                            <th className="px-4 py-3 text-sm text-center">Youth</th>
                            <th className="px-4 py-3 text-sm text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {submissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm font-medium">{new Date(sub.service_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm">{sub.center_id ? (centers[sub.center_id] || "Unknown") : "N/A"}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm">{serviceTypes[sub.service_type_id] || "Unknown"}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {(sub.adult_brothers + sub.adult_sisters).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {(sub.youth_brothers + sub.youth_sisters).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-brand-blue">
                                        {sub.grand_total ? sub.grand_total.toLocaleString() : (
                                            sub.adult_brothers + sub.adult_sisters +
                                            sub.youth_brothers + sub.youth_sisters +
                                            sub.children_brothers + sub.children_sisters +
                                            sub.visitors_brothers + sub.visitors_sisters
                                        ).toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
