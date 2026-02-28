const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function verify() {
    const userId = 'f80e1e21-f54b-4b2b-b628-65b865519c74'; // admin@dlcf.org
    console.log(`Verifying profile fetch for user ${userId} using SERVICE_ROLE_KEY (simulating createAdminClient)...`);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile with SERVICE_ROLE_KEY:', error.message);
    } else {
        console.log('Successfully fetched profile bypassing RLS:', profile);
        console.log('Role:', profile.role);
    }
}

verify();
