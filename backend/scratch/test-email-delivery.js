require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseAuth() {
  console.log('--- Testing Supabase Auth Email Delivery ---');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('Has SERVICE_ROLE_KEY:', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));
  console.log('Has ANON_KEY:', Boolean(process.env.SUPABASE_ANON_KEY));

  // Test 1: Using Anon Client (which triggers Supabase user signup email)
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const testEmail = `test-otp-${Date.now()}@gmail.com`;
  console.log(`\nAttempting signUp with ANON client for: ${testEmail}...`);

  const { data: anonData, error: anonError } = await anonClient.auth.signUp({
    email: testEmail,
    password: 'Password123!',
  });

  if (anonError) {
    console.error('❌ Anon client signUp error:', anonError);
  } else {
    console.log('✅ Anon client signUp response:');
    console.log('User ID:', anonData.user?.id);
    console.log('Confirmation sent at:', anonData.user?.confirmation_sent_at);
    console.log('Identities:', anonData.user?.identities);
  }

  // Test 2: Using Service Role Client with resend
  const serviceClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`\nAttempting resend signup email for: ${testEmail}...`);
  const { data: resendData, error: resendError } = await serviceClient.auth.resend({
    type: 'signup',
    email: testEmail,
  });

  if (resendError) {
    console.error('❌ Resend error:', resendError);
  } else {
    console.log('✅ Resend response:', resendData);
  }
}

testSupabaseAuth().catch(console.error);
