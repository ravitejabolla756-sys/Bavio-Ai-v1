-- Migration 003: Create Integrations and Business Integrations
-- Created: June 4, 2026

CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    coming_soon BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_integrations (
    id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    integration_id VARCHAR(50) REFERENCES integrations(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Inactive' CHECK (status IN ('Connected', 'Inactive')),
    keys JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, integration_id)
);

-- Seed integrations
INSERT INTO integrations (id, name, description, category, coming_soon, enabled) VALUES
('twilio', 'Twilio', 'Twilio handles phone numbers, inbound and outbound calling, and SIP routing.', 'Telephony', false, true),
('whatsapp', 'WhatsApp Business', 'WhatsApp Business enables lead notifications and customer messaging.', 'Messaging', false, true),
('google-calendar', 'Google Calendar', 'Google Calendar allows AI appointment booking.', 'Calendar', false, true),
('hubspot', 'HubSpot', 'HubSpot syncs leads and customer records.', 'CRM', false, true),
('zoho', 'Zoho CRM', 'Zoho CRM syncs leads and customer records.', 'CRM', false, true),
('webhooks', 'Webhooks', 'Webhooks allow businesses to send events and lead data into external systems.', 'Developer', false, true),

('salesforce', 'Salesforce', 'Sync call logs, captured metrics, and schedules directly into Salesforce Lead pipelines.', 'CRM', true, false),
('slack', 'Slack', 'Send real-time alerts, negative sentiment logs, and transcript details to Slack channels.', 'Messaging', true, false),
('google-sheets', 'Google Sheets', 'Sync call logs and caller insights directly to Google Sheets rows.', 'Developer', true, false),
('zapier', 'Zapier', 'Trigger custom Zapier workflows from Bavio call events.', 'Developer', true, false),
('make', 'Make', 'Connect call events to Make.com scenarios.', 'Developer', true, false),
('calendly', 'Calendly', 'Sync appointment bookings to Calendly.', 'Calendar', true, false),
('stripe', 'Stripe', 'Trigger invoices and payment links directly from caller inquiries.', 'Payments', true, false),
('microsoft-dynamics', 'Microsoft Dynamics', 'Integrate call logs with Microsoft Dynamics 365 CRM.', 'CRM', true, false),
('freshsales', 'Freshsales', 'Sync captured leads and contact details to Freshsales CRM.', 'CRM', true, false),
('pipedrive', 'Pipedrive', 'Map inbound calls to Pipedrive deals and activities.', 'CRM', true, false)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  coming_soon = EXCLUDED.coming_soon,
  enabled = EXCLUDED.enabled;
