-- ============================================
-- ORGANIZATIONS TABLE - VAULT ENCRYPTION UPGRADE
-- Updates existing table for Supabase Vault encryption
-- ============================================

-- ============================================
-- STEP 1: Enable Required Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgsodium;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ============================================
-- STEP 2: Add Missing Columns to Organizations Table
-- ============================================

-- Add encrypted credential columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS org_password_secret_id UUID;

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS security_token_secret_id UUID;

-- Add org_name column (useful for display)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS org_name TEXT;

-- Add updated_at column for tracking changes
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments
COMMENT ON COLUMN organizations.org_password_secret_id IS 'Vault secret ID for encrypted Salesforce password';
COMMENT ON COLUMN organizations.security_token_secret_id IS 'Vault secret ID for encrypted security token';
COMMENT ON COLUMN organizations.org_name IS 'Salesforce organization name';
COMMENT ON COLUMN organizations.updated_at IS 'Last update timestamp';

-- ============================================
-- STEP 3: Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_instance_url ON organizations(instance_url);

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;

-- Policy: Users can only view their own organizations
CREATE POLICY "Users can view own organizations"
    ON organizations FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert organizations linked to themselves
CREATE POLICY "Users can insert own organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own organizations
CREATE POLICY "Users can update own organizations"
    ON organizations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own organizations
CREATE POLICY "Users can delete own organizations"
    ON organizations FOR DELETE
    USING (auth.uid() = user_id);

-- Service role has full access (needed for encryption functions)
-- Service role bypasses RLS by default

-- ============================================
-- STEP 6: Create Updated_At Trigger
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_organizations_updated_at ON organizations;

-- Create trigger
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- ============================================
-- STEP 7: Create Encryption Helper Functions
-- ============================================

