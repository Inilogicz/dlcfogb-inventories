"use client"

import { useState } from "react"
import { Plus, ClipboardList, PhilippinePeso as Naira } from "lucide-react"
import UnifiedSubmissionForm from "./UnifiedSubmissionForm"
import UnifiedSubmissionList from "./UnifiedSubmissionList"
import { Modal } from "@/components/ui/Modal"
import SummaryPDFExport from "./SummaryPDFExport"

interface AttendanceManagerProps {
    profile: {
        role: string
        region_id: string | null
        center_id: string | null
        cluster_id: string | null
    }
    type: 'attendance' | 'offering'
}

export default function AttendanceManager({ profile, type }: AttendanceManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const canSubmit = profile.role === 'center_rep' || profile.role === 'cluster_admin' || profile.role === 'region_admin'

    const handleSuccess = () => {
        setIsModalOpen(false)
        setRefreshKey(prev => prev + 1)
    }

    const title = type === 'attendance' ? 'Attendance & Offerings' : 'Offering Collation'
    const subtitle = type === 'attendance'
        ? 'Submit and track unified service records.'
        : 'Record and review offering remittances.'
    const Icon = type === 'attendance' ? ClipboardList : Naira
    const iconLabel = type === 'attendance' ? 'Records Management' : 'Financial Records'
    const iconColor = type === 'attendance' ? 'text-slate-600 bg-slate-100' : 'text-amber-600 bg-amber-50'

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className={`p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] ${iconColor.split(' ')[1]} ring-4 md:ring-8 ring-white shadow-sm flex-shrink-0`}>
                        <Icon className={`w-8 h-8 md:w-10 md:h-10 ${iconColor.split(' ')[0]}`} />
                    </div>
                    <div>
                        <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1`}>{iconLabel}</p>
                        <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">{title}</h1>
                        <p className="text-xs md:text-sm text-slate-400 font-medium">{subtitle}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {['super_admin', 'region_admin', 'cluster_admin'].includes(profile.role) && (
                        <SummaryPDFExport
                            role={profile.role}
                            regionId={profile.region_id}
                            clusterId={profile.cluster_id}
                        />
                    )}

                    {canSubmit && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto relative overflow-hidden group bg-white text-slate-800 px-6 md:px-8 py-3.5 md:py-4.5 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-[10px] md:text-[11px] tracking-[0.2em] md:tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 md:gap-4 border border-slate-200"
                        >
                            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-1.5 md:p-2 bg-amber-100 text-amber-600 rounded-lg md:rounded-xl group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out relative z-10">
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            <span className="relative z-10">NEW SUBMISSION</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Submission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="New Service Submission"
                maxWidth="5xl"
            >
                <div className="p-1 md:p-2">
                    <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 font-medium">Capture attendance and offering data for the current service session.</p>
                    <UnifiedSubmissionForm
                        centerId={profile.center_id}
                        clusterId={profile.cluster_id}
                        regionId={profile.region_id}
                        role={profile.role}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>

            {/* History Section */}
            <div>
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Submission History</h2>
                    <div className="h-px bg-slate-100 w-full" />
                </div>
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm p-3 md:p-4">
                    <UnifiedSubmissionList
                        key={refreshKey}
                        role={profile.role}
                        centerId={profile.center_id}
                    />
                </div>
            </div>
        </div>
    )
}
