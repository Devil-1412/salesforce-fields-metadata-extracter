-- ============================================
-- SUPABASE DATABASE MIGRATION
-- Saved Queries Feature - Table Creation
-- ============================================

-- ============================================
-- 1. SAVED_QUERIES TABLE
-- ============================================
-- Stores users' saved SOQL queries
CREATE TABLE IF NOT EXISTS saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_saved_queries_user_id ON saved_queries(user_id);

-- Add comment
COMMENT ON TABLE saved_queries IS 'Stores saved SOQL queries for users';

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved queries
DROP POLICY IF EXISTS "Users can view own saved queries" ON saved_queries;
CREATE POLICY "Users can view own saved queries"
    ON saved_queries FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved queries
DROP POLICY IF EXISTS "Users can insert own saved queries" ON saved_queries;
CREATE POLICY "Users can insert own saved queries"
    ON saved_queries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved queries
DROP POLICY IF EXISTS "Users can update own saved queries" ON saved_queries;
CREATE POLICY "Users can update own saved queries"
    ON saved_queries FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own saved queries
DROP POLICY IF EXISTS "Users can delete own saved queries" ON saved_queries;
CREATE POLICY "Users can delete own saved queries"
    ON saved_queries FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 3. TRIGGERS
-- ============================================
-- Automatically update updated_at timestamp
-- Assumes update_updated_at_column function exists from previous migrations

DROP TRIGGER IF EXISTS update_saved_queries_updated_at ON saved_queries;
CREATE TRIGGER update_saved_queries_updated_at
    BEFORE UPDATE ON saved_queries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
