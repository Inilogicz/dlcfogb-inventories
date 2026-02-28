"use client"

import { Download } from "lucide-react"
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function ExportButtons({ data, filename, title }: { data: any[], filename: string, title: string }) {

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
        XLSX.writeFile(workbook, `${filename}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()
        doc.text(title, 14, 15)

        const headers = Object.keys(data[0] || {})
        const rows = data.map(item => Object.values(item))

        // @ts-ignore
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 20,
        })

        doc.save(`${filename}.pdf`)
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
                <Download className="w-4 h-4" />
                Excel
            </button>
            <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
            >
                <Download className="w-4 h-4" />
                PDF
            </button>
        </div>
    )
}
