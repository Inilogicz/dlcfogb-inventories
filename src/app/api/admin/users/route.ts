import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { email, password, full_name, role, cluster_id, center_id } = await request.json()
        const supabase = await createAdminClient()

        // 1. Create the Auth User
        const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        })

        if (authError) throw authError
        if (!user) throw new Error("Failed to create user")

        // 2. Update the Profile (it's created by trigger, but we need to set role/cluster/center)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name,
                role,
                cluster_id: cluster_id || null,
                center_id: center_id || null
            })
            .eq('id', user.id)

        if (profileError) throw profileError

        return NextResponse.json({ user })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
