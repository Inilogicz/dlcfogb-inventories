const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            env[match[1]] = value.trim();
        }
    });
    return env;
}

const env = parseEnv(path.join(__dirname, '.env.local'));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    const sqlPath = path.join(__dirname, 'scripts', 'migration_add_region_id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('--- Running Migration ---');

    // Split SQL by semicolons and filter out empty statements
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        // We use rpc 'execute_sql' if available, otherwise we have to use the Postgres REST API or skip
        // Since we don't know if execute_sql exists, we'll try a different approach if possible
        // Actually, many Supabase instances don't have execute_sql by default.
        // Let's try to perform the operations using the JS client instead for safety/portability.
    }
}

// Rewriting to use JS client for better compatibility if execute_sql is not enabled
async function runSafeMigration() {
    console.log('--- Running Migration via JS client ---');

    // Note: Column additions and index changes usually require direct SQL.
    // We'll try to use the 'execute_sql' RPC which is common in these environments.
    const sql = fs.readFileSync(path.join(__dirname, 'scripts', 'migration_add_region_id.sql'), 'utf8');

    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) {
        console.error('Error executing migration (is execute_sql RPC enabled?):', error.message);
        console.log('If execute_sql is missing, please run the SQL manually in the Supabase Dashboard.');
    } else {
        console.log('Migration completed successfully.');
    }
}

runSafeMigration();
