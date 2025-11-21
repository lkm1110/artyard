-- Add avatar_url column to profiles table if it doesn't exist
-- This column stores the URL of the user's profile picture

-- 1. Check if column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        -- Add avatar_url column
        ALTER TABLE profiles 
        ADD COLUMN avatar_url TEXT;
        
        RAISE NOTICE '✅ avatar_url column added to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ avatar_url column already exists';
    END IF;
END $$;

-- 2. Add comment
COMMENT ON COLUMN profiles.avatar_url IS 'URL of user profile picture stored in Supabase Storage';

-- 3. Create index for faster queries (optional, useful if filtering by avatar_url)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url 
ON profiles (avatar_url) 
WHERE avatar_url IS NOT NULL;

-- 4. Verify the column
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'avatar_url';

-- 5. Check some profiles
SELECT 
    id,
    handle,
    avatar_url,
    created_at
FROM profiles
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Avatar URL column setup complete!';
  RAISE NOTICE 'ℹ️ Users can now upload profile pictures';
  RAISE NOTICE 'ℹ️ Profile pictures will be stored in Supabase Storage (artworks bucket)';
END $$;

