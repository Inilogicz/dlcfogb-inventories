"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { createClient } from "@/lib/supabase/client"
import { Region } from "@/types/database"
import {
    Plus, Trash2, Loader2, MapPin, Mail, Lock, X,
    Building2, CheckCircle2, AlertTriangle, Users, ChevronRight
} from "lucide-react"

// ----- Create Modal -----
function CreateRegionModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
    const [step, setStep] = useState<1 | 2>(1)
    const [name, setName] = useState("")
    const [adminEmail, setAdminEmail] = useState("")
    const [adminPassword, setAdminPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (step === 1) { setStep(2); return }

        setLoading(true)
        setError(null)

        const { data: region, error: regionError } = await supabase
            .from('regions').insert({ name }).select().single()

        if (regionError || !region) {
            let msg = "Something went wrong"
            if (regionError?.message?.includes("unique constraint")) {
                msg = "Region with this name already exists"
            }
            setError(msg)
            setLoading(false)
            return
        }

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: adminEmail, password: adminPassword,
                full_name: `${name} Admin`, role: 'region_admin',
                region_id: region.id
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

    useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "" } }, [])

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Modal Header */}
                <div className="px-7 pt-7 pb-5 bg-gradient-to-r from-indigo-600 to-indigo-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-6" />
                    <button onClick={onClose} className="absolute top-5 right-5 text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white">New Region</h2>
                        <p className="text-indigo-200 text-sm mt-1">Add a high-level administrative region</p>
                    </div>
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-5 relative">
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${step === 1 ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}>
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">1</span>
                            Region Details
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/40" />
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${step === 2 ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}>
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">2</span>
                            Admin Account
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Region Name</span>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. Oyo South Region"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-300 focus:bg-white transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Creating admin for</p>
                                    <p className="text-sm font-bold text-indigo-700">{name}</p>
                                </div>
                            </div>
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</span>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="email"
                                        placeholder="admin@dlcf.org"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-300 focus:bg-white transition-all"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                    />
                                </div>
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Password</span>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Strong password"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-300 focus:bg-white transition-all"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                    />
                                </div>
                            </label>
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
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? "Creating..." : step === 1 ? "Next: Admin Setup →" : "Create Region"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

// ----- Delete Confirm Modal -----
function DeleteModal({ region, onClose, onDeleted }: { region: Region, onClose: () => void, onDeleted: () => void }) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "" } }, [])

    async function handleDelete() {
        setLoading(true)
        const { error } = await supabase.from('regions').delete().eq('id', region.id)
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
                    <h3 className="text-lg font-black text-gray-900">Delete Region</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Are you sure you want to delete <strong className="text-gray-900">"{region.name}"</strong>? This will detach all associated clusters.
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
export default function RegionManager() {
    const [regions, setRegions] = useState<Region[]>([])
    const [clusterCounts, setClusterCounts] = useState<Record<string, number>>({})
    const [fetching, setFetching] = useState(true)
    const [creating, setCreating] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Region | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => { fetchRegions() }, [])

    async function fetchRegions() {
        setFetching(true)
        const [{ data }, { data: clusters }] = await Promise.all([
            supabase.from('regions').select('*').order('name'),
            supabase.from('clusters').select('id, region_id')
        ])
        if (data) setRegions(data)
        if (clusters) {
            const counts: Record<string, number> = {}
            clusters.forEach(c => { if (c.region_id) counts[c.region_id] = (counts[c.region_id] || 0) + 1 })
            setClusterCounts(counts)
        }
        setFetching(false)
    }

    function handleCreated() {
        setSuccessMsg("Region and admin account created successfully!")
        fetchRegions()
        setTimeout(() => setSuccessMsg(null), 4000)
    }

    function handleDeleted() {
        setSuccessMsg("Region deleted.")
        fetchRegions()
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    return (
        <div className="space-y-6">
            {/* Success Toast */}
            {successMsg && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-4 rounded-2xl animate-in slide-up">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Header Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{regions.length} region{regions.length !== 1 ? 's' : ''} configured</p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    New Region
                </button>
            </div>

            {/* Cards Grid */}
            {fetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
                </div>
            ) : regions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                        <MapPin className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">No regions yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "New Region" to create your first administrative region.</p>
                    </div>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Create First Region
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {regions.map((region, i) => (
                        <div key={region.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group relative overflow-hidden">
                            {/* Background accent */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-300" />

                            <div className="relative">
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <button
                                        onClick={() => setDeleteTarget(region)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-gray-900 mt-3 text-base">{region.name}</h3>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                        <Building2 className="w-3 h-3" />
                                        {clusterCounts[region.id] || 0} Clusters
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(region.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {creating && <CreateRegionModal onClose={() => setCreating(false)} onCreated={handleCreated} />}
            {deleteTarget && <DeleteModal region={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
        </div>
    )
}
