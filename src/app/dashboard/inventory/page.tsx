"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { requireUser } from "@/lib/auth-utils"
import InventoryForm from "@/components/dashboard/InventoryForm"
import InventoryList from "@/components/dashboard/InventoryList"
import { Loader2, Filter } from "lucide-react"

export default function InventoryPage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [clusters, setClusters] = useState<any[]>([])
    const [centers, setCenters] = useState<any[]>([])

    // Filter states
    const [selectedCluster, setSelectedCluster] = useState<string>("")
    const [selectedCenter, setSelectedCenter] = useState<string>("")

    const supabase = createClient()

    useEffect(() => {
        async function init() {
            // In a real app, requireUser might be server-side, 
            // but since we converted to client, we fetch profile here
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setProfile(prof)

            if (prof?.role === 'super_admin' || prof?.role === 'cluster_admin') {
                const [{ data: clusts }, { data: cents }] = await Promise.all([
                    supabase.from('clusters').select('id, name').order('name'),
                    supabase.from('centers').select('id, name, cluster_id').order('name')
                ])
                setClusters(clusts || [])
                setCenters(cents || [])
            }
            setLoading(false)
        }
        init()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
            </div>
        )
    }

    if (!profile) return null
    const role = profile.role

    if (!profile.center_id && role === 'center_rep') {
        return <div>Error: Center Representative session but no Center ID assigned.</div>
    }

    const filteredCenters = selectedCluster
        ? centers.filter(c => c.cluster_id === selectedCluster)
        : centers

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-brand-blue">Inventory Management</h1>
                <p className="text-gray-500">Track and manage church physical assets.</p>
            </header>

            {role === 'center_rep' ? (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    <div className="xl:col-span-1">
                        <InventoryForm centerId={profile.center_id!} />
                    </div>
                    <div className="xl:col-span-3">
                        <InventoryList centerId={profile.center_id!} role={role} />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Admin Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2 text-brand-blue font-bold text-sm uppercase shrink-0">
                            <Filter className="w-4 h-4" />
                            Classification:
                        </div>

                        <div className="flex flex-wrap gap-3 flex-grow">
                            {role === 'super_admin' && (
                                <select
                                    className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue/10 min-w-[150px]"
                                    value={selectedCluster}
                                    onChange={(e) => {
                                        setSelectedCluster(e.target.value)
                                        setSelectedCenter("") // Reset center when cluster changes
                                    }}
                                >
                                    <option value="">All Clusters</option>
                                    {clusters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}

                            <select
                                className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue/10 min-w-[150px]"
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                            >
                                <option value="">All Centers</option>
                                {filteredCenters.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            {(selectedCluster || selectedCenter) && (
                                <button
                                    onClick={() => { setSelectedCluster(""); setSelectedCenter(""); }}
                                    className="text-[10px] text-brand-orange font-black uppercase hover:underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {role === 'super_admin' ? 'Organization Wide' : 'Cluster Assets'}
                            </p>
                        </div>
                    </div>

                    <InventoryList
                        role={role}
                        clusterId={selectedCluster || profile.cluster_id}
                        centerId={selectedCenter}
                    />
                </div>
            )}
        </div>
    )
}
