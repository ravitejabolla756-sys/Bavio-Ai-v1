-- Add trial_expiry_alert_sent column to track if 5-minute pre-expiry email was sent
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS trial_expiry_alert_sent BOOLEAN DEFAULT false;
