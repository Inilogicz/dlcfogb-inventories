import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { handleError, AppError } from "@/lib/api-error"

export async function GET() {
    try {
        const supabase = await createClient()
        const adminSupabase = await createAdminClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new AppError("Unauthorized", 401)

        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role, region_id, cluster_id')
            .eq('id', user.id)
            .single()

        if (!profile) throw new AppError("Profile not found", 404)

        let query = adminSupabase.from('profiles').select('*').order('full_name')

        if (profile.role === 'region_admin' && profile.region_id) {
            query = query.eq('region_id', profile.region_id)
        } else if (profile.role === 'cluster_admin' && profile.cluster_id) {
            query = query.eq('cluster_id', profile.cluster_id)
        } else if (profile.role === 'center_rep') {
            query = query.eq('id', user.id)
        } else if (profile.role !== 'super_admin') {
            // Other non-admin roles shouldn't be listing all users
            query = query.eq('id', user.id)
        }

        const { data: profiles, error } = await query

        if (error) throw error
        return NextResponse.json(profiles)
    } catch (error: any) {
        return handleError(error)
    }
}

export async function POST(request: Request) {
    try {
        const { email, password, full_name, role, region_id, cluster_id, center_id } = await request.json()
        const supabase = await createAdminClient()

        // 1. Create the Auth User
        const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        })

        if (authError) {
            if (authError.message?.toLowerCase().includes("already") && authError.message?.toLowerCase().includes("registered")) {
                throw new AppError("A user with this email has already been registered", 400, authError)
            }
            if (authError.message?.toLowerCase().includes("already") && authError.message?.toLowerCase().includes("exists")) {
                throw new AppError("A user with this email has already been registered", 400, authError)
            }
            throw authError
        }

        if (!user) throw new AppError("Failed to create user", 500)

        // 2. Update the Profile (it's created by trigger, but we need to set role/cluster/center)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name,
                role,
                region_id: region_id || null,
                cluster_id: cluster_id || null,
                center_id: center_id || null
            })
            .eq('id', user.id)

        if (profileError) throw profileError

        return NextResponse.json({ user })
    } catch (error: any) {
        return handleError(error)
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, ...updates } = await request.json()
        const supabase = await createAdminClient()

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return handleError(error)
    }
}
