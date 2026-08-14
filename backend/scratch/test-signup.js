const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runTest() {
  console.log('Testing signUp with Service Role Client...');
  try {
    const { data, error } = await serviceClient.auth.signUp({
      email: 'test_service_client@bavio.ai',
      password: 'password123',
    });
    if (error) {
      console.log('Service client error:', error.message);
    } else {
      console.log('Service client success:', data.user ? 'User created' : 'No user');
    }
  } catch (err) {
    console.error('Service client exception:', err.message);
  }

  console.log('\nTesting signUp with Anon Client...');
  try {
    const { data, error } = await anonClient.auth.signUp({
      email: 'test_anon_client@bavio.ai',
      password: 'password123',
    });
    if (error) {
      console.log('Anon client error:', error.message);
    } else {
      console.log('Anon client success:', data.user ? 'User created' : 'No user');
    }
  } catch (err) {
    console.error('Anon client exception:', err.message);
  }
}

runTest();
