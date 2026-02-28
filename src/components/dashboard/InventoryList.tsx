"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { InventoryItem } from "@/types/database"
import { Loader2, Package, Tag, BadgeCheck, ChevronLeft, ChevronRight, Search } from "lucide-react"

export default function InventoryList({
    centerId,
    role,
    clusterId
}: {
    centerId?: string | null,
    role: string,
    clusterId?: string | null
}) {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [centers, setCenters] = useState<Record<string, string>>({})
    const [clusters, setClusters] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    // Grouping & Filtering States
    const [groupBy, setGroupBy] = useState<'none' | 'center' | 'cluster'>('none')
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(12)
    const [totalCount, setTotalCount] = useState(0)

    const supabase = createClient()

    useEffect(() => {
        async function fetchInventory() {
            setLoading(true)

            // 1. Fetch metadata if admin
            if (role !== 'center_rep') {
                const [{ data: centersData }, { data: clustersData }] = await Promise.all([
                    supabase.from('centers').select('id, name'),
                    supabase.from('clusters').select('id, name')
                ])
                if (centersData) {
                    const cMap = centersData.reduce((acc, c: any) => ({ ...acc, [c.id]: c.name }), {})
                    setCenters(cMap)
                }
                if (clustersData) {
                    const clMap = clustersData.reduce((acc, cl: any) => ({ ...acc, [cl.id]: cl.name }), {})
                    setClusters(clMap)
                }
            }

            // 2. Build Query for items
            let query = supabase.from('inventory_items').select('*', { count: 'exact' })

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`)
            }

            if (role === 'center_rep' && centerId) {
                query = query.eq('center_id', centerId)
            } else if (centerId) {
                query = query.eq('center_id', centerId)
            } else if (clusterId && role !== 'center_rep') {
                const { data: clusterCenters } = await supabase.from('centers').select('id').eq('cluster_id', clusterId)
                const cIds = clusterCenters?.map(c => c.id) || []
                query = query.in('center_id', cIds)
            }

            const start = (currentPage - 1) * itemsPerPage
            const end = start + itemsPerPage - 1

            const { data, count } = await query
                .order('created_at', { ascending: false })
                .range(start, end)

            if (data) setItems(data)
            if (count !== null) setTotalCount(count)
            setLoading(false)
        }
        fetchInventory()
    }, [centerId, role, clusterId, currentPage, searchTerm])

    if (loading && items.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        )
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    function renderItemCard(item: any) {
        return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className="h-48 bg-gray-50 flex items-center justify-center relative">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <Package className="w-12 h-12 text-gray-200" />
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-brand-blue shadow-sm">
                        Qty: {item.quantity}
                    </div>
                </div>

                <div className="p-4 space-y-3 flex-grow">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-lg text-brand-blue leading-tight flex-grow">{item.name}</h3>
                            {role !== 'center_rep' && (
                                <div className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-bold whitespace-nowrap">
                                    {centers[item.center_id] || 'Unknown'}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-brand-orange font-semibold uppercase mt-1">{item.condition || 'Unknown Condition'}</p>
                    </div>

                    {(item.model || item.model_number) && (
                        <div className="space-y-1">
                            {item.model && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Tag className="w-3 h-3" />
                                    <span className="font-medium">Model:</span> {item.model}
                                </div>
                            )}
                            {item.model_number && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <BadgeCheck className="w-3 h-3" />
                                    <span className="font-medium">S/N:</span> {item.model_number}
                                </div>
                            )}
                        </div>
                    )}

                    {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    )}
                </div>

                <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 mt-auto flex justify-between items-center">
                    <p className="text-[10px] text-gray-400">Added {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        )
    }

    function renderGroupedGrid() {
        // Grouping logic for rendering
        const grouped: Record<string, any[]> = {}

        items.forEach(item => {
            let groupName = 'Unknown Location'
            if (groupBy === 'center') {
                groupName = centers[item.center_id] || 'Unknown Center'
            } else if (groupBy === 'cluster') {
                // To group by cluster, we'd need center -> cluster mapping
                // For now center is the primary unit of classification
                groupName = centers[item.center_id] || 'Unknown'
            }

            if (!grouped[groupName]) grouped[groupName] = []
            grouped[groupName].push(item)
        })

        return (
            <div className="space-y-12">
                {Object.entries(grouped).map(([groupName, groupItems]) => (
                    <div key={groupName} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] bg-brand-blue/5 px-4 py-2 rounded-lg border border-brand-blue/10">
                                {groupName}
                            </h2>
                            <div className="h-px bg-gray-100 flex-grow"></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{groupItems.length} items</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupItems.map(renderItemCard)}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>

                <div className="flex gap-4 items-center">
                    {role !== 'center_rep' && (
                        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                            <button
                                onClick={() => setGroupBy('none')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${groupBy === 'none' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                GRID
                            </button>
                            <button
                                onClick={() => setGroupBy('center')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${groupBy === 'center' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                GROUP BY CENTER
                            </button>
                        </div>
                    )}
                    <div className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total: {totalCount}
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">No items found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or check different filters.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-10">
                        {groupBy === 'none' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map(renderItemCard)}
                            </div>
                        ) : (
                            renderGroupedGrid()
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center pt-8">
                            <div className="flex gap-1 items-center bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
