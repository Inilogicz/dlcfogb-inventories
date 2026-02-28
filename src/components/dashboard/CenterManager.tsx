"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { createClient } from "@/lib/supabase/client"
import { Center, Cluster } from "@/types/database"
import {
    Plus, Trash2, Loader2, Building2, MapPin, Mail, Lock, X,
    ChevronRight, CheckCircle2, AlertTriangle, User, Search
} from "lucide-react"

// ----- Create Center Modal -----
function CreateCenterModal({ clusters, onClose, onCreated }: { clusters: Cluster[], onClose: () => void, onCreated: () => void }) {
    const [step, setStep] = useState<1 | 2>(1)
    const [name, setName] = useState("")
    const [selectedClusterId, setSelectedClusterId] = useState("")
    const [repEmail, setRepEmail] = useState("")
    const [repPassword, setRepPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (step === 1) {
            if (!selectedClusterId) {
                setError("Please select a cluster first")
                return
            }
            setStep(2)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)

        // 1. Create the Center
        const { data: center, error: centerError } = await supabase
            .from('centers')
            .insert({
                name: name,
                cluster_id: selectedClusterId
            })
            .select()
            .single()

        if (centerError || !center) {
            let msg = "Something went wrong"
            if (centerError?.message?.includes("unique constraint")) {
                msg = "Center with this name already exists"
            }
            setError(msg)
            setLoading(false)
            return
        }

        // 2. Create the Rep User via API
        const selectedCluster = clusters.find(c => c.id === selectedClusterId)
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: repEmail,
                password: repPassword,
                full_name: `${name} Representative`,
                role: 'center_rep',
                region_id: selectedCluster?.region_id || null,
                cluster_id: selectedClusterId,
                center_id: center.id
            })
        })

        if (!res.ok) {
            const err = await res.json()
            setError(err.error || "Something went wrong")
        } else {
            onCreated()
            onClose()
        }
        setLoading(false)
    }

    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = "" }
    }, [])

    const selectedClusterName = clusters.find(c => c.id === selectedClusterId)?.name || ""

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Modal Header */}
                <div className="px-7 pt-7 pb-5 bg-gradient-to-r from-teal-600 to-teal-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-6" />
                    <button onClick={onClose} className="absolute top-5 right-5 text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white">New Fellowship Center</h2>
                        <p className="text-teal-100 text-sm mt-1">Add a new location under an existing cluster</p>
                    </div>
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-5 relative">
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${step === 1 ? 'bg-white text-teal-700' : 'bg-white/20 text-white'}`}>
                            <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[10px] font-black">1</span>
                            Center Details
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/40" />
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${step === 2 ? 'bg-white text-teal-700' : 'bg-white/20 text-white'}`}>
                            <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[10px] font-black">2</span>
                            Rep Account
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Assign to Cluster</span>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-300 focus:bg-white transition-all appearance-none cursor-pointer"
                                        value={selectedClusterId}
                                        onChange={(e) => setSelectedClusterId(e.target.value)}
                                    >
                                        <option value="">Select a Cluster</option>
                                        {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </label>

                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Center Name</span>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. UI Campus Fellowship"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-300 focus:bg-white transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-teal-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-teal-400 font-bold uppercase tracking-widest">Assigning to {selectedClusterName}</p>
                                    <p className="text-sm font-bold text-teal-700">{name}</p>
                                </div>
                            </div>
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Representative Email</span>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="email"
                                        placeholder="rep@dlcf.org"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-300 focus:bg-white transition-all"
                                        value={repEmail}
                                        onChange={(e) => setRepEmail(e.target.value)}
                                    />
                                </div>
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Access Password</span>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Secure password"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-300 focus:bg-white transition-all"
                                        value={repPassword}
                                        onChange={(e) => setRepPassword(e.target.value)}
                                    />
                                </div>
                            </label>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 px-1">
                                <User className="w-3 h-3 text-teal-500" />
                                This user will manage attendance and offerings for this center.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        {step === 2 && (
                            <button type="button" onClick={() => setStep(1)}
                                className="px-5 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-teal-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? "Creating..." : step === 1 ? "Next: Setup Access →" : "Create Center"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

// ----- Delete Confirm Modal -----
function DeleteCenterModal({ center, onClose, onDeleted }: { center: Center, onClose: () => void, onDeleted: () => void }) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "" } }, [])

    async function handleDelete() {
        setLoading(true)
        const { error } = await supabase.from('centers').delete().eq('id', center.id)
        if (!error) { onDeleted(); onClose() }
        setLoading(false)
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 space-y-5">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900">Delete Center</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Are you sure you want to delete <strong className="text-gray-900">"{center.name}"</strong>? This will stop all record submissions from this location.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
                        Cancel
                    </button>
                    <button onClick={handleDelete} disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

// ----- Main Page -----
export default function CenterManager() {
    const [centers, setCenters] = useState<Center[]>([])
    const [clusters, setClusters] = useState<Cluster[]>([])
    const [fetching, setFetching] = useState(true)
    const [creating, setCreating] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Center | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const supabase = createClient()

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        setFetching(true)
        const [centersRes, clustersRes] = await Promise.all([
            supabase.from('centers').select('*, clusters(name)').order('name'),
            supabase.from('clusters').select('*').order('name')
        ])
        if (centersRes.data) setCenters(centersRes.data as any)
        if (clustersRes.data) setClusters(clustersRes.data)
        setFetching(false)
    }

    function handleCreated() {
        setSuccessMsg("Fellowship center and representative account created!")
        fetchData()
        setTimeout(() => setSuccessMsg(null), 4000)
    }

    function handleDeleted() {
        setSuccessMsg("Center removed successfully.")
        fetchData()
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    const filteredCenters = centers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c as any).clusters?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Grouping for the stats/overview
    const centersByCluster: Record<string, number> = {}
    centers.forEach(c => {
        const cname = (c as any).clusters?.name || "Unassigned"
        centersByCluster[cname] = (centersByCluster[cname] || 0) + 1
    })

    return (
        <div className="space-y-6">
            {/* Success Toast */}
            {successMsg && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-4 rounded-2xl animate-in slide-up">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search centers or clusters..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-200 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-teal-100 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Add Center
                </button>
            </div>

            {/* Content Grid */}
            {fetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm" />)}
                </div>
            ) : filteredCenters.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-20 text-center space-y-5">
                    <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto">
                        <Building2 className="w-10 h-10 text-teal-300" />
                    </div>
                    <div>
                        <p className="font-black text-gray-900 text-lg">No centers found</p>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto mt-1">
                            {searchTerm ? "No locations match your search criteria." : "Get started by adding your first fellowship center location."}
                        </p>
                    </div>
                    {!searchTerm && (
                        <button onClick={() => setCreating(true)}
                            className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl shadow-teal-200 hover:bg-teal-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Register New Center
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCenters.map((center, i) => (
                        <div key={center.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-50 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50" />

                            <div className="relative">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => setDeleteTarget(center)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{center.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <MapPin className="w-3.5 h-3.5 text-teal-500" />
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{(center as any).clusters?.name || "Global"}</p>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Registered</span>
                                    <span className="text-[10px] font-bold text-gray-500">
                                        {new Date(center.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {creating && <CreateCenterModal clusters={clusters} onClose={() => setCreating(false)} onCreated={handleCreated} />}
            {deleteTarget && <DeleteCenterModal center={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
        </div>
    )
}
