-- ============================================
-- SUPABASE DATABASE MIGRATION
-- Add Plan Column to Profiles Table
-- ============================================

-- Add plan column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'plan'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN plan VARCHAR(50) DEFAULT 'Free';
        
        COMMENT ON COLUMN profiles.plan IS 'User subscription plan (e.g., Free, Pro, Enterprise)';
    END IF;
END $$;
