-- 0. Reconcile column lengths and enum values
ALTER TABLE users ALTER COLUMN business_phone TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN business_website TYPE VARCHAR(512);

-- Alter enum values (PostgreSQL allows this without transaction)
ALTER TYPE call_status_type ADD VALUE IF NOT EXISTS 'in-progress';
ALTER TYPE call_status_type ADD VALUE IF NOT EXISTS 'started';

-- 1. Sync existing rows from businesses to users
INSERT INTO users (id, email, password_hash, country_code, currency_code, business_name, business_phone, business_website, industry, status)
SELECT 
    id,
    email,
    password_hash,
    COALESCE(country_code, 'US'),
    CASE 
        WHEN country_code = 'IN' THEN 'INR'
        WHEN country_code = 'GB' THEN 'GBP'
        WHEN country_code = 'AU' THEN 'AUD'
        WHEN country_code = 'AE' THEN 'AED'
        ELSE 'USD'
    END,
    name,
    phone,
    website,
    industry,
    CASE 
        WHEN status::text = 'active' THEN 'active'::user_status_type
        WHEN status::text = 'inactive' THEN 'inactive'::user_status_type
        ELSE 'paused'::user_status_type
    END
FROM businesses
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    country_code = EXCLUDED.country_code,
    business_name = EXCLUDED.business_name,
    business_phone = EXCLUDED.business_phone,
    business_website = EXCLUDED.business_website,
    industry = EXCLUDED.industry;

-- 2. Define trigger function for businesses inserts/updates
CREATE OR REPLACE FUNCTION sync_business_to_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, password_hash, country_code, currency_code, business_name, business_phone, business_website, industry, status)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.password_hash,
        COALESCE(NEW.country_code, 'US'),
        CASE 
            WHEN NEW.country_code = 'IN' THEN 'INR'
            WHEN NEW.country_code = 'GB' THEN 'GBP'
            WHEN NEW.country_code = 'AU' THEN 'AUD'
            WHEN NEW.country_code = 'AE' THEN 'AED'
            ELSE 'USD'
        END,
        NEW.name,
        NEW.phone,
        NEW.website,
        NEW.industry,
        CASE 
            WHEN NEW.status::text = 'active' THEN 'active'::user_status_type
            WHEN NEW.status::text = 'inactive' THEN 'inactive'::user_status_type
            ELSE 'paused'::user_status_type
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        country_code = EXCLUDED.country_code,
        business_name = EXCLUDED.business_name,
        business_phone = EXCLUDED.business_phone,
        business_website = EXCLUDED.business_website,
        industry = EXCLUDED.industry;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_business_to_user ON businesses;

CREATE TRIGGER trigger_sync_business_to_user
AFTER INSERT OR UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION sync_business_to_user();

-- 3. Define trigger function for businesses deletes
CREATE OR REPLACE FUNCTION delete_user_on_business_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_user_on_business_delete ON businesses;

CREATE TRIGGER trigger_delete_user_on_business_delete
AFTER DELETE ON businesses
FOR EACH ROW EXECUTE FUNCTION delete_user_on_business_delete();
