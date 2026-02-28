"use client"

import { AttendanceSubmission, OfferingSubmission, ServiceType, Center } from "@/types/database"
import { X, Users, PhilippinePeso as Naira, MapPin, Building2, Calendar, ClipboardCheck, Globe } from "lucide-react"

interface SubmissionDetailModalProps {
    attendance?: AttendanceSubmission | null
    offering?: OfferingSubmission | null
    serviceTypeName: string
    locationName: string
    level: string
    onClose: () => void
}

export default function SubmissionDetailModal({
    attendance,
    offering,
    serviceTypeName,
    locationName,
    level,
    onClose
}: SubmissionDetailModalProps) {
    if (!attendance && !offering) return null

    const levelColors: Record<string, string> = {
        center: "bg-brand-blue",
        cluster: "bg-blue-600",
        general: "bg-orange-600"
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`${levelColors[level] || 'bg-brand-blue'} p-6 text-white flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg text-white">
                            {level === 'center' ? <Building2 className="w-6 h-6" /> : level === 'cluster' ? <MapPin className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{level === 'center' ? 'Center' : level === 'cluster' ? 'Cluster' : 'General'} Submission</h2>
                            <p className="text-blue-50 text-sm">{serviceTypeName} - {new Date(attendance?.service_date || offering?.service_date || "").toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Location Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-brand-blue" />
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Location</p>
                                <p className="font-semibold text-gray-900">{locationName}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-brand-orange" />
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Service Date</p>
                                <p className="font-semibold text-gray-900">{new Date(attendance?.service_date || offering?.service_date || "").toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Details */}
                    {attendance && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-900">Demographic Breakdown</h3>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: "Adult Bros", val: attendance.adult_brothers, color: "blue" },
                                    { label: "Adult Sisters", val: attendance.adult_sisters, color: "blue" },
                                    { label: "Youth Bros", val: attendance.youth_brothers, color: "purple" },
                                    { label: "Youth Sisters", val: attendance.youth_sisters, color: "purple" },
                                    { label: "Child Bros", val: attendance.children_brothers, color: "green" },
                                    { label: "Child Sisters", val: attendance.children_sisters, color: "green" },
                                    { label: "Visitors (M)", val: attendance.visitors_brothers, color: "orange" },
                                    { label: "Visitors (F)", val: attendance.visitors_sisters, color: "orange" },
                                ].map((item, i) => (
                                    <div key={i} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{item.label}</p>
                                        <p className="text-xl font-black text-gray-900">{item.val.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-brand-blue text-white rounded-xl shadow-lg flex justify-between items-center">
                                <span className="font-bold text-lg">Grand Total Attendance</span>
                                <span className="text-3xl font-black text-brand-orange">{attendance.grand_total.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Offering Details */}
                    {offering && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Naira className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold text-gray-900">Financial Summary</h3>
                            </div>
                            <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Total Offering (100%)</p>
                                        <p className="text-4xl font-black text-green-800">₦{Number(offering.amount_100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-green-100">
                                        <p className="text-[10px] text-green-600 font-bold uppercase mb-1">80% Remittance</p>
                                        <p className="text-xl font-bold text-green-700">₦{(Number(offering.amount_100) * 0.8).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] text-brand-blue font-bold uppercase mb-1">20% Local Fund</p>
                                        <p className="text-xl font-bold text-brand-blue">₦{(Number(offering.amount_100) * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-md active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    )
}
