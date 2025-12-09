-- Migration script to migrate users from Supabase auth.users to our users table
-- WARNING: This script assumes Supabase auth.users still exists
-- Run this AFTER creating the users table and BEFORE removing Supabase auth dependency

-- Copy users from auth.users to public.users
-- Note: Password hashes from Supabase won't work with our system
-- Users will need to reset passwords or use a migration service
INSERT INTO public.users (id, email, password_hash, email_verified, email_verified_at, created_at, updated_at, status, metadata)
SELECT 
    au.id,
    au.email,
    -- Generate a temporary password hash (users must reset password)
    '$2b$10$TemporaryHashForMigrationResetRequired' as password_hash,
    COALESCE(au.email_confirmed_at IS NOT NULL, false) as email_verified,
    au.email_confirmed_at as email_verified_at,
    au.created_at,
    au.updated_at,
    CASE 
        WHEN au.banned_until IS NOT NULL THEN 'suspended'
        WHEN au.deleted_at IS NOT NULL THEN 'inactive'
        ELSE 'active'
    END as status,
    COALESCE(au.raw_user_meta_data, '{}'::jsonb) as metadata
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Note: After migration, users should be prompted to reset their passwords
-- via a password reset flow







