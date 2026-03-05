"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ServiceType, Center, Cluster } from "@/types/database"
import { Loader2, Plus, Users, PhilippinePeso as Naira, Calendar, Building2, Globe, MapPin, ChevronRight, CheckCircle2 } from "lucide-react"

interface UnifiedSubmissionFormProps {
    centerId?: string | null
    clusterId?: string | null
    role: string
    onSuccess?: () => void
    onCancel?: () => void
}

export default function UnifiedSubmissionForm({
    centerId,
    clusterId,
    role,
    onSuccess,
    onCancel
}: UnifiedSubmissionFormProps) {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
    const [centers, setCenters] = useState<Center[]>([])
    const [clusters, setClusters] = useState<Cluster[]>([])

    // Scoping State
    const [scope, setScope] = useState<'center' | 'cluster' | 'general'>('center')
    const [selectedCenter, setSelectedCenter] = useState(centerId || "")
    const [selectedCluster, setSelectedCluster] = useState(clusterId || "")
    const [selectedType, setSelectedType] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Attendance State
    const [adultBrothers, setAdultBrothers] = useState(0)
    const [adultSisters, setAdultSisters] = useState(0)
    const [youthBrothers, setYouthBrothers] = useState(0)
    const [youthSisters, setYouthSisters] = useState(0)
    const [childrenBrothers, setChildrenBrothers] = useState(0)
    const [childrenSisters, setChildrenSisters] = useState(0)
    const [visitorsBrothers, setVisitorsBrothers] = useState(0)
    const [visitorsSisters, setVisitorsSisters] = useState(0)

    // Offering State
    const [amount, setAmount] = useState<number>(0)

    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setFetchingData(true)
            const promises: any[] = [
                supabase.from('service_types').select('*').order('name')
            ]

            if (role === 'super_admin') {
                promises.push(supabase.from('centers').select('*').order('name'))
                promises.push(supabase.from('clusters').select('*').order('name'))
            } else if (role === 'cluster_admin' && clusterId) {
                promises.push(supabase.from('centers').select('*').eq('cluster_id', clusterId).order('name'))
                promises.push(supabase.from('clusters').select('*').eq('id', clusterId).order('name'))
            } else if (role === 'center_rep') {
                promises.push(supabase.from('centers').select('*').eq('id', centerId).order('name'))
            }

            const results = await Promise.all(promises)
            if (results[0].data) setServiceTypes(results[0].data)
            if (results[1]?.data) setCenters(results[1].data)
            if (results[2]?.data) setClusters(results[2].data)

            setFetchingData(false)
        }
        fetchData()
    }, [role, clusterId, centerId])

    const grandTotal = adultBrothers + adultSisters + youthBrothers + youthSisters +
        childrenBrothers + childrenSisters + visitorsBrothers + visitorsSisters

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (scope === 'center' && !selectedCenter) {
            setMessage({ type: 'error', text: "Please select a center." })
            return
        }
        if (scope === 'cluster' && !selectedCluster) {
            setMessage({ type: 'error', text: "Please select a cluster." })
            return
        }

        setLoading(true)
        setMessage(null)

        const currentClusterId = scope === 'cluster'
            ? selectedCluster
            : (scope === 'center' && selectedCenter
                ? centers.find(c => c.id === selectedCenter)?.cluster_id
                : null);

        const payload_att = {
            submission_level: scope,
            center_id: scope === 'center' ? selectedCenter : null,
            cluster_id: currentClusterId || (scope === 'cluster' ? selectedCluster : null),
            service_type_id: selectedType,
            service_date: date,
            adult_brothers: adultBrothers,
            adult_sisters: adultSisters,
            youth_brothers: youthBrothers,
            youth_sisters: youthSisters,
            children_brothers: childrenBrothers,
            children_sisters: childrenSisters,
            visitors_brothers: visitorsBrothers,
            visitors_sisters: visitorsSisters
        }

        const { error: attError } = await supabase
            .from('attendance_submissions')
            .insert(payload_att)

        if (attError) {
            setMessage({ type: 'error', text: `Attendance Error: ${attError.message}` })
            setLoading(false)
            return
        }

        const { error: offError } = await supabase
            .from('offering_submissions')
            .insert({
                submission_level: scope,
                center_id: scope === 'center' ? selectedCenter : null,
                cluster_id: currentClusterId || (scope === 'cluster' ? selectedCluster : null),
                service_type_id: selectedType,
                service_date: date,
                amount_100: amount
            })

        if (offError) {
            setMessage({ type: 'error', text: `Offering Error: ${offError.message}` })
            setLoading(false)
            return
        }

        setMessage({ type: 'success', text: "Service data recorded successfully!" })
        setLoading(false)

        if (onSuccess) {
            setTimeout(onSuccess, 1500)
        }
    }

    const attendanceGroups = [
        {
            title: "Adults",
            fields: [
                { label: "Brothers", val: adultBrothers, set: setAdultBrothers },
                { label: "Sisters", val: adultSisters, set: setAdultSisters },
            ]
        },
        {
            title: "Youths",
            fields: [
                { label: "Brothers", val: youthBrothers, set: setYouthBrothers },
                { label: "Sisters", val: youthSisters, set: setYouthSisters },
            ]
        },
        {
            title: "Children",
            fields: [
                { label: "Brothers", val: childrenBrothers, set: setChildrenBrothers },
                { label: "Sisters", val: childrenSisters, set: setChildrenSisters },
            ]
        },
        {
            title: "Visitors",
            fields: [
                { label: "Brothers", val: visitorsBrothers, set: setVisitorsBrothers },
                { label: "Sisters", val: visitorsSisters, set: setVisitorsSisters },
            ]
        }
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Scope & Basic Info */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 p-1 md:p-1.5 bg-slate-100/50 rounded-2xl w-full sm:w-fit border border-slate-200/50 shadow-sm">
                    {role === 'super_admin' && (
                        <button
                            type="button"
                            onClick={() => setScope('general')}
                            className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${scope === 'general' ? 'bg-white text-slate-800 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            GENERAL
                        </button>
                    )}
                    {(role === 'super_admin' || role === 'cluster_admin') && (
                        <button
                            type="button"
                            onClick={() => {
                                setScope('cluster')
                                if (role === 'cluster_admin' && clusterId) setSelectedCluster(clusterId)
                            }}
                            className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${scope === 'cluster' ? 'bg-white text-slate-800 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            CLUSTER
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setScope('center')}
                        className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${scope === 'center' ? 'bg-white text-slate-800 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        CENTER
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-brand-blue" />
                            {scope.toUpperCase()} LOCATION
                        </label>
                        {scope === 'center' ? (
                            <select
                                required
                                disabled={role === 'center_rep' || fetchingData}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-950/5 transition-all outline-none appearance-none"
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                            >
                                <option value="">Select Center</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        ) : scope === 'cluster' ? (
                            <select
                                required
                                disabled={role === 'cluster_admin' || fetchingData}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-950/5 transition-all outline-none appearance-none"
                                value={selectedCluster}
                                onChange={(e) => setSelectedCluster(e.target.value)}
                            >
                                <option value="">Select Cluster</option>
                                {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        ) : (
                            <div className="h-12 px-4 bg-slate-50 rounded-2xl flex items-center gap-2 text-slate-800 text-[10px] font-black border border-slate-200">
                                <Globe className="w-4 h-4 text-slate-400" /> GENERAL COMBINED
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-amber-500" />
                            SERVICE TYPE
                        </label>
                        <div className="relative">
                            <select
                                required
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-950/5 transition-all outline-none appearance-none"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="">Select Service</option>
                                {serviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            SERVICE DATE
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Attendance Breakdown */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <h3 className="text-[11px] md:text-[12px] font-black text-slate-800 flex items-center gap-3 tracking-widest uppercase">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        Attendance Breakdown
                    </h3>
                    <div className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-amber-100">
                        Total Souls: {grandTotal}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {attendanceGroups.map((group, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-4 md:p-6 rounded-[2rem] border border-slate-200/50 space-y-5 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/card">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 group-hover/card:text-amber-600 transition-colors">{group.title}</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {group.fields.map((field, fIdx) => (
                                    <div key={fIdx} className="space-y-1.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase">{field.label}</label>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-[1rem] text-sm font-black text-slate-800 focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all"
                                            value={field.val}
                                            onChange={(e) => field.set(parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Offering & Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/50 space-y-8">
                    <h3 className="text-[10px] font-black text-slate-800 flex items-center gap-3 uppercase tracking-[0.3em]">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Naira className="w-4 h-4" />
                        </div>
                        Remittance Data
                    </h3>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Total Offering (100%)</label>
                        <div className="relative group/offering">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl md:text-2xl group-focus-within/offering:text-amber-500 transition-colors">₦</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full h-16 md:h-20 pl-14 pr-8 bg-white border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] text-2xl md:text-3xl font-black text-slate-800 focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 transition-all outline-none shadow-sm"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">80% Remit</p>
                            <p className="text-sm md:text-md font-black text-slate-800">₦{(amount * 0.8).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">20% Local</p>
                            <p className="text-sm md:text-md font-black text-slate-800">₦{(amount * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-xl shadow-slate-200/50 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] text-slate-800 space-y-6 relative overflow-hidden h-full min-h-[160px] md:min-h-[180px] flex flex-col justify-center border border-slate-200">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Grand Total Attendance</p>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">{grandTotal.toLocaleString()}</h2>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-amber-600 tracking-widest uppercase">Souls</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase">Recognized</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                    {message.text}
                </div>
            )}

            <div className="flex gap-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-shrink-0 px-6 md:px-8 py-4.5 rounded-[1.2rem] md:rounded-[1.5rem] text-[11px] font-black bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all outline-none uppercase tracking-widest"
                    >
                        CANCEL
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 font-black py-4.5 rounded-[1.5rem] transition-all shadow-xl shadow-amber-200/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-[11px] tracking-[0.3em] uppercase border border-amber-200"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Record"}
                </button>
            </div>
        </form>
    )
}
