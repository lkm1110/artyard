-- Add notification_preferences column to profiles table
-- This column stores user's notification settings as JSONB

-- 1. Add notification_preferences column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_follower": true,
  "new_like": true,
  "new_comment": true,
  "purchase": true,
  "sale": true,
  "payment_received": true,
  "challenge_started": true,
  "challenge_ending_soon": true,
  "voting_started": true,
  "auction_bid": true,
  "auction_won": true,
  "auction_lost": true,
  "system_updates": true,
  "newsletter": false
}'::jsonb;

-- 2. Add comment
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences stored as JSON';

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences 
ON profiles USING gin (notification_preferences);

-- 4. Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'notification_preferences';

-- 5. Check existing profiles (should show notification_preferences with default values)
SELECT 
  id,
  handle,
  notification_preferences
FROM profiles
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ notification_preferences column added successfully!';
  RAISE NOTICE '✅ Default preferences set for all users';
  RAISE NOTICE '✅ GIN index created for performance';
END $$;

