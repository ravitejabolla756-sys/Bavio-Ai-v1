const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const testEmail = `test_otp_${Date.now()}@bavio.ai`;
    const testPassword = 'TestPassword123!';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Testing signUp with anon client for email:', testEmail);
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
        });
        
        if (error) {
            console.error('SignUp Error:', error);
        } else {
            console.log('SignUp Success! Data:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('SignUp Exception:', e);
    }
}

run();
