-- ====================================================================
-- iCALLOG V18 MEGA MASTER SPECIFICATION
-- Database Architecture: PostgreSQL Schema (DDL)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'user' CHECK (role IN ('user', 'vip', 'admin', 'creator_override')),
    token_balance INTEGER DEFAULT 50 CHECK (token_balance >= 0),
    vip_tier VARCHAR(32) DEFAULT 'free' CHECK (vip_tier IN ('free', 'bronze', 'silver', 'gold', 'diamond')),
    vip_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. VIP SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS vip_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(64) NOT NULL,
    price_inr NUMERIC(10, 2) NOT NULL CHECK (price_inr >= 200 AND price_inr <= 2000),
    tokens_credited INTEGER NOT NULL,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    active_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vip_user_id ON vip_subscriptions(user_id);

-- 3. TOKEN LEDGER & CONSUMPTION TRACKING TABLE
CREATE TABLE IF NOT EXISTS token_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(128) NOT NULL,
    reference_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON token_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON token_ledger(created_at);

-- 4. DYNAMIC UPI PAYMENT TRANSACTIONS TABLE (NO CRYPTO)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    txn_id VARCHAR(64) NOT NULL UNIQUE,
    upi_ref VARCHAR(128),
    amount_inr NUMERIC(10, 2) NOT NULL,
    tokens_credited INTEGER NOT NULL,
    payment_method VARCHAR(32) DEFAULT 'UPI_QR' CHECK (payment_method IN ('UPI_QR', 'GPay', 'PhonePe', 'Paytm', 'Cards', 'NetBanking')),
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    qr_payload TEXT NOT NULL,
    webhook_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_txn ON payment_transactions(txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id);

-- 5. CLOUD MEDIA STORAGE & ASSET HISTORY TABLE (AWS S3 / Cloudinary)
CREATE TABLE IF NOT EXISTS generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(32) NOT NULL CHECK (asset_type IN ('3d_model', 'image_8k', 'video_8k', 'voice_audio', 'meme', 'fl_project')),
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    output_url TEXT NOT NULL,
    cloud_provider VARCHAR(32) DEFAULT 'Cloudinary' CHECK (cloud_provider IN ('AWS_S3', 'Cloudinary', 'Edge_Storage')),
    file_size_bytes BIGINT DEFAULT 0,
    tokens_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gen_user_type ON generation_history(user_id, asset_type);

-- 6. CHATBOT AI MENTOR CONVERSATION LOGS
CREATE TABLE IF NOT EXISTS chat_mentor_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'model', 'system')),
    content TEXT NOT NULL,
    code_snippet TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_mentor_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_mentor_logs(user_id);

-- 7. BACKGROUND TASK QUEUE TABLE (BullMQ / Async Jobs)
CREATE TABLE IF NOT EXISTS background_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(64) NOT NULL CHECK (task_type IN ('3d_auto_rig', '8k_image_render', '8k_video_encode', 'voice_synthesize')),
    status VARCHAR(32) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    payload JSONB DEFAULT '{}'::jsonb,
    result_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON background_tasks(user_id, status);

-- SEED DATA FOR DEMO & INITIAL TIERS
INSERT INTO users (username, email, password_hash, role, token_balance, vip_tier)
VALUES 
('admin_creator', 'creator@icallog.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'creator_override', 999999, 'diamond'),
('demo_user', 'user@icallog.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user', 50, 'free')
ON CONFLICT (email) DO NOTHING;
