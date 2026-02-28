"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ServiceType, Center, Cluster } from "@/types/database"
import { Loader2, Plus, Users, PhilippinePeso as Naira, Calendar, Building2, Globe, MapPin } from "lucide-react"

export default function UnifiedSubmissionForm({
    centerId,
    clusterId,
    role
}: {
    centerId?: string | null,
    clusterId?: string | null,
    role: string
}) {
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

        // Validation based on scope
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

        const payload_att = {
            submission_level: scope,
            center_id: scope === 'center' ? selectedCenter : null,
            cluster_id: scope === 'cluster' ? selectedCluster : null,
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

        // 1. Submit Attendance
        const { error: attError } = await supabase
            .from('attendance_submissions')
            .insert(payload_att)

        if (attError) {
            setMessage({ type: 'error', text: `Attendance Error: ${attError.message}` })
            setLoading(false)
            return
        }

        // 2. Submit Offering
        const { error: offError } = await supabase
            .from('offering_submissions')
            .insert({
                submission_level: scope,
                center_id: scope === 'center' ? selectedCenter : null,
                cluster_id: scope === 'cluster' ? selectedCluster : null,
                service_type_id: selectedType,
                service_date: date,
                amount_100: amount
            })

        if (offError) {
            setMessage({ type: 'error', text: `Offering Error: ${offError.message}` })
            setLoading(false)
            return
        }

        setMessage({ type: 'success', text: "Combined service data submitted successfully!" })

        // Reset form
        setAdultBrothers(0)
        setAdultSisters(0)
        setYouthBrothers(0)
        setYouthSisters(0)
        setChildrenBrothers(0)
        setChildrenSisters(0)
        setVisitorsBrothers(0)
        setVisitorsSisters(0)
        setAmount(0)

        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8 max-w-4xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-4 gap-4">
                <h2 className="text-xl font-bold text-brand-blue flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-orange" />
                    New Submission Profile
                </h2>
                <div className="flex flex-wrap gap-2">
                    {role === 'super_admin' && (
                        <button
                            type="button"
                            onClick={() => setScope('general')}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border outline-none ${scope === 'general' ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                        >
                            GENERAL COMBINED
                        </button>
                    )}
                    {(role === 'super_admin' || role === 'cluster_admin') && (
                        <button
                            type="button"
                            onClick={() => {
                                setScope('cluster')
                                if (role === 'cluster_admin' && clusterId) setSelectedCluster(clusterId)
                            }}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border outline-none ${scope === 'cluster' ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                        >
                            CLUSTER COMBINED
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setScope('center')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border outline-none ${scope === 'center' ? 'bg-brand-blue text-white border-brand-blue shadow-md ring-2 ring-blue-50' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                    >
                        CENTER RECORD
                    </button>
                </div>
            </div>

            {/* Header: Scope Selection (Dynamic) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    {scope === 'center' && (
                        <div className="animate-in slide-in-from-left-2 duration-300">
                            <label className="text-sm font-semibold flex items-center gap-2 mb-1">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                Reporting Center
                            </label>
                            <select
                                required
                                disabled={role === 'center_rep' || fetchingData}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-50"
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                            >
                                {role === 'center_rep' ? (
                                    <option value={centerId || ""}>{centers.find(c => c.id === centerId)?.name || "Assigned Center"}</option>
                                ) : (
                                    <>
                                        <option value="">Select Center</option>
                                        {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                    {scope === 'cluster' && (
                        <div className="animate-in slide-in-from-left-2 duration-300">
                            <label className="text-sm font-semibold flex items-center gap-2 text-blue-600 mb-1">
                                <MapPin className="w-4 h-4" />
                                Target Cluster
                            </label>
                            <select
                                required
                                disabled={role === 'cluster_admin' || fetchingData}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600/20 outline-none disabled:bg-gray-50"
                                value={selectedCluster}
                                onChange={(e) => setSelectedCluster(e.target.value)}
                            >
                                {role === 'cluster_admin' ? (
                                    <option value={clusterId || ""}>{clusters.find(c => c.id === clusterId)?.name || "Your Cluster"}</option>
                                ) : (
                                    <>
                                        <option value="">Select Cluster</option>
                                        {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                    {scope === 'general' && (
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-3 animate-in zoom-in-95 duration-300">
                            <Globe className="w-5 h-5 text-orange-600" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-orange-700 uppercase">Organization Level</span>
                                <span className="text-[10px] text-orange-600">General Combined Service</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        Service Type
                    </label>
                    <select
                        required
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">Select Service</option>
                        {serviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Date
                    </label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Section 1: Attendance */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Attendance Breakdown</h3>
                    <div className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">8 CATEGORIES</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Adult (Bro)", val: adultBrothers, set: setAdultBrothers },
                        { label: "Adult (Sis)", val: adultSisters, set: setAdultSisters },
                        { label: "Youth (Bro)", val: youthBrothers, set: setYouthBrothers },
                        { label: "Youth (Sis)", val: youthSisters, set: setYouthSisters },
                        { label: "Children (Bro)", val: childrenBrothers, set: setChildrenBrothers },
                        { label: "Children (Sis)", val: childrenSisters, set: setChildrenSisters },
                        { label: "Visitors (Bro)", val: visitorsBrothers, set: setVisitorsBrothers },
                        { label: "Visitors (Sis)", val: visitorsSisters, set: setVisitorsSisters },
                    ].map((field, idx) => (
                        <div key={idx} className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 focus:border-brand-blue focus:bg-white outline-none transition-all focus:ring-2 focus:ring-brand-blue/10"
                                value={field.val}
                                onChange={(e) => field.set(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    ))}
                </div>
                <div className="p-5 bg-gradient-to-r from-brand-blue/5 to-brand-orange/5 rounded-2xl flex justify-between items-center border border-brand-blue/10">
                    <div>
                        <p className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest">Grand Total</p>
                        <span className="font-bold text-brand-blue text-sm">All Categories Combined</span>
                    </div>
                    <span className="text-3xl font-black text-brand-orange">{grandTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* Section 2: Offering */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Financial Remittance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Offering (100%)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full pl-8 pr-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm font-bold focus:border-green-500 focus:bg-white outline-none focus:ring-2 focus:ring-green-500/10 transition-all"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-[10px] text-green-700 font-bold uppercase">80% Remit</p>
                            <p className="text-md font-bold text-green-800">₦{(amount * 0.8).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[10px] text-brand-blue font-bold uppercase">20% Local</p>
                            <p className="text-md font-bold text-brand-blue">₦{(amount * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !selectedType || (scope === 'center' && !selectedCenter) || (scope === 'cluster' && !selectedCluster)}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-brand-orange/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm tracking-wide"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Collating & Submitting..." : `Submit ${scope.charAt(0).toUpperCase() + scope.slice(1)} Record`}
            </button>
        </form>
    )
}
