-- Add expo_push_token column to profiles table
-- This will store the Expo Push Token for sending remote notifications

-- Add column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token 
ON profiles(expo_push_token) 
WHERE expo_push_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.expo_push_token IS 'Expo Push Notification token for remote push notifications';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'expo_push_token column added successfully!';
END $$;

