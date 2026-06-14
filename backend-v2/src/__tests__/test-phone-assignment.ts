process.env.NODE_ENV = 'test';
process.env.ACTIVE_TELEPHONY_PROVIDER = 'exotel';
import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../database/supabase';
import { PhoneAssignmentService } from '../services/phoneProvider';
import { ExotelService } from '../services/phoneProvider/ExotelService';
import { TwilioService } from '../services/phoneProvider/TwilioService';

// Ensure env variables are loaded from the copied .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  BAVIO PHONE AUTO-ASSIGNMENT INTEGRATION TESTS ');
  console.log('═══════════════════════════════════════════════\n');

  let testBusinessId = null;

  try {
    // 1. Check database connection & virtual_numbers schema
    console.log('📋 TEST 0: Database schema validation');
    const { data: cols, error: colsErr } = await supabase.rpc('get_table_columns', { table_name: 'virtual_numbers' });
    
    // Fallback: simple select check if RPC is not present
    const { error: selectErr } = await supabase.from('virtual_numbers').select('*').limit(1);
    if (selectErr) {
      throw new Error(`virtual_numbers table query failed: ${selectErr.message}`);
    }
    console.log('  ✅ Passed: virtual_numbers table exists and is queryable.\n');

    // 2. Create test user and business
    console.log('📋 Creating temporary test business and user...');
    const uuid = require('crypto').randomUUID();
    const testEmail = `temp-phone-biz-${uuid}@bavio.ai`;

    const { error: userErr } = await supabase
      .from('users')
      .insert({
        id: uuid,
        email: testEmail,
        password_hash: 'mock_password_hash_for_telephony_test',
        country_code: 'US',
        timezone: 'America/New_York',
        currency_code: 'USD',
        business_name: 'Auto-Assign Phone Test Co',
        business_phone: '+15551234567',
        industry: 'real_estate',
        subscription_plan: 'starter',
        status: 'active'
      });
    if (userErr) {
      throw new Error(`Failed to create test user: ${userErr.message}`);
    }

    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        id: uuid,
        name: 'Auto-Assign Phone Test Co',
        email: testEmail,
        phone: '+15551234567',
        password_hash: 'mock_password_hash_for_telephony_test',
        status: 'active',
        country: 'US',
        country_code: 'US'
      })
      .select()
      .single();

    if (bizErr) {
      throw new Error(`Failed to create test business: ${bizErr.message}`);
    }
    testBusinessId = biz.id;
    console.log(`  Created test business ID: ${testBusinessId}\n`);

    // 3. Test Routing Selection: IN -> Exotel
    console.log('📋 TEST 1: Routing selection for India (IN)');
    const exotelResult = await PhoneAssignmentService.assignNumber({
      businessId: testBusinessId,
      countryCode: 'IN',
      friendlyName: 'Apollo Hospital'
    });

    console.log('  Purchased Exotel details:', exotelResult);
    if (exotelResult.provider === 'exotel' && exotelResult.phoneNumber.startsWith('+91')) {
      console.log('  ✅ Passed: Routed correctly to Exotel (India prefix).\n');
    } else {
      throw new Error('Failed to route India to Exotel or prefix invalid');
    }

    // 4. Test Duplicate Assignment Prevention
    console.log('📋 TEST 2: Duplicate number assignment prevention');
    const duplicateResult = await PhoneAssignmentService.assignNumber({
      businessId: testBusinessId,
      countryCode: 'IN',
      friendlyName: 'Apollo Hospital Duplicate Request'
    });

    console.log('  Duplicate result details:', duplicateResult);
    if (duplicateResult.phoneNumber === exotelResult.phoneNumber && duplicateResult.providerSid === exotelResult.providerSid) {
      console.log('  ✅ Passed: Successfully prevented duplicate number purchase and returned existing number.\n');
    } else {
      throw new Error('Duplicate request purchased a new number instead of returning the existing one!');
    }

    // 5. Test Routing Selection: US -> Twilio
    console.log('📋 TEST 3: Routing selection for Global US (Twilio)');
    // Let's create another temporary business and user to test Twilio routing
    const uuid2 = require('crypto').randomUUID();
    const testEmail2 = `temp-phone-biz2-${uuid2}@bavio.ai`;
    const { error: userErr2 } = await supabase
      .from('users')
      .insert({
        id: uuid2,
        email: testEmail2,
        password_hash: 'mock_password_hash_for_telephony_test_2',
        country_code: 'US',
        timezone: 'America/New_York',
        currency_code: 'USD',
        business_name: 'Twilio Phone Test Co',
        business_phone: '+15559876543',
        industry: 'real_estate',
        subscription_plan: 'starter',
        status: 'active'
      });
    if (userErr2) {
      throw new Error(`Failed to create second test user: ${userErr2.message}`);
    }

    const { data: biz2, error: bizErr2 } = await supabase
      .from('businesses')
      .insert({
        id: uuid2,
        name: 'Twilio Phone Test Co',
        email: testEmail2,
        phone: '+15559876543',
        password_hash: 'mock_password_hash_for_telephony_test_2',
        status: 'active',
        country: 'US',
        country_code: 'US'
      })
      .select()
      .single();

    if (bizErr2) {
      throw new Error(`Failed to create second test business: ${bizErr2.message}`);
    }
    const testBusinessId2 = biz2.id;
    
    try {
      const twilioResult = await PhoneAssignmentService.assignNumber({
        businessId: testBusinessId2,
        countryCode: 'US',
        friendlyName: 'Sunstar Realty USA'
      });

      console.log('  Purchased Twilio details:', twilioResult);
      if (twilioResult.provider === 'twilio' && twilioResult.phoneNumber.startsWith('+1')) {
        console.log('  ✅ Passed: Routed correctly to Twilio (US prefix).\n');
      } else {
        throw new Error('Failed to route USA to Twilio or prefix invalid');
      }

      // Check DB logs
      console.log('📋 TEST 4: Database logging verification');
      const { data: dbRecords, error: dbErr } = await supabase
        .from('virtual_numbers')
        .select('*')
        .eq('user_id', testBusinessId2);

      if (dbErr) {
        throw new Error(`Failed to query virtual_numbers: ${dbErr.message}`);
      }
      console.log('  Database records found for US business:', dbRecords);
      if (dbRecords && dbRecords.length === 1 && dbRecords[0].phone_number === twilioResult.phoneNumber) {
        console.log('  ✅ Passed: virtual_numbers record matches purchased details.\n');
      } else {
        throw new Error('Database record does not match purchased details');
      }
    } finally {
      // Clean up second business
      await supabase.from('businesses').delete().eq('id', testBusinessId2);
      await supabase.from('users').delete().eq('id', testBusinessId2);
    }

    // 6. Test Exotel-to-Twilio Fallback for India (IN)
    console.log('📋 TEST 5: Exotel-to-Twilio Fallback for India (IN)');
    const originalBuyNumber = ExotelService.prototype.buyNumber;
    ExotelService.prototype.buyNumber = async function () {
      throw new Error('Simulated Exotel service failure (e.g. rate limit, quota, server down)');
    };

    try {
      // Create third test business and user
      const uuid3 = require('crypto').randomUUID();
      const testEmail3 = `temp-phone-biz3-${uuid3}@bavio.ai`;
      const { error: userErr3 } = await supabase
        .from('users')
        .insert({
          id: uuid3,
          email: testEmail3,
          password_hash: 'mock_password_hash_for_telephony_test_3',
          country_code: 'IN',
          timezone: 'Asia/Kolkata',
          currency_code: 'INR',
          business_name: 'Fallback Phone Test Co',
          business_phone: '+919999999999',
          industry: 'real_estate',
          subscription_plan: 'starter',
          status: 'active'
        });
      if (userErr3) {
        throw new Error(`Failed to create third test user: ${userErr3.message}`);
      }

      const { data: biz3, error: bizErr3 } = await supabase
        .from('businesses')
        .insert({
          id: uuid3,
          name: 'Fallback Phone Test Co',
          email: testEmail3,
          phone: '+919999999999',
          password_hash: 'mock_password_hash_for_telephony_test_3',
          status: 'active',
          country: 'IN',
          country_code: 'IN'
        })
        .select()
        .single();

      if (bizErr3) {
        throw new Error(`Failed to create third test business: ${bizErr3.message}`);
      }

      try {
        const fallbackResult = await PhoneAssignmentService.assignNumber({
          businessId: uuid3,
          countryCode: 'IN',
          friendlyName: 'Apollo Hospital Fallback Route'
        });

        console.log('  Fallback result details:', fallbackResult);
        if (fallbackResult.provider === 'twilio') {
          console.log('  ✅ Passed: Successfully fell back to Twilio on Exotel failure (returned number:', fallbackResult.phoneNumber, ').\n');
        } else {
          throw new Error(`Failed: Number was assigned via provider ${fallbackResult.provider} instead of falling back to Twilio.`);
        }
      } finally {
        // Clean up third business
        await supabase.from('businesses').delete().eq('id', uuid3);
        await supabase.from('users').delete().eq('id', uuid3);
      }
    } finally {
      // Restore Exotel Service
      ExotelService.prototype.buyNumber = originalBuyNumber;
    }

    // 6. Test Twilio Override mode (ACTIVE_TELEPHONY_PROVIDER=twilio)
    console.log('📋 TEST 6: Twilio Override mode (ACTIVE_TELEPHONY_PROVIDER=twilio)');
    process.env.ACTIVE_TELEPHONY_PROVIDER = 'twilio';
    try {
      const uuid4 = require('crypto').randomUUID();
      const testEmail4 = `temp-phone-biz4-${uuid4}@bavio.ai`;
      const { error: userErr4 } = await supabase
        .from('users')
        .insert({
          id: uuid4,
          email: testEmail4,
          password_hash: 'mock_password_hash_for_telephony_test_4',
          country_code: 'IN',
          timezone: 'Asia/Kolkata',
          currency_code: 'INR',
          business_name: 'Twilio Override Test Co',
          business_phone: '+919999999999',
          industry: 'real_estate',
          subscription_plan: 'starter',
          status: 'active'
        });
      if (userErr4) {
        throw new Error(`Failed to create fourth test user: ${userErr4.message}`);
      }

      try {
        const overrideResult = await PhoneAssignmentService.assignNumber({
          businessId: uuid4,
          countryCode: 'IN',
          friendlyName: 'Apollo Hospital Twilio Override Route'
        });

        console.log('  Twilio Override result details:', overrideResult);
        if (overrideResult.provider === 'twilio') {
          console.log('  ✅ Passed: Successfully routed India to Twilio when ACTIVE_TELEPHONY_PROVIDER=twilio.\n');
        } else {
          throw new Error(`Failed: Number was assigned via provider ${overrideResult.provider} instead of Twilio override.`);
        }
      } finally {
        await supabase.from('users').delete().eq('id', uuid4);
      }
    } finally {
      process.env.ACTIVE_TELEPHONY_PROVIDER = 'exotel'; // restore
    }

  } catch (error: any) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    if (testBusinessId) {
      console.log('🧹 Cleaning up test data...');
      await supabase.from('businesses').delete().eq('id', testBusinessId);
      await supabase.from('users').delete().eq('id', testBusinessId);
      console.log('  Test business, user and cascading assignments deleted.');
    }
    console.log('\n═══════════════════════════════════════════════');
    console.log('  TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════');
  }
}

runTests();
