-- Drop country and currency check constraints from the users table to support all countries worldwide.
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_country_code;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_currency_code;
