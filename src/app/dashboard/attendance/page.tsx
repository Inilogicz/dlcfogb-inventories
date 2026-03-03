import { requireUser } from "@/lib/auth-utils"
import AttendanceManager from "@/components/dashboard/AttendanceManager"

export default async function AttendancePage() {
    const profile = await requireUser()

    if (!profile.center_id && profile.role === 'center_rep') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-12 text-center">
                <p className="text-red-700 font-bold text-lg">⚠️ Center Assignment Required</p>
                <p className="text-red-600/70 text-sm mt-2">Your profile is missing a Center ID. Please contact your administrator to be assigned to a center.</p>
            </div>
        )
    }

    return <AttendanceManager profile={profile} type="attendance" />
}
