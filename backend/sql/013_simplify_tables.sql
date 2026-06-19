-- Alter businesses table to match simplified structure
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_mobile VARCHAR(30);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS assistant_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone_number_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

-- Alter assistants table
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(100);
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS voice VARCHAR(100) DEFAULT 'meera';

-- Ensure phone_numbers table columns
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'exotel';
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Ensure calls table columns
ALTER TABLE calls ADD COLUMN IF NOT EXISTS provider_call_id VARCHAR(100);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS cost DECIMAL(10,4) DEFAULT 0;

-- Ensure leads table columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';
