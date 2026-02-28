import { requireRole } from "@/lib/auth-utils"
import CenterManager from "@/components/dashboard/CenterManager"
import { Building2 } from "lucide-react"

export default async function CentersPage() {
    await requireRole(['super_admin', 'cluster_admin'])

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 rounded-2xl">
                    <Building2 className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em]">Location Management</p>
                    <h1 className="text-2xl font-black text-gray-900">Center Management</h1>
                    <p className="text-sm text-gray-500">Create and assign centers within clusters.</p>
                </div>
            </div>
            <CenterManager />
        </div>
    )
}
