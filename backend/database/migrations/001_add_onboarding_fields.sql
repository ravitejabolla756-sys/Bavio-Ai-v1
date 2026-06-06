-- Migration: Add onboarding fields to clients and assistants tables
-- Created: May 3, 2026

-- Add onboarding fields to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS working_hours_from TIME,
  ADD COLUMN IF NOT EXISTS working_hours_to TIME,
  ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'hinglish',
  ADD COLUMN IF NOT EXISTS industry VARCHAR(50),
  ADD COLUMN IF NOT EXISTS intents JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS twilio_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS twilio_number_sid VARCHAR(50),
  ADD COLUMN IF NOT EXISTS number_assigned_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Add onboarding fields to assistants table
ALTER TABLE assistants 
  ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS greeting TEXT,
  ADD COLUMN IF NOT EXISTS voice_id VARCHAR(50) DEFAULT 'meera',
  ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS industry VARCHAR(50),
  ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'hinglish',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Add columns to leads table for better tracking
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS caller_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS full_transcript TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS call_duration INTEGER;

-- Create index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_status ON clients(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_clients_twilio_number ON clients(twilio_number);
