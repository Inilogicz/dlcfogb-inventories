import React, { useState } from 'react'
import { Download, Loader2, FileText, LayoutGrid, Building2, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Modal } from "@/components/ui/Modal"

interface SummaryPDFExportProps {
    role: string
    regionId?: string | null
    clusterId?: string | null
    selectedMonth?: number // 1-12
    selectedYear?: number
}

type ExportLevel = 'center' | 'cluster' | 'region'

export default function SummaryPDFExport({
    role,
    regionId,
    clusterId,
    selectedMonth = new Date().getMonth() + 1,
    selectedYear = new Date().getFullYear()
}: SummaryPDFExportProps) {
    const [exporting, setExporting] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const supabase = createClient()

    const generatePDF = async (exportLevel: ExportLevel) => {
        setExporting(true)
        setIsModalOpen(false)
        try {
            const [{ jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ])

            // 1. Fetch Metadata
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
                if (key.includes('WORKER')) serviceMap[st.id] = 'WORKERS'
            })

            // 2. Fetch Detailed Data
            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

            let query = supabase.from('attendance_submissions').select(`
                *,
                centers (id, name, clusters(id, name, regions(id, name))),
                clusters (id, name, regions(id, name))
            `).gte('service_date', startDate).lte('service_date', endDate)

            if (role === 'cluster_admin' && clusterId) {
                query = query.eq('cluster_id', clusterId)
            } else if (role === 'region_admin' && regionId) {
                query = query.eq('region_id', regionId)
            }

            const { data: submissions } = await query

            // 3. Multi-level Aggregation
            const getEmptyMetrics = () => ({ mb: 0, ms: 0, yb: 0, ys: 0, cb: 0, cs: 0, total: 0 })
            const getEmptyRow = (name: string) => ({
                name,
                SUNDAY: getEmptyMetrics(),
                MONDAY: getEmptyMetrics(),
                THURSDAY: getEmptyMetrics(),
                KOINONIA: getEmptyMetrics(),
                WORKERS: getEmptyMetrics()
            })

            const aggregated: Record<string, any> = {}

            submissions?.forEach(sub => {
                const level = sub.submission_level;
                const centerObj = sub.centers;
                const clusterObj = sub.clusters || (centerObj as any)?.clusters;
                const regionObj = clusterObj?.regions || sub.clusters?.regions;

                let clusterName = clusterObj?.name || 'REGIONAL GENERAL';
                let centerName = centerObj?.name || (clusterObj?.name ? `${clusterObj.name} (COMBINED)` : 'COMBINED SERVICE');
                let clusterIdResolved = clusterObj?.id || 'regional';
                const typeKey = serviceMap[sub.service_type_id]

                if (!typeKey) return

                if (exportLevel === 'center') {
                    if (!aggregated[clusterIdResolved]) {
                        aggregated[clusterIdResolved] = { name: clusterName, centers: {} }
                    }
                    const cId = sub.center_id || (level === 'cluster' ? `cluster_${sub.cluster_id}` : 'regional_general')
                    if (!aggregated[clusterIdResolved].centers[cId]) {
                        aggregated[clusterIdResolved].centers[cId] = getEmptyRow(centerName)
                    }
                    updateMetrics(aggregated[clusterIdResolved].centers[cId][typeKey], sub)
                } else if (exportLevel === 'cluster') {
                    if (!aggregated[clusterIdResolved]) aggregated[clusterIdResolved] = getEmptyRow(clusterName)
                    updateMetrics(aggregated[clusterIdResolved][typeKey], sub)
                } else if (exportLevel === 'region') {
                    const rName = regionObj?.name || (role === 'region_admin' ? scopeName : 'Unknown Region')
                    const rId = regionObj?.id || sub.region_id || 'unknown'
                    if (!aggregated[rId]) aggregated[rId] = getEmptyRow(rName)
                    updateMetrics(aggregated[rId][typeKey], sub)
                }
            })

            function updateMetrics(metrics: any, sub: any) {
                metrics.mb += sub.adult_brothers || 0
                metrics.ms += sub.adult_sisters || 0
                metrics.yb += sub.youth_brothers || 0
                metrics.ys += sub.youth_sisters || 0
                metrics.cb += sub.children_brothers || 0
                metrics.cs += sub.children_sisters || 0
                metrics.total += ((sub.adult_brothers || 0) + (sub.adult_sisters || 0) + (sub.youth_brothers || 0) + (sub.youth_sisters || 0) + (sub.children_brothers || 0) + (sub.children_sisters || 0))
            }

            // 4. Build Table Rows with Headers and Totals
            const tableRows: any[] = []
            const grandTotalMetrics = getEmptyRow('GRAND TOTAL')

            if (exportLevel === 'center') {
                Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name)).forEach(cluster => {
                    // Cluster Header Row
                    tableRows.push([{ content: cluster.name.toUpperCase(), colSpan: 36, styles: { fillColor: [240, 245, 255], fontStyle: 'bold' } }])

                    const clusterSubtotal = getEmptyRow(`SUBTOTAL: ${cluster.name}`)

                    Object.values(cluster.centers).sort((a: any, b: any) => a.name.localeCompare(b.name)).forEach((center: any) => {
                        tableRows.push(formatMetricsRow(center))
                        accumulateTotals(clusterSubtotal, center)
                    })

                    // Cluster Subtotal Row
                    const subtotalRow = formatMetricsRow(clusterSubtotal);
                    subtotalRow[0] = { content: subtotalRow[0], styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
                    tableRows.push(subtotalRow)
                    accumulateTotals(grandTotalMetrics, clusterSubtotal)
                })
            } else {
                Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name)).forEach(loc => {
                    tableRows.push(formatMetricsRow(loc))
                    accumulateTotals(grandTotalMetrics, loc)
                })
            }

            // Add Grand Total
            const finalRow = formatMetricsRow(grandTotalMetrics)
            finalRow[0] = { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
            tableRows.push(finalRow)

            function formatMetricsRow(loc: any) {
                return [
                    loc.name.toUpperCase(),
                    loc.SUNDAY.mb, loc.SUNDAY.ms, loc.SUNDAY.yb, loc.SUNDAY.ys, loc.SUNDAY.cb, loc.SUNDAY.cs, loc.SUNDAY.total,
                    loc.MONDAY.mb, loc.MONDAY.ms, loc.MONDAY.yb, loc.MONDAY.ys, loc.MONDAY.cb, loc.MONDAY.cs, loc.MONDAY.total,
                    loc.THURSDAY.mb, loc.THURSDAY.ms, loc.THURSDAY.yb, loc.THURSDAY.ys, loc.THURSDAY.cb, loc.THURSDAY.cs, loc.THURSDAY.total,
                    loc.KOINONIA.mb, loc.KOINONIA.ms, loc.KOINONIA.yb, loc.KOINONIA.ys, loc.KOINONIA.cb, loc.KOINONIA.cs, loc.KOINONIA.total,
                    loc.WORKERS.mb, loc.WORKERS.ms, loc.WORKERS.yb, loc.WORKERS.ys, loc.WORKERS.cb, loc.WORKERS.cs, loc.WORKERS.total
                ]
            }

            function accumulateTotals(target: any, source: any) {
                ['SUNDAY', 'MONDAY', 'THURSDAY', 'KOINONIA', 'WORKERS'].forEach(type => {
                    ['mb', 'ms', 'yb', 'ys', 'cb', 'cs', 'total'].forEach(field => {
                        target[type][field] += source[type][field]
                    })
                })
            }

            // 5. Generate PDF
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
            doc.setFontSize(14).setFont("helvetica", "bold").text(`DEEPER LIFE BIBLE CHURCH ${regionNameHeader.toUpperCase()}.`, 148, 15, { align: "center" })
            doc.setFontSize(12).text("SUMMARY OF REGIONAL WEEKLY REPORTS.", 148, 22, { align: "center" })
            doc.setFontSize(10)
            const levelLabel = exportLevel === 'center' ? 'CENTER DETAIL' : exportLevel === 'cluster' ? 'DISTRICT SUMMARY' : 'REGION SUMMARY'
            doc.text(`${levelLabel} REPORT | ${scopeName.toUpperCase()}`, 148, 28, { align: "center" })
            doc.text(`MONTH: ${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' }).toUpperCase()}`, 14, 34)
            doc.text(`YEAR: ${selectedYear}`, 280, 34, { align: "right" })

            autoTable(doc, {
                startY: 35,
                head: [
                    [
                        { content: exportLevel === 'center' ? 'FELLOWSHIP CENTER' : exportLevel === 'cluster' ? 'DISTRICT / CLUSTER' : 'REGION', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'SUNDAY SERVICE', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'MONDAY BIBLE STUDY', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'THURSDAY REVIVAL', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'KOINONIA', colSpan: 7, styles: { halign: 'center' } },
                        { content: 'WORKERS MEETING', colSpan: 7, styles: { halign: 'center' } }
                    ],
                    [
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } }, { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } }, { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } }, { content: 'TOTAL', styles: { halign: 'center' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } }, { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } }, { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } }, { content: 'TOTAL', styles: { halign: 'center' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } }, { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } }, { content: 'CHILDERN', colSpan: 2, styles: { halign: 'center' } }, { content: 'TOTAL', styles: { halign: 'center' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } }, { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } }, { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } }, { content: 'TOTAL', styles: { halign: 'center' } },
                        { content: 'ADULT', colSpan: 2, styles: { halign: 'center' } }, { content: 'YOUTH', colSpan: 2, styles: { halign: 'center' } }, { content: 'CHILDREN', colSpan: 2, styles: { halign: 'center' } }, { content: 'TOTAL', styles: { halign: 'center' } }
                    ],
                    [
                        'M', 'F', 'M', 'F', 'M', 'F', '', 'M', 'F', 'M', 'F', 'M', 'F', 'Σ',
                        'M', 'F', 'M', 'F', 'M', 'F', '', 'M', 'F', 'M', 'F', 'M', 'F', 'Σ',
                        'M', 'F', 'M', 'F', 'M', 'F', ''
                    ]
                ],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 5.5, cellPadding: 0.8, lineWidth: 0.1, textColor: [0, 0, 0] },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 } },
                didParseCell: (data) => {
                    const cellContent = data.cell.raw as any;
                    if (cellContent?.styles?.fillColor) {
                        data.cell.styles.fillColor = cellContent.styles.fillColor;
                        data.cell.styles.fontStyle = cellContent.styles.fontStyle;
                    }
                }
            })

            doc.save(`${levelLabel}_REPORT_${selectedMonth}_${selectedYear}.pdf`)
        } catch (error) {
            console.error("Export failed:", error)
        } finally {
            setExporting(false)
        }
    }

    if (!['super_admin', 'region_admin', 'cluster_admin'].includes(role)) return null

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl hover:bg-amber-50 hover:text-amber-700 hover:border-amber-100 transition-all font-black text-[10px] tracking-widest shadow-xl shadow-slate-200/50 disabled:opacity-50"
            >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                SUMMARY PDF
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Select Summary Detail Level"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-6 font-medium">Choose how you want to organize your summary report.</p>

                    <button
                        onClick={() => generatePDF('center')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-brand-blue hover:bg-blue-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Per Center (Detailed)</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Rows for each center + subtotals</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => generatePDF('cluster')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-brand-blue hover:bg-blue-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Per Cluster / District</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Summary totals for each cluster</p>
                            </div>
                        </div>
                    </button>

                    {role === 'super_admin' && (
                        <button
                            onClick={() => generatePDF('region')}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-brand-blue hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">Per Region</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Summary totals for each region</p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </Modal>
        </>
    )
}
