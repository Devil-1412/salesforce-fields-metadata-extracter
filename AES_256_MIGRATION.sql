-- ============================================
-- AES-256 ENCRYPTION MIGRATION
-- Adds encrypted columns for org_password and security_token
-- ============================================

-- ============================================
-- STEP 1: Add Encrypted Columns
-- ============================================

-- Add columns for encrypted credentials
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS encrypted_org_password TEXT;

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS encrypted_security_token TEXT;

-- Add comments
COMMENT ON COLUMN organizations.encrypted_org_password IS 'AES-256 encrypted Salesforce password';
COMMENT ON COLUMN organizations.encrypted_security_token IS 'AES-256 encrypted security token';

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- ============================================
-- STEP 3: Verify Migration
-- ============================================

-- Show migration status
SELECT 
    COUNT(*) FILTER (WHERE encrypted_org_password IS NOT NULL) as encrypted_count,
    COUNT(*) FILTER (WHERE org_password IS NOT NULL AND encrypted_org_password IS NULL) as plaintext_count,
    COUNT(*) as total_count
FROM organizations;

-- ============================================
-- STEP 4: IMPORTANT NEXT STEPS
-- ============================================

-- ⚠️ AFTER TESTING FOR 1-2 WEEKS, DROP PLAINTEXT COLUMNS:
-- 
-- UNCOMMENT THESE LINES ONLY AFTER:
-- - All API code is updated
-- - Thoroughly tested
-- - Verified all orgs are encrypted
-- - Backup created
--
-- ALTER TABLE organizations DROP COLUMN IF EXISTS org_password CASCADE;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS security_token CASCADE;
-- 
-- SELECT '🗑️ Plaintext credential columns dropped' as status;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AES-256 ENCRYPTION MIGRATION COMPLETE';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Set ENCRYPTION_KEY in .env.local';
    RAISE NOTICE '   2. Update API code to use encrypted columns';
    RAISE NOTICE '   3. Test thoroughly in development';
    RAISE NOTICE '   4. After 1-2 weeks, drop plaintext columns';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Columns created:';
    RAISE NOTICE '   - encrypted_org_password';
    RAISE NOTICE '   - encrypted_security_token';
    RAISE NOTICE '========================================';
END $$;
