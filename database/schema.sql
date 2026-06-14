-- Drop existing tables to recreate with new schema (for development)
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    api_key VARCHAR(255) UNIQUE,
    subscription_plan VARCHAR(20) CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
    status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
    country VARCHAR(5),
    usage_minutes INTEGER DEFAULT 0,
    -- Dodo Payments fields
    dodo_subscription_id VARCHAR(100),
    dodo_customer_id VARCHAR(100),
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'scale')),
    plan_expires_at TIMESTAMP,
    minutes_limit INTEGER DEFAULT 30,
    minutes_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    caller_number VARCHAR(30) NOT NULL,
    intent VARCHAR(100),
    budget DECIMAL(10, 2),
    status VARCHAR(20) CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assistants (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100),
    system_prompt TEXT,
    sarvam_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Call conversations for voice AI
CREATE TABLE call_conversations (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(100) UNIQUE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    transcript TEXT,
    ai_response TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    assistant_id INTEGER REFERENCES assistants(id),
    phone_number VARCHAR(30) UNIQUE,
    provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    phone_number_id INTEGER REFERENCES phone_numbers(id),
    provider_call_id VARCHAR(100),
    caller_number VARCHAR(30),
    call_status VARCHAR(20),
    duration INTEGER,
    cost DECIMAL(10,4),
    recording_url TEXT,
    transcript TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_logs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    call_id INTEGER REFERENCES calls(id) ON DELETE CASCADE,
    minutes_used INTEGER,
    cost DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dodo Payments logging
CREATE TABLE payment_logs (
    id SERIAL PRIMARY KEY,
    dodo_payment_id VARCHAR(100),
    dodo_customer_id VARCHAR(100),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
