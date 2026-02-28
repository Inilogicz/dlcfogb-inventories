const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgpgkgqskendiqqbohwj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGdrZ3Fza2VuZGlxcWJvaHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwOTc3NiwiZXhwIjoyMDg3Nzg1Nzc2fQ.qxIkvUjW2KZzQIdZ1M5_AKHCYWp0RjeGfC5a9nEf7Xg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log('Fetching all users...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    console.log(`Found ${users.length} users.`);
    for (const user of users) {
        console.log(`- ID: ${user.id}, Email: ${user.email}`);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                console.log(`  !! No profile found for ${user.email}`);
            } else {
                console.error(`  Error fetching profile for ${user.email}:`, profileError.message);
            }
        } else {
            console.log(`  Profile: Name=${profile.full_name}, Role=${profile.role}`);
        }
    }
}

debug();
