const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgpgkgqskendiqqbohwj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGdrZ3Fza2VuZGlxcWJvaHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwOTc3NiwiZXhwIjoyMDg3Nzg1Nzc2fQ.qxIkvUjW2KZzQIdZ1M5_AKHCYWp0RjeGfC5a9nEf7Xg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSchemas() {
    console.log('Listing schemas...');
    const { data: schemas, error } = await supabase.rpc('get_schemas');

    if (error) {
        console.error('Error fetching schemas:', error.message);

        // Try to query directly if RPC fails
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_schema, table_name')
            .eq('table_name', 'profiles');

        if (tableError) {
            console.error('Error fetching tables:', tableError.message);
        } else {
            console.log('Profiles table locations:', tables);
        }
    } else {
        console.log('Schemas:', schemas);
    }
}

listSchemas();
