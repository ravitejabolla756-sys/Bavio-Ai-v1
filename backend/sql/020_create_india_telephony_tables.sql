-- ══════════════════════════════════════════════════════════════════════
-- Migration: India Compliance KYC State Machine & Provisioning Setup
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS india_kyc_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    kyc_status VARCHAR(50) DEFAULT 'NOT_STARTED' CHECK (
        kyc_status IN ('NOT_STARTED', 'DOCUMENTS_REQUIRED', 'UNDER_REVIEW', 'APPROVED', 'PROVISIONING', 'ACTIVE', 'REJECTED')
    ),
    document_urls TEXT[] DEFAULT '{}', -- S3/Supabase Storage links to PDF identity proofs
    admin_notes TEXT DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_india_kyc_business_id ON india_kyc_applications(business_id);
CREATE INDEX IF NOT EXISTS idx_india_kyc_status ON india_kyc_applications(kyc_status);
