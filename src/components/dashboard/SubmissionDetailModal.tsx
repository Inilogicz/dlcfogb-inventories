"use client"

import { AttendanceSubmission, OfferingSubmission } from "@/types/database"
import { X, Users, PhilippinePeso as Naira, MapPin, Building2, Calendar, Globe, ArrowUpRight } from "lucide-react"

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

    const totalAttendance = attendance ? (
        (attendance.grand_total > 0 ? attendance.grand_total :
            (attendance.adult_brothers + attendance.adult_sisters +
                attendance.youth_brothers + attendance.youth_sisters +
                attendance.children_brothers + attendance.children_sisters +
                attendance.visitors_brothers + attendance.visitors_sisters))
    ) : 0

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[calc(100vh-2rem)]">
                {/* Header Section */}
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <span className="px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                                {level} RECORD
                            </span>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {new Date(attendance?.service_date || offering?.service_date || "").toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">{serviceTypeName}</h2>
                        <div className="flex items-center gap-2 mt-2 text-slate-500 font-semibold text-xs md:text-sm">
                            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                            <span>{locationName}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 md:p-4 hover:bg-slate-50 rounded-xl md:rounded-[1.5rem] transition-all active:scale-90 border border-transparent hover:border-slate-100 shrink-0"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />
                    </button>
                </div>

                <div className="p-6 md:p-10 pt-4 space-y-8 md:space-y-10 overflow-y-auto flex-1 no-scrollbar">
                    {/* Attendance Highlights */}
                    {attendance && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-slate-800 flex flex-col justify-between aspect-square relative overflow-hidden group shadow-xl shadow-slate-200/50 border border-slate-100">
                                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                                    <div className="p-3 md:p-4 bg-amber-50 w-fit rounded-xl md:rounded-2xl border border-amber-100 relative z-10">
                                        <Users className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 md:mb-2">Total Souls</p>
                                        <p className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">{totalAttendance.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="grid grid-rows-2 gap-3 md:gap-4">
                                    <div className="bg-slate-50/50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 flex flex-col justify-center transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Adults</p>
                                        <p className="text-2xl md:text-3xl font-black text-slate-800">{(attendance.adult_brothers + attendance.adult_sisters).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 flex flex-col justify-center transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Youths</p>
                                        <p className="text-2xl md:text-3xl font-black text-slate-800">{(attendance.youth_brothers + attendance.youth_sisters).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-5 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100">
                                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Children</p>
                                    <p className="text-xl md:text-2xl font-black text-slate-800">{(attendance.children_brothers + attendance.children_sisters).toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50/30 p-5 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-amber-100/50">
                                    <p className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 md:mb-2">Visitors</p>
                                    <p className="text-xl md:text-2xl font-black text-slate-800">{(attendance.visitors_brothers + attendance.visitors_sisters).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Offering Summary */}
                    {offering && (
                        <div className="pt-10 border-t border-slate-100">
                            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all" />
                                <div className="p-5 bg-amber-500 text-white rounded-[1.5rem] mb-6 shadow-xl shadow-amber-200">
                                    <Naira className="w-8 h-8" />
                                </div>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-2 md:mb-3">Offering Collation</p>
                                <p className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">₦{Number(offering.amount_100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>

                                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mt-8 md:mt-10">
                                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
                                        <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 md:mb-2">80% Remittance</p>
                                        <p className="text-md md:text-lg font-black text-slate-800">₦{(Number(offering.amount_100) * 0.8).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
                                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">20% Local Fund</p>
                                        <p className="text-md md:text-lg font-black text-slate-800">₦{(Number(offering.amount_100) * 0.2).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="p-4 md:p-10 pt-0 mt-2 md:mt-6 flex justify-center shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-100 text-slate-800 font-black py-4 md:py-5 rounded-xl md:rounded-[1.5rem] hover:bg-slate-200 transition-all shadow-md active:scale-[0.98] tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] border border-slate-200"
                    >
                        DISMISS DETAILS
                    </button>
                </div>
            </div>
        </div>
    )
}
