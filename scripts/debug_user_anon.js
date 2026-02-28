const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgpgkgqskendiqqbohwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGdrZ3Fza2VuZGlxcWJvaHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDk3NzYsImV4cCI6MjA4Nzc4NTc3Nn0.SM_K2VnS9_v_1ucYEYekBuzIIDz7GVAoXVRq9xwWs88';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    const userId = 'f80e1e21-f54b-4b2b-b628-65b865519c74'; // admin@dlcf.org
    console.log(`Fetching profile for user ${userId} using ANON key...`);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile with ANON key:', error.message, error.code);
    } else {
        console.log('Profile found with ANON key:', profile);
    }
}

debug();
