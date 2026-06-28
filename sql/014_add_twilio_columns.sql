-- Alter phone_numbers table to add Twilio SID and configured webhook URL
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS twilio_sid VARCHAR(100);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS webhook_url TEXT;
