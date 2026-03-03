import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Profile } from "@/types/database"
import { logger } from "./logger"

export async function getUserProfile() {
    logger.info("Starting getUserProfile")
    const supabase = await createClient()
    logger.info("Supabase client created")

    if (!supabase || !supabase.auth) {
        logger.error("Supabase client or auth not initialized")
        return null
    }

    logger.info("Fetching user from auth")
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) logger.error("Auth error:", authError)
    logger.info(`Auth user fetched: ${user?.id}`)

    if (!user) {
        return null
    }

    logger.info("Creating admin client")
    const adminSupabase = await createAdminClient()
    logger.info("Admin client created, fetching profile")
    let { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    if (profileError) logger.error("Profile fetch error:", profileError)
    logger.info("Profile fetched successfully")

    if (!profile) {
        logger.warn(`No profile found for user ${user.id}. Attempting auto-provisioning...`)

        // Auto-provision a default profile if missing
        const { data: newProfile, error: insertError } = await adminSupabase
            .from('profiles')
            .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || 'User',
                role: 'center_rep'
            })
            .select('*')
            .single()

        if (insertError) {
            logger.error(`Failed to auto-provision profile for user ${user.id}`, insertError)
        } else {
            logger.info(`Successfully auto-provisioned profile for user ${user.id}`)
            profile = newProfile
        }
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
