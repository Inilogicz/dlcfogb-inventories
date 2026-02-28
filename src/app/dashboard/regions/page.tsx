import { requireRole } from "@/lib/auth-utils"
import RegionManager from "@/components/dashboard/RegionManager"
import { MapPin } from "lucide-react"

export default async function RegionsPage() {
    await requireRole(['super_admin'])

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                    <MapPin className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Administration</p>
                    <h1 className="text-2xl font-black text-gray-900">Region Management</h1>
                    <p className="text-sm text-gray-500">Create and manage high-level administrative regions.</p>
                </div>
            </div>
            <RegionManager />
        </div>
    )
}
