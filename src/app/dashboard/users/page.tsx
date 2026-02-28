import { requireRole } from "@/lib/auth-utils"
import UserManager from "@/components/dashboard/UserManager"
import { Users } from "lucide-react"

export default async function UsersPage() {
    await requireRole(['super_admin'])

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-50 rounded-2xl">
                    <Users className="w-7 h-7 text-violet-600" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em]">Administration</p>
                    <h1 className="text-2xl font-black text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500">Assign roles and manage access for all portal users.</p>
                </div>
            </div>

            <UserManager />
        </div>
    )
}
