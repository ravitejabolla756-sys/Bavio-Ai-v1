const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const testEmail = `test_otp_sr_${Date.now()}@bavio.ai`;
    const testPassword = 'TestPassword123!';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Testing signUp with service_role client for email:', testEmail);
    
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
