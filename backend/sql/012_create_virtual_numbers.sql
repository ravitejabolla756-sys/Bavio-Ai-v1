-- ══════════════════════════════════════════════════════════════════════
-- Migration: Create virtual_numbers table
-- Description: Stores automatically assigned virtual phone numbers.
-- ══════════════════════════════════════════════════════════════════════

-- Create enum for provider type if not exists
DO $$ BEGIN
    CREATE TYPE provider_type AS ENUM ('exotel', 'twilio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for status if not exists
DO $$ BEGIN
    CREATE TYPE virtual_number_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS virtual_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    provider provider_type NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    provider_sid VARCHAR(100),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status virtual_number_status DEFAULT 'active',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance on business_id and phone_number lookup
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_business_id ON virtual_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_phone_number ON virtual_numbers(phone_number);
