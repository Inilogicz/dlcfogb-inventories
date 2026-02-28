"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Profile, Cluster, Center } from "@/types/database"
import { Loader2, Save } from "lucide-react"

export default function UserManager() {
    const [users, setUsers] = useState<Profile[]>([])
    const [clusters, setClusters] = useState<Cluster[]>([])
    const [centers, setCenters] = useState<Center[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const [profilesRes, clustersRes, centersRes] = await Promise.all([
            fetch('/api/admin/users').then(res => res.json()),
            supabase.from('clusters').select('*').order('name'),
            supabase.from('centers').select('*').order('name')
        ])

        if (Array.isArray(profilesRes)) setUsers(profilesRes)
        if (clustersRes.data) setClusters(clustersRes.data)
        if (centersRes.data) setCenters(centersRes.data)
        setLoading(false)
    }

    async function handleUpdateUser(userId: string, updates: Partial<Profile>) {
        setSavingId(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, ...updates })
            })
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u))
            }
        } catch (error) {
            console.error("Failed to update user:", error)
        }
        setSavingId(null)
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-600">User</th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-600">Role</th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-600">Cluster</th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-600">Center</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-400">Loading users...</td></tr>
                    ) : users.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4">
                                <p className="font-medium">{user.full_name || "Anonymous"}</p>
                                <p className="text-xs text-gray-400">{user.id}</p>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    className="text-sm border rounded p-1"
                                    value={user.role}
                                    onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as any })}
                                >
                                    <option value="super_admin">Super Admin</option>
                                    <option value="cluster_admin">Cluster Admin</option>
                                    <option value="center_rep">Center Rep</option>
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    className="text-sm border rounded p-1"
                                    value={user.cluster_id || ""}
                                    onChange={(e) => handleUpdateUser(user.id, { cluster_id: e.target.value || null })}
                                >
                                    <option value="">None</option>
                                    {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    className="text-sm border rounded p-1"
                                    value={user.center_id || ""}
                                    onChange={(e) => handleUpdateUser(user.id, { center_id: e.target.value || null })}
                                >
                                    <option value="">None</option>
                                    {centers
                                        .filter(c => !user.cluster_id || c.cluster_id === user.cluster_id)
                                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                    }
                                </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {savingId === user.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin inline ml-auto" />
                                ) : (
                                    <span className="text-xs text-green-500 font-medium">Auto-saved</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
