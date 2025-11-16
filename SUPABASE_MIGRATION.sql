-- ============================================
-- SUPABASE DATABASE MIGRATION
-- Profile Page Features - Table Creation
-- ============================================
-- Execute these SQL commands in your Supabase SQL Editor
-- Run them in order as shown below
-- ============================================

-- ============================================
-- 1. USER_PREFERENCES TABLE
-- ============================================
-- Stores user preferences: theme, notifications, language
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    notifications BOOLEAN DEFAULT true,
    email_updates BOOLEAN DEFAULT true,
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comment
COMMENT ON TABLE user_preferences IS 'Stores user preferences for theme, notifications, and language settings';

-- ============================================
-- 2. SECURITY_SETTINGS TABLE
-- ============================================
-- Stores security-related settings: 2FA, privacy settings
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    profile_visible BOOLEAN DEFAULT true,
    data_sharing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);

-- Add comment
COMMENT ON TABLE security_settings IS 'Stores user security settings including 2FA and privacy preferences';

-- ============================================
-- 3. ACTIVE_SESSIONS TABLE
-- ============================================
-- Tracks active user sessions for security management
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);

-- Add comment
COMMENT ON TABLE active_sessions IS 'Tracks active user sessions for security and session management';

-- ============================================
-- 4. UPDATE EXISTING ORGANIZATIONS TABLE
-- ============================================
-- Ensure is_sandbox column exists (if it doesn't already)
-- This is safe to run even if column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'is_sandbox'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN is_sandbox BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN organizations.is_sandbox IS 'Indicates if the organization is a Salesforce sandbox';
    END IF;
END $$;

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
-- Automatically update updated_at when records are modified

-- Trigger for user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for security_settings
DROP TRIGGER IF EXISTS update_security_settings_updated_at ON security_settings;
CREATE TRIGGER update_security_settings_updated_at
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only access their own security settings
DROP POLICY IF EXISTS "Users can view own security settings" ON security_settings;
CREATE POLICY "Users can view own security settings"
    ON security_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON security_settings;
CREATE POLICY "Users can update own security settings"
    ON security_settings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON security_settings;
CREATE POLICY "Users can insert own security settings"
    ON security_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only access their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON active_sessions;
CREATE POLICY "Users can view own sessions"
    ON active_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON active_sessions;
CREATE POLICY "Users can delete own sessions"
    ON active_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================
-- Run these to verify tables were created successfully

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_preferences', 'security_settings', 'active_sessions')
ORDER BY table_name;

-- Check columns for user_preferences
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check columns for security_settings
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'security_settings'
ORDER BY ordinal_position;

-- Check columns for active_sessions
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'active_sessions'
ORDER BY ordinal_position;

-- ============================================
-- NOTES:
-- ============================================
-- 1. All tables use UUID for primary keys
-- 2. Foreign keys reference profiles(id) with CASCADE delete
-- 3. RLS policies ensure users can only access their own data
-- 4. Triggers automatically update updated_at timestamps
-- 5. Default values are set for all preference fields
-- 6. Constraints ensure data integrity (theme, language values)
--
-- After running this migration:
-- - Test API endpoints to ensure they work correctly
-- - Verify RLS policies are working as expected
-- - Consider adding indexes for frequently queried fields
-- ============================================

