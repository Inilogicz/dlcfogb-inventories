const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgpgkgqskendiqqbohwj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGdrZ3Fza2VuZGlxcWJvaHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwOTc3NiwiZXhwIjoyMDg3Nzg1Nzc2fQ.qxIkvUjW2KZzQIdZ1M5_AKHCYWp0RjeGfC5a9nEf7Xg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
    const email = 'admin@dlcf.org';
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const adminUser = user.users.find(u => u.email === email);
    if (!adminUser) {
        console.log(`User ${email} not found in auth.users`);
        return;
    }

    console.log(`Found auth user: ${adminUser.id}`);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Profile found:', profile);

        if (profile.role !== 'super_admin') {
            console.log('Updating role to super_admin...');
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'super_admin' })
                .eq('id', adminUser.id);

            if (updateError) {
                console.error('Error updating role:', updateError);
            } else {
                console.log('Role updated to super_admin');
            }
        }
    }
}

checkProfile();
