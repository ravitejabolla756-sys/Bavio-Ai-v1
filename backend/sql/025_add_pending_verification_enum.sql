-- Migration 025: Add pending_verification to business_status PostgreSQL Enum Type

ALTER TYPE business_status ADD VALUE IF NOT EXISTS 'pending_verification';
