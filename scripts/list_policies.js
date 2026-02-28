const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgpgkgqskendiqqbohwj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGdrZ3Fza2VuZGlxcWJvaHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwOTc3NiwiZXhwIjoyMDg3Nzg1Nzc2fQ.qxIkvUjW2KZzQIdZ1M5_AKHCYWp0RjeGfC5a9nEf7Xg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listPolicies() {
    console.log('Listing policies on profiles table...');
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });

    if (error) {
        // Fallback to direct query if RPC doesn't exist
        console.log('RPC failed, trying direct query...');
        const { data: policies, error: queryError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'profiles');

        if (queryError) {
            console.error('Error fetching policies:', queryError.message);

            // Try another way to get policies
            const { data: raw, error: rawError } = await supabase.from('pg_policy').select('*');
            console.log('Raw policies count:', raw ? raw.length : 0);
        } else {
            console.log('Policies:', policies);
        }
    } else {
        console.log('Policies from RPC:', data);
    }
}

async function debugDirect() {
    // pg_policies is a view, might be accessible via service role
    const { data, error } = await supabase
        .from('pg_catalog.pg_policies')
        .select('*')
        .eq('tablename', 'profiles');

    if (error) {
        console.log('Cannot access pg_catalog.pg_policies directly.');
    } else {
        console.log('Policies found:', data);
    }
}

listPolicies();