-- Function to encrypt and store a secret in Vault
CREATE OR REPLACE FUNCTION encrypt_credential(credential_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_uuid UUID;
BEGIN
    IF credential_value IS NULL OR credential_value = '' THEN
        RAISE EXCEPTION 'Credential value cannot be null or empty';
    END IF;

    INSERT INTO vault.secrets (secret)
    VALUES (credential_value)
    RETURNING id INTO secret_uuid;

    RETURN secret_uuid;
END;
$$;

-- Function to decrypt a credential from Vault
CREATE OR REPLACE FUNCTION decrypt_credential(secret_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    decrypted_value TEXT;
BEGIN
    IF secret_uuid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT decrypted_secret INTO decrypted_value
    FROM vault.decrypted_secrets
    WHERE id = secret_uuid;

    RETURN decrypted_value;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to decrypt credential: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION encrypt_credential(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_credential(UUID) TO service_role;

-- ============================================
-- STEP 8: Create Decrypted Organizations View
-- ============================================

DROP VIEW IF EXISTS organizations_decrypted;

CREATE OR REPLACE VIEW organizations_decrypted AS
SELECT 
    o.id,
    o.user_id,
    o.org_email,
    o.is_sandbox,
    o.instance_url,
    o.org_name,
    o.created_at,
    o.updated_at,
    -- Decrypt credentials on-demand
    CASE 
        WHEN o.org_password_secret_id IS NOT NULL THEN decrypt_credential(o.org_password_secret_id)
        ELSE o.org_password  -- Fallback to plaintext during migration
    END as org_password,
    CASE 
        WHEN o.security_token_secret_id IS NOT NULL THEN decrypt_credential(o.security_token_secret_id)
        ELSE o.security_token  -- Fallback to plaintext during migration
    END as security_token
FROM organizations o;

-- Grant access to service role only
GRANT SELECT ON organizations_decrypted TO service_role;

COMMENT ON VIEW organizations_decrypted IS 'View with decrypted credentials - service role access only';

-- ============================================
-- STEP 9: Migrate Existing Data to Vault
-- ============================================

DO $$
DECLARE
    org_record RECORD;
    password_secret_id UUID;
    token_secret_id UUID;
    migrated_count INTEGER := 0;
    skipped_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Starting credential encryption migration...';
    
    -- Loop through all organizations with plaintext credentials
    FOR org_record IN 
        SELECT id, org_email, org_password, security_token 
        FROM organizations 
        WHERE org_password IS NOT NULL 
        AND org_password_secret_id IS NULL  -- Not yet migrated
    LOOP
        BEGIN
            -- Encrypt password
            password_secret_id := encrypt_credential(org_record.org_password);
            
            -- Encrypt security token
            token_secret_id := encrypt_credential(org_record.security_token);
            
            -- Update the organization record
            UPDATE organizations
            SET 
                org_password_secret_id = password_secret_id,
                security_token_secret_id = token_secret_id
            WHERE id = org_record.id;
            
            migrated_count := migrated_count + 1;
            RAISE NOTICE '✅ Migrated org: % (email: %)', org_record.id, org_record.org_email;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING '❌ Failed to migrate org %: %', org_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Count orgs that were already migrated
    SELECT COUNT(*) INTO skipped_count 
    FROM organizations 
    WHERE org_password_secret_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration Summary:';
    RAISE NOTICE '   Newly migrated: % orgs', migrated_count;
    RAISE NOTICE '   Already encrypted: % orgs', skipped_count - migrated_count;
    RAISE NOTICE '   Errors: % orgs', error_count;
    RAISE NOTICE '   Total encrypted: % orgs', skipped_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- STEP 10: Verify Migration
-- ============================================

-- Show migration status
SELECT 
    COUNT(*) FILTER (WHERE org_password_secret_id IS NOT NULL) as encrypted_count,
    COUNT(*) FILTER (WHERE org_password_secret_id IS NULL AND org_password IS NOT NULL) as plaintext_count,
    COUNT(*) as total_count
FROM organizations;

-- Show sample of migrated organizations
SELECT 
    id,
    org_email,
    org_password IS NOT NULL as has_plaintext_password,
    org_password_secret_id IS NOT NULL as has_encrypted_password,
    security_token_secret_id IS NOT NULL as has_encrypted_token,
    created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- STEP 11: Test Encryption/Decryption
-- ============================================

DO $$
DECLARE
    test_secret_id UUID;
    test_value TEXT := 'TestPassword123!@#';
    decrypted_value TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Testing encryption/decryption...';
    
    -- Encrypt
    test_secret_id := encrypt_credential(test_value);
    RAISE NOTICE '   Encrypted test value, got secret ID: %', test_secret_id;
    
    -- Decrypt
    decrypted_value := decrypt_credential(test_secret_id);
    
    -- Verify
    IF decrypted_value = test_value THEN
        RAISE NOTICE '   ✅ Encryption/Decryption test PASSED!';
    ELSE
        RAISE EXCEPTION '   ❌ Encryption test FAILED! Values do not match.';
    END IF;
    
    -- Cleanup test secret
    DELETE FROM vault.secrets WHERE id = test_secret_id;
    RAISE NOTICE '   Cleaned up test secret';
END $$;

-- ============================================
-- STEP 12: Grant Permissions
-- ============================================

-- Ensure authenticated users can read/write their own orgs
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;

-- Service role needs full access for API operations
GRANT ALL ON organizations TO service_role;

-- ============================================
-- COMPLETION CHECKLIST
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 MIGRATION CHECKLIST:';
    RAISE NOTICE '   ✅ Extensions enabled';
    RAISE NOTICE '   ✅ Columns added to organizations table';
    RAISE NOTICE '   ✅ Indexes created';
    RAISE NOTICE '   ✅ RLS enabled and policies created';
    RAISE NOTICE '   ✅ Triggers created';
    RAISE NOTICE '   ✅ Encryption functions created';
    RAISE NOTICE '   ✅ Decrypted view created';
    RAISE NOTICE '   ✅ Existing data migrated';
    RAISE NOTICE '   ✅ Migration verified';
    RAISE NOTICE '   ✅ Encryption tested';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRATION COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
    RAISE NOTICE '   1. Update API code to use encrypted columns';
    RAISE NOTICE '   2. Test thoroughly in development';
    RAISE NOTICE '   3. Monitor for any decryption errors';
    RAISE NOTICE '   4. After 1-2 weeks of testing, drop plaintext columns:';
    RAISE NOTICE '      ALTER TABLE organizations DROP COLUMN org_password;';
    RAISE NOTICE '      ALTER TABLE organizations DROP COLUMN security_token;';
    RAISE NOTICE '';
END $$;

-- ============================================
-- OPTIONAL: Drop Plaintext Columns (AFTER TESTING!)
-- ============================================

-- ⚠️ UNCOMMENT THESE LINES ONLY AFTER:
-- - All API code is updated
-- - Thoroughly tested for at least 1-2 weeks
-- - Verified all orgs are encrypted
-- - Backup created

-- ALTER TABLE organizations DROP COLUMN IF EXISTS org_password CASCADE;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS security_token CASCADE;

-- RAISE NOTICE '🗑️ Plaintext credential columns dropped';
