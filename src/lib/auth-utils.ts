import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Profile } from "@/types/database"

export async function getUserProfile() {
    const supabase = await createClient()

    if (!supabase || !supabase.auth) {
        console.error("Supabase client or auth not initialized")
        return null
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        console.warn(`No profile found for user ${user.id}`)
    }

    return profile as Profile | null
}

export async function requireUser() {
    const profile = await getUserProfile()
    if (!profile) {
        redirect('/login')
    }
    return profile
}

export async function requireRole(roles: string[]) {
    const profile = await requireUser()
    if (!roles.includes(profile.role)) {
        redirect('/unauthorized') // To be created
    }
    return profile
}
