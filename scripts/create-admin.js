const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic parser for .env files
function parseEnv(filePath) {
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
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = 'admin@dlcf.org';
    const password = 'dlcffOyosouth123';

    console.log(`Attempting to create user: ${email}...`);

    // 1. Check if user already exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === email);

    if (existingUser) {
        console.log('User already exists in Auth. Updating role...');
        await updateProfile(existingUser.id);
        return;
    }

    // 2. Create the user in Auth if not exists
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: 'System Admin' }
    });

    if (authError) {
        console.error('Error creating user:', authError.message);
    } else {
        console.log('User created successfully in Auth.');
        await updateProfile(authData.user.id);
    }
}

async function updateProfile(userId) {
    console.log(`Updating profile for user ${userId} to super_admin...`);

    // The handle_new_user trigger might have already created a profile
    // But we want to ensure it's a super_admin
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: 'System Admin',
            role: 'super_admin'
        });

    if (profileError) {
        console.error('Error updating profile:', profileError.message);
    } else {
        console.log('Profile updated to super_admin successfully!');
        console.log('\n--- LOGIN CREDENTIALS ---');
        console.log('Email: admin@dlcf.org');
        console.log('Password: dlcffOyosouth123');
        console.log('--------------------------');
    }
}

createAdmin();
