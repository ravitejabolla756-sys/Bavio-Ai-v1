process.env.NODE_ENV = 'test';
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

    // 2. Create test business
    console.log('📋 Creating temporary test business...');
    const uuid = require('crypto').randomUUID();
    const testEmail = `temp-phone-biz-${uuid}@bavio.ai`;

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
    // Let's create another temporary business to test Twilio routing
    const uuid2 = require('crypto').randomUUID();
    const testEmail2 = `temp-phone-biz2-${uuid2}@bavio.ai`;
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
        .eq('business_id', testBusinessId2);

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
    }

  } catch (error: any) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    if (testBusinessId) {
      console.log('🧹 Cleaning up test data...');
      await supabase.from('businesses').delete().eq('id', testBusinessId);
      console.log('  Test business and cascading assignments deleted.');
    }
    console.log('\n═══════════════════════════════════════════════');
    console.log('  TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════');
  }
}

runTests();
