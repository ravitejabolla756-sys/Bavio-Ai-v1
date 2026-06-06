-- ══════════════════════════════════════════════════════════════════════
-- Migration: Add Multi-Country Support Database Schema
-- Description: Sets up the tables, indexes, constraints, and enums for users,
--              virtual numbers, phone providers, pricing, calls, usage, and subscriptions.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Drop existing conflicting objects for clean slate
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS phone_providers CASCADE;
DROP TABLE IF EXISTS virtual_numbers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_status_type CASCADE;
DROP TYPE IF EXISTS virtual_number_status_type CASCADE;
DROP TYPE IF EXISTS call_status_type CASCADE;
DROP TYPE IF EXISTS payment_status_type CASCADE;

-- 2. Create Custom Enums
CREATE TYPE user_status_type AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE virtual_number_status_type AS ENUM ('active', 'inactive', 'error');
CREATE TYPE call_status_type AS ENUM ('completed', 'missed', 'failed');
CREATE TYPE payment_status_type AS ENUM ('active', 'pending', 'failed', 'canceled');

-- 3. Create Update Trigger Function (Audit Trails)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create Tables

-- Table 1: Users (Enhanced)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    country_code CHAR(2) NOT NULL, -- 'IN', 'US', 'GB', 'AU', 'AE'
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency_code CHAR(3) NOT NULL DEFAULT 'USD', -- 'INR', 'USD', 'GBP', 'AUD', 'AED'
    
    -- Business Details
    business_name VARCHAR(255),
    business_phone VARCHAR(20),
    business_website VARCHAR(255),
    industry VARCHAR(100),
    
    -- Subscription
    subscription_plan VARCHAR(50), -- 'starter', 'growth', 'scale'
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    
    -- Status & Audit
    status user_status_type DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_currency_code CHECK (currency_code IN ('INR', 'USD', 'GBP', 'AUD', 'AED'))
);

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 2: Virtual Numbers
CREATE TABLE virtual_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'exotel', 'twilio'
    phone_number VARCHAR(20) NOT NULL,
    provider_sid VARCHAR(100), -- Exotel SID or Twilio SID
    
    -- Metadata
    area_code VARCHAR(10),
    display_name VARCHAR(100),
    friendly_name VARCHAR(255),
    
    -- Status & Audit
    status virtual_number_status_type DEFAULT 'active',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_country UNIQUE (user_id, country_code),
    CONSTRAINT check_vn_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_vn_provider CHECK (provider IN ('exotel', 'twilio'))
);

CREATE TRIGGER update_virtual_numbers_updated_at 
    BEFORE UPDATE ON virtual_numbers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 3: Phone Providers Config
CREATE TABLE phone_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code CHAR(2) NOT NULL UNIQUE,
    provider_type VARCHAR(50) NOT NULL, -- 'exotel', 'twilio'
    
    -- Credentials (encrypted)
    api_key_encrypted VARCHAR(255),
    api_token_encrypted VARCHAR(255),
    account_sid_encrypted VARCHAR(255),
    
    -- Config
    cost_per_minute DECIMAL(8, 4) DEFAULT 0.0000,
    cost_per_number_monthly DECIMAL(8, 2) DEFAULT 0.00,
    max_concurrent_calls INT DEFAULT 10,
    
    -- Status & Audit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT check_pp_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_pp_provider_type CHECK (provider_type IN ('exotel', 'twilio'))
);

CREATE TRIGGER update_phone_providers_updated_at 
    BEFORE UPDATE ON phone_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 4: Pricing Plans
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code CHAR(2) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    plan_name VARCHAR(50) NOT NULL, -- 'starter', 'growth', 'scale'
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL,
    yearly_price DECIMAL(10, 2) NOT NULL,
    minutes_included INT DEFAULT 0,
    
    -- Features
    features JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_country_plan UNIQUE (country_code, plan_name),
    CONSTRAINT check_pplan_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_pplan_currency_code CHECK (currency_code IN ('INR', 'USD', 'GBP', 'AUD', 'AED')),
    CONSTRAINT check_pplan_name CHECK (plan_name IN ('starter', 'growth', 'scale'))
);

CREATE TRIGGER update_pricing_plans_updated_at 
    BEFORE UPDATE ON pricing_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 5: Call Logs (Per Country)
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    
    -- Call Details
    call_sid VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'exotel', 'twilio'
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    virtual_number VARCHAR(20),
    
    -- Call Data
    duration_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    status call_status_type,
    
    -- Costs
    cost_amount DECIMAL(10, 4) DEFAULT 0.0000,
    cost_currency CHAR(3) DEFAULT 'USD',
    
    -- Recording
    recording_url TEXT,
    transcript TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_calls_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_calls_provider CHECK (provider IN ('exotel', 'twilio'))
);

-- Table 6: Usage Tracking (Billing)
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    
    -- Usage
    minutes_used DECIMAL(10, 2) DEFAULT 0.00,
    stt_minutes DECIMAL(10, 2) DEFAULT 0.00,
    tts_characters INT DEFAULT 0,
    
    -- Costs Breakdown
    cost_stt DECIMAL(10, 4) DEFAULT 0.0000,
    cost_tts DECIMAL(10, 4) DEFAULT 0.0000,
    cost_telephony DECIMAL(10, 4) DEFAULT 0.0000,
    cost_total DECIMAL(10, 4) DEFAULT 0.0000,
    
    -- Currency
    currency_code CHAR(3) DEFAULT 'USD',
    
    -- Billing Period
    billing_month INT NOT NULL,
    billing_year INT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_usage_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_usage_currency_code CHECK (currency_code IN ('INR', 'USD', 'GBP', 'AUD', 'AED')),
    CONSTRAINT check_usage_month CHECK (billing_month BETWEEN 1 AND 12),
    CONSTRAINT check_usage_year CHECK (billing_year >= 2026)
);

-- Table 7: Subscription Status (Track per country)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    
    -- Plan Details
    plan_name VARCHAR(50) NOT NULL,
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency CHAR(3) NOT NULL,
    
    -- Billing
    billing_cycle_start TIMESTAMPTZ,
    billing_cycle_end TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    
    -- Payment
    payment_method VARCHAR(50), -- 'dodo_payments', 'stripe'
    payment_status payment_status_type DEFAULT 'pending',
    
    -- Metrics
    minutes_limit INT DEFAULT 0,
    minutes_used INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_sub_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_sub_currency_code CHECK (price_currency IN ('INR', 'USD', 'GBP', 'AUD', 'AED')),
    CONSTRAINT check_sub_plan CHECK (plan_name IN ('starter', 'growth', 'scale'))
);

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add Optimized Performance Indexes (optimized for country and status/email lookups)

-- Users Indexes
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Virtual Numbers Indexes
CREATE INDEX idx_virtual_numbers_country_code ON virtual_numbers(country_code);
CREATE INDEX idx_virtual_numbers_provider ON virtual_numbers(provider);
CREATE INDEX idx_virtual_numbers_status ON virtual_numbers(status);
CREATE INDEX idx_virtual_numbers_phone_number ON virtual_numbers(phone_number);

-- Phone Providers Indexes
CREATE INDEX idx_phone_providers_country_code ON phone_providers(country_code);

-- Pricing Plans Indexes
CREATE INDEX idx_pricing_plans_country_code ON pricing_plans(country_code);

-- Calls Indexes
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_country_code ON calls(country_code);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at);

-- Usage Logs Indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_billing_period ON usage_logs(billing_month, billing_year);
CREATE INDEX idx_usage_logs_country_code ON usage_logs(country_code);

-- Subscriptions Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
