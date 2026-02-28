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

const env = parseEnv(path.join(__dirname, '../.env.local'));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAttendance() {
    const { data, error, count } = await supabase
        .from('attendance_submissions')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Total attendance submissions: ${count}`);
        if (data && data.length > 0) {
            console.log('Sample data:', data[0]);
            const grandTotalSum = data.reduce((sum, item) => sum + (item.grand_total || 0), 0);
            console.log(`Sum of grand_total: ${grandTotalSum}`);
        }
    }
}

checkAttendance();
