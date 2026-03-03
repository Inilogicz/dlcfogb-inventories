"use client"

import React, { useState } from 'react'
import { Download, Loader2, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SummaryPDFExportProps {
    role: string
    regionId?: string | null
    clusterId?: string | null
    selectedMonth?: number // 1-12
    selectedYear?: number
}

export default function SummaryPDFExport({
    role,
    regionId,
    clusterId,
    selectedMonth = new Date().getMonth() + 1,
    selectedYear = new Date().getFullYear()
}: SummaryPDFExportProps) {
    const [exporting, setExporting] = useState(false)
    const supabase = createClient()

    const generatePDF = async () => {
        setExporting(true)
        try {
            // Dynamic imports for PDF libraries to avoid SSR issues
            const [{ jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ])

            // 1. Fetch Service Types and Scope Name
            const [{ data: sTypes }, { data: scopeInfo }] = await Promise.all([
                supabase.from('service_types').select('id, name'),
                role === 'cluster_admin' ?
                    supabase.from('clusters').select('name, regions(name)').eq('id', clusterId || '').single() :
                    role === 'region_admin' ?
                        supabase.from('regions').select('name').eq('id', regionId || '').single() :
                        Promise.resolve({ data: { name: 'SOUTH STATE' } })
            ])

            const scopeName = scopeInfo?.name || 'OYO SOUTH'
            const regionNameHeader = (scopeInfo as any)?.regions?.name || (role === 'region_admin' ? scopeName : 'OYO SOUTH STATE')

            const serviceMap: Record<string, string> = {}
            sTypes?.forEach(st => {
                let key = st.name.toUpperCase()
                if (key.includes('SUNDAY')) serviceMap[st.id] = 'SUNDAY'
                if (key.includes('MONDAY')) serviceMap[st.id] = 'MONDAY'
                if (key.includes('THURSDAY')) serviceMap[st.id] = 'THURSDAY'
                if (key.includes('KOINONIA')) serviceMap[st.id] = 'KOINONIA'
            })

            // 2. Fetch Data based on scope with deeper joins
            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

            let query = supabase.from('attendance_submissions').select(`
                *,
                centers (
                    name,
                    clusters (
                        id,
                        name
                    )
                ),
                clusters (
                    id,
                    name
                )
            `).gte('service_date', startDate).lte('service_date', endDate)

            if (role === 'cluster_admin' && clusterId) {
                query = query.eq('cluster_id', clusterId)
            } else if (role === 'region_admin' && regionId) {
                const { data: clData } = await supabase.from('clusters').select('id').eq('region_id', regionId)
                const clIds = clData?.map(c => c.id) || []
                query = query.in('cluster_id', clIds)
            }

            const { data: submissions } = await query

            // 3. Aggregate Data by Location and Service Type
            const aggregated: Record<string, any> = {}
            submissions?.forEach(sub => {
                // Determine Cluster and Center names
                const centerName = sub.centers?.name;
                const clusterName = sub.clusters?.name || (sub.centers as any)?.clusters?.name;
                const clusterIdResolved = sub.cluster_id || (sub.centers as any)?.clusters?.id;

                let locationId = 'unassigned';
                let locationName = 'Unknown';

                if (role === 'cluster_admin') {
                    // Show Fellowship Centers
                    locationId = sub.center_id || 'unassigned';
                    locationName = centerName || 'Unknown Center';
                } else {
                    // Show Districts (Clusters)
                    locationId = clusterIdResolved || 'unassigned';
                    locationName = clusterName || 'Unknown District';
                }

                const typeKey = serviceMap[sub.service_type_id]

                if (!typeKey) return // Skip other services if not in template

                if (!aggregated[locationId]) {
                    aggregated[locationId] = {
                        name: locationName,
                        SUNDAY: { mb: 0, ms: 0, yb: 0, ys: 0, cb: 0, cs: 0, total: 0 },
                        MONDAY: { mb: 0, ms: 0, yb: 0, ys: 0, cb: 0, cs: 0, total: 0 },
                        THURSDAY: { mb: 0, ms: 0, yb: 0, ys: 0, cb: 0, cs: 0, total: 0 },
                        KOINONIA: { mb: 0, ms: 0, yb: 0, ys: 0, cb: 0, cs: 0, total: 0 }
                    }
                }

                const data = aggregated[locationId][typeKey]
                data.mb += sub.adult_brothers
                data.ms += sub.adult_sisters
                data.yb += sub.youth_brothers
                data.ys += sub.youth_sisters
                data.cb += sub.children_brothers
                data.cs += sub.children_sisters
                data.total += (sub.adult_brothers + sub.adult_sisters + sub.youth_brothers + sub.youth_sisters + sub.children_brothers + sub.children_sisters)
            })

            // 4. PDF Generation
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

            // Header Content
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text(`DEEPER LIFE BIBLE CHURCH ${regionNameHeader.toUpperCase()}.`, 148, 15, { align: "center" })
            doc.setFontSize(12)
            doc.text("SUMMARY OF REGIONAL WEEKLY REPORTS.", 148, 22, { align: "center" })

            doc.setFontSize(10)
            if (role === 'cluster_admin') {
                doc.text(`CLUSTER: ${scopeName.toUpperCase()}`, 148, 28, { align: "center" })
            } else if (role === 'region_admin') {
                doc.text(`REGION: ${scopeName.toUpperCase()}`, 148, 28, { align: "center" })
            }

            doc.text(`MONTH: ${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' }).toUpperCase()}`, 14, 34)
            doc.text(`YEAR: ${selectedYear}`, 280, 34, { align: "right" })

            // AutoTable Construction
            const rows = Object.values(aggregated).map((loc: any) => [
                loc.name.toUpperCase(),
                loc.SUNDAY.mb, loc.SUNDAY.ms, loc.SUNDAY.yb, loc.SUNDAY.ys, loc.SUNDAY.cb, loc.SUNDAY.cs, loc.SUNDAY.total,
                loc.MONDAY.mb, loc.MONDAY.ms, loc.MONDAY.yb, loc.MONDAY.ys, loc.MONDAY.cb, loc.MONDAY.cs, loc.MONDAY.total,
                loc.THURSDAY.mb, loc.THURSDAY.ms, loc.THURSDAY.yb, loc.THURSDAY.ys, loc.THURSDAY.cb, loc.THURSDAY.cs, loc.THURSDAY.total,
                loc.KOINONIA.mb, loc.KOINONIA.ms, loc.KOINONIA.yb, loc.KOINONIA.ys, loc.KOINONIA.cb, loc.KOINONIA.cs, loc.KOINONIA.total
            ])

            // Total Row
            const totals = [
                "TOTAL",
                ...Array(28).fill(0).map((_, i) => Object.values(aggregated).reduce((sum: number, loc: any) => {
                    const keys = ['SUNDAY', 'MONDAY', 'THURSDAY', 'KOINONIA']
                    const typeIndex = Math.floor(i / 7)
                    const dataIndex = i % 7
                    const type = keys[typeIndex]
                    const fields = ['mb', 'ms', 'yb', 'ys', 'cb', 'cs', 'total']
                    return sum + loc[type][fields[dataIndex]]
                }, 0))
            ]
            rows.push(totals)

            autoTable(doc, {
                startY: 35,
                head: [
                    [
                        { content: role === 'cluster_admin' ? 'FELLOWSHIP CENTER' : 'DISTRICT/CLUSTER', rowSpan: 4, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'SUNDAY WORSHIP SERVICE', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'MONDAY BIBLE STUDY', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'THURSDAY REVIVAL HOUR', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'KOINONIA', colSpan: 7, styles: { halign: 'center' } }
                    ],
                    [
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'TOTAL', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'TOTAL', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'CHILDERN', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'TOTAL', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } },
                        { content: 'TOTAL', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } }
                    ],
                    [
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } },
                        { content: 'M', styles: { halign: 'center' } }, { content: 'F', styles: { halign: 'center' } }
                    ]
                ],
                body: rows as any,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 35 }
                },
                didParseCell: (data: any) => {
                    if (data.row.index === rows.length - 1) {
                        data.cell.styles.fontStyle = 'bold'
                        data.cell.styles.fillColor = [245, 245, 245]
                    }
                }
            })

            doc.save(`Weekly_Summary_${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' })}_${selectedYear}.pdf`)
        } catch (error) {
            console.error("Export failed:", error)
        } finally {
            setExporting(false)
        }
    }

    if (!['super_admin', 'region_admin', 'cluster_admin'].includes(role)) return null

    return (
        <button
            onClick={generatePDF}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl hover:bg-amber-50 hover:text-amber-700 hover:border-amber-100 transition-all font-black text-[10px] tracking-widest shadow-xl shadow-slate-200/50 disabled:opacity-50"
        >
            {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileText className="w-4 h-4" />
            )}
            SUMMARY PDF
        </button>
    )
}
