-- ══════════════════════════════════════════════════════════════════════
-- Seed: Multi-Country Test Dataset
-- Description: Inserts mock configurations, plans, users, numbers, and billing
--              records for India, USA, UK, Australia, and UAE.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Insert Phone Providers Configuration
INSERT INTO phone_providers (id, country_code, provider_type, api_key_encrypted, api_token_encrypted, account_sid_encrypted, cost_per_minute, cost_per_number_monthly, max_concurrent_calls, is_active)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'IN', 'exotel', 'enc_exotel_key_in', 'enc_exotel_token_in', 'enc_exotel_sid_in', 1.2000, 250.00, 15, true),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'US', 'twilio', 'enc_twilio_key_us', 'enc_twilio_token_us', 'enc_twilio_sid_us', 0.0150, 1.00, 25, true),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'GB', 'twilio', 'enc_twilio_key_gb', 'enc_twilio_token_gb', 'enc_twilio_sid_gb', 0.0180, 1.20, 20, true),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'AU', 'twilio', 'enc_twilio_key_au', 'enc_twilio_token_au', 'enc_twilio_sid_au', 0.0220, 1.50, 20, true),
  ('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'AE', 'twilio', 'enc_twilio_key_ae', 'enc_twilio_token_ae', 'enc_twilio_sid_ae', 0.0950, 15.00, 10, true);

-- 2. Insert Pricing Plans Configurations
INSERT INTO pricing_plans (id, country_code, currency_code, plan_name, monthly_price, yearly_price, minutes_included, features)
VALUES
  -- India (INR)
  ('10000000-0000-0000-0000-000000000001', 'IN', 'INR', 'starter', 1999.00, 19190.00, 200, '{"canCustomVoice": false, "analytics": true, "whatsappFollowUps": false}'),
  ('10000000-0000-0000-0000-000000000002', 'IN', 'INR', 'growth', 3999.00, 38390.00, 500, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true}'),
  ('10000000-0000-0000-0000-000000000003', 'IN', 'INR', 'scale', 7999.00, 76790.00, 1200, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true, "prioritySupport": true}'),
  
  -- USA (USD)
  ('20000000-0000-0000-0000-000000000001', 'US', 'USD', 'starter', 39.00, 374.00, 250, '{"canCustomVoice": false, "analytics": true, "whatsappFollowUps": false}'),
  ('20000000-0000-0000-0000-000000000002', 'US', 'USD', 'growth', 79.00, 758.00, 600, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true}'),
  ('20000000-0000-0000-0000-000000000003', 'US', 'USD', 'scale', 149.00, 1430.00, 1500, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true, "prioritySupport": true}'),

  -- UK (GBP)
  ('30000000-0000-0000-0000-000000000001', 'GB', 'GBP', 'starter', 29.00, 278.00, 250, '{"canCustomVoice": false, "analytics": true, "whatsappFollowUps": false}'),
  ('30000000-0000-0000-0000-000000000002', 'GB', 'GBP', 'growth', 59.00, 566.00, 600, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true}'),
  ('30000000-0000-0000-0000-000000000003', 'GB', 'GBP', 'scale', 99.00, 950.00, 1500, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true, "prioritySupport": true}'),

  -- Australia (AUD)
  ('40000000-0000-0000-0000-000000000001', 'AU', 'AUD', 'starter', 49.00, 470.00, 200, '{"canCustomVoice": false, "analytics": true, "whatsappFollowUps": false}'),
  ('40000000-0000-0000-0000-000000000002', 'AU', 'AUD', 'growth', 99.00, 950.00, 550, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true}'),
  ('40000000-0000-0000-0000-000000000003', 'AU', 'AUD', 'scale', 199.00, 1910.00, 1400, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true, "prioritySupport": true}'),

  -- UAE (AED)
  ('50000000-0000-0000-0000-000000000001', 'AE', 'AED', 'starter', 149.00, 1430.00, 150, '{"canCustomVoice": false, "analytics": true, "whatsappFollowUps": false}'),
  ('50000000-0000-0000-0000-000000000002', 'AE', 'AED', 'growth', 299.00, 2870.00, 400, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true}'),
  ('50000000-0000-0000-0000-000000000003', 'AE', 'AED', 'scale', 499.00, 4790.00, 1000, '{"canCustomVoice": true, "analytics": true, "whatsappFollowUps": true, "prioritySupport": true}');

-- 3. Insert Users (One per country)
INSERT INTO users (id, email, password_hash, country_code, timezone, currency_code, business_name, business_phone, business_website, industry, subscription_plan, subscription_started_at, subscription_ends_at, status)
VALUES
  (
    '00000000-1111-1111-1111-111111111111', 
    'ind_user@bavio.in', 
    '$2b$10$xyz_hash_in_test', 
    'IN', 
    'Asia/Kolkata', 
    'INR', 
    'Apollo Clinic Delhi', 
    '+919876543210', 
    'https://apollo-delhi.in', 
    'healthcare', 
    'growth', 
    NOW() - INTERVAL '10 days', 
    NOW() + INTERVAL '20 days', 
    'active'
  ),
  (
    '00000000-2222-2222-2222-222222222222', 
    'us_user@bavio.com', 
    '$2b$10$xyz_hash_us_test', 
    'US', 
    'America/New_York', 
    'USD', 
    'Manhattan Dental Group', 
    '+12125550144', 
    'https://manhattandental.com', 
    'healthcare', 
    'starter', 
    NOW() - INTERVAL '5 days', 
    NOW() + INTERVAL '25 days', 
    'active'
  ),
  (
    '00000000-3333-3333-3333-333333333333', 
    'gb_user@bavio.co.uk', 
    '$2b$10$xyz_hash_gb_test', 
    'GB', 
    'Europe/London', 
    'GBP', 
    'London Law Associates', 
    '+442079460111', 
    'https://londonlaw.co.uk', 
    'legal', 
    'scale', 
    NOW() - INTERVAL '15 days', 
    NOW() + INTERVAL '15 days', 
    'active'
  ),
  (
    '00000000-4444-4444-4444-444444444444', 
    'au_user@bavio.com.au', 
    '$2b$10$xyz_hash_au_test', 
    'AU', 
    'Australia/Sydney', 
    'AUD', 
    'Sydney Realty Partners', 
    '+61298765400', 
    'https://sydneyrealty.com.au', 
    'real-estate', 
    'growth', 
    NOW() - INTERVAL '3 days', 
    NOW() + INTERVAL '27 days', 
    'active'
  ),
  (
    '00000000-5555-5555-5555-555555555555', 
    'ae_user@bavio.ae', 
    '$2b$10$xyz_hash_ae_test', 
    'AE', 
    'Asia/Dubai', 
    'AED', 
    'Dubai Oasis Gym', 
    '+97142345600', 
    'https://dubaioasisgym.ae', 
    'fitness', 
    'starter', 
    NOW() - INTERVAL '8 days', 
    NOW() + INTERVAL '22 days', 
    'active'
  );

-- 4. Insert Virtual Numbers for Users
INSERT INTO virtual_numbers (id, user_id, country_code, provider, phone_number, provider_sid, area_code, display_name, friendly_name, status)
VALUES
  ('01010101-1111-1111-1111-111111111111', '00000000-1111-1111-1111-111111111111', 'IN', 'exotel', '+918080274248', 'ex_sid_ind_101', '80', 'Apollo Delhi Line', 'Delhi Office Main', 'active'),
  ('02020202-2222-2222-2222-222222222222', '00000000-2222-2222-2222-222222222222', 'US', 'twilio', '+12025550199', 'PN_twilio_us_202', '202', 'Manhattan Main', 'Reception Main Line', 'active'),
  ('03030303-3333-3333-3333-333333333333', '00000000-3333-3333-3333-333333333333', 'GB', 'twilio', '+442079460192', 'PN_twilio_gb_303', '20', 'London Office', 'Front Desk', 'active'),
  ('04040404-4444-4444-4444-444444444444', '00000000-4444-4444-4444-444444444444', 'AU', 'twilio', '+61298765432', 'PN_twilio_au_404', '2', 'Sydney Office', 'Inbound Sales', 'active'),
  ('05050505-5555-5555-5555-555555555555', '00000000-5555-5555-5555-555555555555', 'AE', 'twilio', '+97142345678', 'PN_twilio_ae_505', '4', 'Dubai Main Office', 'Dubai Booking Line', 'active');

-- 5. Insert Subscriptions
INSERT INTO subscriptions (id, user_id, country_code, plan_name, price_amount, price_currency, billing_cycle_start, billing_cycle_end, next_billing_date, payment_method, payment_status, minutes_limit, minutes_used)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-1111-1111-1111-111111111111', 'IN', 'growth', 3999.00, 'INR', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days', 'razorpay', 'active', 500, 120),
  ('22222222-2222-2222-2222-222222222222', '00000000-2222-2222-2222-222222222222', 'US', 'starter', 39.00, 'USD', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days', 'dodo_payments', 'active', 250, 45),
  ('33333333-3333-3333-3333-333333333333', '00000000-3333-3333-3333-333333333333', 'GB', 'scale', 99.00, 'GBP', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days', 'stripe', 'active', 1500, 310),
  ('44444444-4444-4444-4444-444444444444', '00000000-4444-4444-4444-444444444444', 'AU', 'growth', 99.00, 'AUD', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', NOW() + INTERVAL '27 days', 'stripe', 'active', 550, 80),
  ('55555555-5555-5555-5555-555555555555', '00000000-5555-5555-5555-555555555555', 'AE', 'starter', 149.00, 'AED', NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days', NOW() + INTERVAL '22 days', 'dodo_payments', 'active', 150, 22);

-- 6. Insert Calls Logs (At least 1-2 per country)
INSERT INTO calls (id, user_id, country_code, call_sid, provider, from_number, to_number, virtual_number, duration_seconds, started_at, ended_at, status, cost_amount, cost_currency, recording_url, transcript)
VALUES
  (
    'c0101010-1111-1111-1111-111111111111', 
    '00000000-1111-1111-1111-111111111111', 
    'IN', 
    'sid_call_ind_001', 
    'exotel', 
    '+919988776655', 
    '+918080274248', 
    '+918080274248', 
    120, 
    NOW() - INTERVAL '2 hours', 
    NOW() - INTERVAL '2 hours' + INTERVAL '120 seconds', 
    'completed', 
    2.4000, 
    'INR', 
    'https://api.exotel.com/recordings/ind001.mp3', 
    'Hello I want to book an appointment for dental scaling. Sure, booking you for Monday.'
  ),
  (
    'c0202020-2222-2222-2222-222222222222', 
    '00000000-2222-2222-2222-222222222222', 
    'US', 
    'CA_call_us_001', 
    'twilio', 
    '+12025550170', 
    '+12025550199', 
    '+12025550199', 
    75, 
    NOW() - INTERVAL '1 hour', 
    NOW() - INTERVAL '1 hour' + INTERVAL '75 seconds', 
    'completed', 
    0.0187, 
    'USD', 
    'https://api.twilio.com/recordings/us001.mp3', 
    'Hello, do you accept Cigna insurance? Yes, we do accept Cigna.'
  ),
  (
    'c0303030-3333-3333-3333-333333333333', 
    '00000000-3333-3333-3333-333333333333', 
    'GB', 
    'CA_call_gb_001', 
    'twilio', 
    '+447911123456', 
    '+442079460192', 
    '+442079460192', 
    180, 
    NOW() - INTERVAL '3 hours', 
    NOW() - INTERVAL '3 hours' + INTERVAL '180 seconds', 
    'completed', 
    0.0540, 
    'GBP', 
    'https://api.twilio.com/recordings/gb001.mp3', 
    'Hi, I need assistance with a corporate contract dispute. I can log your request for our legal team.'
  ),
  (
    'c0404040-4444-4444-4444-444444444444', 
    '00000000-4444-4444-4444-444444444444', 
    'AU', 
    'CA_call_au_001', 
    'twilio', 
    '+61412345678', 
    '+61298765432', 
    '+61298765432', 
    45, 
    NOW() - INTERVAL '30 minutes', 
    NOW() - INTERVAL '30 minutes' + INTERVAL '45 seconds', 
    'completed', 
    0.0165, 
    'AUD', 
    'https://api.twilio.com/recordings/au001.mp3', 
    'Is the property on George street still open for inspection? Yes, it is open Saturday at 10 AM.'
  ),
  (
    'c0505050-5555-5555-5555-555555555555', 
    '00000000-5555-5555-5555-555555555555', 
    'AE', 
    'CA_call_ae_001', 
    'twilio', 
    '+971501234567', 
    '+97142345678', 
    '+97142345678', 
    90, 
    NOW() - INTERVAL '15 minutes', 
    NOW() - INTERVAL '15 minutes' + INTERVAL '90 seconds', 
    'completed', 
    0.1425, 
    'AED', 
    'https://api.twilio.com/recordings/ae001.mp3', 
    'Are you open during Eid holidays? Yes, we are open from 9 AM to 10 PM.'
  );

-- 7. Insert Usage Logs
INSERT INTO usage_logs (id, user_id, country_code, call_id, minutes_used, stt_minutes, tts_characters, cost_stt, cost_tts, cost_telephony, cost_total, currency_code, billing_month, billing_year)
VALUES
  ('f1111111-1111-1111-1111-111111111111', '00000000-1111-1111-1111-111111111111', 'IN', 'c0101010-1111-1111-1111-111111111111', 2.00, 2.00, 150, 0.4000, 0.3000, 2.4000, 3.1000, 'INR', 6, 2026),
  ('f2222222-2222-2222-2222-222222222222', '00000000-2222-2222-2222-222222222222', 'US', 'c0202020-2222-2222-2222-222222222222', 1.25, 1.25, 95,  0.0125, 0.0095, 0.0187, 0.0407, 'USD', 6, 2026),
  ('f3333333-3333-3333-3333-333333333333', '00000000-3333-3333-3333-333333333333', 'GB', 'c0303030-3333-3333-3333-333333333333', 3.00, 3.00, 220, 0.0300, 0.0220, 0.0540, 0.1060, 'GBP', 6, 2026),
  ('f4444444-4444-4444-4444-444444444444', '00000000-4444-4444-4444-444444444444', 'AU', 'c0404040-4444-4444-4444-444444444444', 0.75, 0.75, 60,  0.0075, 0.0060, 0.0165, 0.0300, 'AUD', 6, 2026),
  ('f5555555-5555-5555-5555-555555555555', '00000000-5555-5555-5555-555555555555', 'AE', 'c0505050-5555-5555-5555-555555555555', 1.50, 1.50, 110, 0.0150, 0.0110, 0.1425, 0.1685, 'AED', 6, 2026);
