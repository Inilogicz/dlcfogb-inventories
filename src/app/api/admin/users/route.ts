import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { handleError, AppError } from "@/lib/api-error"

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name')

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

        if (authError) throw authError
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
        if (error.message?.includes("User already registered")) {
            return handleError(new AppError("Account created already", 400, error))
        }
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
