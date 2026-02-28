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
    const [regions, setRegions] = useState<any[]>([])
    const [clusters, setClusters] = useState<any[]>([])
    const [centers, setCenters] = useState<any[]>([])

    // Filter states
    const [selectedRegion, setSelectedRegion] = useState<string>("")
    const [selectedCluster, setSelectedCluster] = useState<string>("")
    const [selectedCenter, setSelectedCenter] = useState<string>("")

    const supabase = createClient()

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setProfile(prof)

            if (prof?.role === 'super_admin' || prof?.role === 'region_admin' || prof?.role === 'cluster_admin') {
                const queries: Promise<any>[] = [
                    supabase.from('clusters').select('id, name, region_id').order('name') as any,
                    supabase.from('centers').select('id, name, cluster_id').order('name') as any
                ]
                if (prof?.role === 'super_admin') {
                    queries.push(supabase.from('regions').select('id, name').order('name') as any)
                }

                const results = await Promise.all(queries)
                setClusters(results[0].data || [])
                setCenters(results[1].data || [])
                if (prof?.role === 'super_admin') {
                    setRegions(results[2].data || [])
                }
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

    // Filter logic
    let filteredClusters = clusters
    if (role === 'region_admin') {
        filteredClusters = clusters.filter(c => c.region_id === profile.region_id)
    } else if (selectedRegion) {
        filteredClusters = clusters.filter(c => c.region_id === selectedRegion)
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
                                    value={selectedRegion}
                                    onChange={(e) => {
                                        setSelectedRegion(e.target.value)
                                        setSelectedCluster("")
                                        setSelectedCenter("")
                                    }}
                                >
                                    <option value="">All Regions</option>
                                    {regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            )}

                            {(role === 'super_admin' || role === 'region_admin') && (
                                <select
                                    className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue/10 min-w-[150px]"
                                    value={selectedCluster}
                                    onChange={(e) => {
                                        setSelectedCluster(e.target.value)
                                        setSelectedCenter("")
                                    }}
                                >
                                    <option value="">All Clusters</option>
                                    {filteredClusters.map(c => (
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

                            {(selectedRegion || selectedCluster || selectedCenter) && (
                                <button
                                    onClick={() => { setSelectedRegion(""); setSelectedCluster(""); setSelectedCenter(""); }}
                                    className="text-[10px] text-brand-orange font-black uppercase hover:underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {role === 'super_admin' ? 'Organization Wide' : role === 'region_admin' ? 'Regional Assets' : 'Cluster Assets'}
                            </p>
                        </div>
                    </div>

                    <InventoryList
                        role={role}
                        regionId={selectedRegion || profile.region_id}
                        clusterId={selectedCluster || profile.cluster_id}
                        centerId={selectedCenter}
                    />
                </div>
            )}
        </div>
    )
}
