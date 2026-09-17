require('dotenv').config();
const db = require('../database/db');
const crypto = require('crypto');

async function setupReviewAccount() {
  const email = process.env.BAVIO_REVIEW_ACCOUNT_EMAIL || 'review@bavio.local';
  const workspaceName = 'Bavio Review Workspace';
  const defaultPassword = process.env.BAVIO_REVIEW_ACCOUNT_PASSWORD;
  if (!defaultPassword) {
    throw new Error('BAVIO_REVIEW_ACCOUNT_PASSWORD must be set in environment.');
  }

  console.log(`Setting up review account for ${email}...`);

  // 1. Check / create user in Supabase Auth
  let supabaseUserId = null;
  const { data: usersData, error: listError } = await db.supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing Supabase users:', listError.message);
  } else {
    const existing = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      supabaseUserId = existing.id;
      console.log(`Found existing Supabase user: ${supabaseUserId}`);
      // Ensure password is updated so login succeeds
      await db.supabase.auth.admin.updateUserById(supabaseUserId, {
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Bavio Reviewer', country: 'US' }
      });
      console.log(`Updated Supabase credentials for user: ${supabaseUserId}`);
    }
  }

  if (!supabaseUserId) {
    console.log(`Creating new Supabase Auth user for ${email}...`);
    const { data: newUser, error: createError } = await db.supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Bavio Reviewer', country: 'US' }
    });
    if (createError) {
      console.error('Failed to create Supabase user:', createError.message);
      throw createError;
    }
    supabaseUserId = newUser.user.id;
    console.log(`Created new Supabase user ID: ${supabaseUserId}`);
  }

  // 2. Upsert business record with internal review entitlement
  const apiKey = crypto.randomUUID();
  const existingBiz = await db.query('SELECT id FROM businesses WHERE email = $1 OR id = $2', [email, supabaseUserId]);

  if (existingBiz.rows.length > 0) {
    console.log('Updating existing business profile for review workspace...');
    await db.query(
      `UPDATE businesses
       SET id = $1,
           name = $2,
           full_name = $3,
           email = $4,
           status = 'active',
           subscription_status = 'active',
           plan = 'enterprise',
           plan_name = 'internal_review',
           minutes_limit = 999999,
           minutes_used = 0,
           monthly_limit_seconds = 59999940,
           monthly_usage_seconds = 0,
           topup_balance_seconds = 0,
           onboarding_status = 'completed',
           onboarding_step = 6,
           country = 'US',
           country_code = 'US',
           industry = 'Technology',
           language = 'en-US',
           updated_at = NOW()
       WHERE id = $5 OR email = $4`,
      [supabaseUserId, workspaceName, 'Bavio Reviewer', email, existingBiz.rows[0].id]
    );
  } else {
    console.log('Inserting new business profile for review workspace...');
    await db.query(
      `INSERT INTO businesses (
         id, name, full_name, email, phone, password_hash, api_key,
         minutes_limit, minutes_used, status, country, country_code,
         industry, language, onboarding_step, onboarding_status,
         plan, plan_name, current_period_end, subscription_status,
         monthly_limit_seconds, monthly_usage_seconds, topup_balance_seconds
       )
       VALUES (
         $1, $2, $3, $4, '+12025550199', 'supabase_auth_placeholder', $5,
         999999, 0, 'active', 'US', 'US',
         'Technology', 'en-US', 6, 'completed',
         'enterprise', 'internal_review', '2099-12-31 00:00:00+00', 'active',
         59999940, 0, 0
       )`,
      [supabaseUserId, workspaceName, 'Bavio Reviewer', email, apiKey]
    );
  }

  // 3. Ensure a default review assistant exists for testing
  const astCheck = await db.query('SELECT id FROM assistants WHERE business_id = $1', [supabaseUserId]);
  if (astCheck.rows.length === 0) {
    console.log('Creating initial assistant for review workspace...');
    await db.query(
      `INSERT INTO assistants (
         business_id, name, agent_name, language, greeting, first_message, system_prompt, industry, voice_id, is_active
       )
       VALUES (
         $1, 'Receptionist AI', 'Receptionist AI', 'en-US',
         'Hello! Thank you for calling Bavio. How may I assist you today?',
         'Hello! Thank you for calling Bavio. How may I assist you today?',
         'You are an intelligent, courteous voice AI receptionist for Bavio Review Workspace.',
         'Technology', 'meera', true
       )`,
      [supabaseUserId]
    );
  }

  console.log('✅ Review account setup complete!');
  console.log(`Account: ${email}`);
  console.log(`Workspace: ${workspaceName}`);
  console.log(`User ID: ${supabaseUserId}`);
}

if (require.main === module) {
  setupReviewAccount()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}

module.exports = { setupReviewAccount };
