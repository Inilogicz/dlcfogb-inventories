import { requireUser } from "@/lib/auth-utils"
import UnifiedSubmissionForm from "@/components/dashboard/UnifiedSubmissionForm"
import UnifiedSubmissionList from "@/components/dashboard/UnifiedSubmissionList"
import { PhilippinePeso as Naira, Plus } from "lucide-react"

export default async function OfferingsPage() {
    const profile = await requireUser()

    if (!profile.center_id && profile.role === 'center_rep') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-semibold">Error: No Center ID assigned. Please contact your Admin.</p>
            </div>
        )
    }

    const canSubmit = profile.role === 'center_rep' || profile.role === 'cluster_admin'

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl">
                        <Naira className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Financial Records</p>
                        <h1 className="text-2xl font-black text-gray-900">Offering Collation</h1>
                        <p className="text-sm text-gray-500">Record and review offering remittances.</p>
                    </div>
                </div>
            </div>

            {/* Submission Form */}
            {canSubmit && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 rounded-lg">
                            <Plus className="w-4 h-4 text-green-600" />
                        </div>
                        <h2 className="font-bold text-gray-900">New Combined Entry</h2>
                        <p className="text-xs text-gray-400 ml-auto">Record offering alongside attendance</p>
                    </div>
                    <div className="p-6">
                        <UnifiedSubmissionForm centerId={profile.center_id} clusterId={profile.cluster_id} role={profile.role} />
                    </div>
                </div>
            )}

            {/* History */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.15em]">Submission History</h2>
                    <div className="h-px bg-gray-100 flex-grow" />
                </div>
                <UnifiedSubmissionList role={profile.role} centerId={profile.center_id} />
            </div>
        </div>
    )
}
