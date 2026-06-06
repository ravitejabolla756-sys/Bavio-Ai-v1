-- ══════════════════════════════════════════════════════════════════════
-- Migration: Add Country Code to Businesses Table
-- Description: Adds country_code VARCHAR(2) to store the 2-letter ISO country code.
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'US';

-- Backfill country_code from country column if it is already a 2-letter ISO code
UPDATE businesses 
SET country_code = UPPER(TRIM(country)) 
WHERE country IS NOT NULL AND LENGTH(TRIM(country)) = 2;

-- Backfill other common country name formats to their respective codes
UPDATE businesses 
SET country_code = 'IN' 
WHERE (country_code IS NULL OR country_code = 'US') 
  AND (country ILIKE '%India%' OR country = 'IN');

-- Default any remaining NULL values to 'US'
UPDATE businesses 
SET country_code = 'US' 
WHERE country_code IS NULL;
