-- Add consent fields to profiles table for legal compliance
-- 개인정보보호법, 정보통신망법 준수를 위한 동의 필드 추가

-- 1. Add consent columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS consent_terms_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_privacy_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_overseas_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_age_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_marketing_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_ip_address TEXT;

-- 2. Add comments for documentation
COMMENT ON COLUMN profiles.consent_terms_agreed IS '[필수] 이용약관 동의';
COMMENT ON COLUMN profiles.consent_privacy_agreed IS '[필수] 개인정보 수집·이용 동의';
COMMENT ON COLUMN profiles.consent_overseas_agreed IS '[필수] 개인정보 국외 이전 동의 (Supabase - 미국)';
COMMENT ON COLUMN profiles.consent_age_confirmed IS '[필수] 만 14세 이상 확인';
COMMENT ON COLUMN profiles.consent_marketing_agreed IS '[선택] 마케팅 수신 동의';
COMMENT ON COLUMN profiles.consent_agreed_at IS '동의 완료 시각 (증빙용)';
COMMENT ON COLUMN profiles.consent_ip_address IS '동의 시 IP 주소 (증빙용, 선택)';

-- 3. Create index for consent check queries
CREATE INDEX IF NOT EXISTS idx_profiles_consent_agreed_at 
  ON profiles(consent_agreed_at);

-- 4. Create a view for users without consent (for migration)
CREATE OR REPLACE VIEW users_without_consent AS
SELECT 
  id,
  created_at,
  consent_agreed_at,
  CASE 
    WHEN consent_agreed_at IS NULL THEN '동의 필요'
    ELSE '동의 완료'
  END AS consent_status
FROM profiles
WHERE consent_agreed_at IS NULL;

-- 5. Add RLS policy for consent data (only user can see their own consent)
DROP POLICY IF EXISTS "Users can view their own consent data" ON profiles;
CREATE POLICY "Users can view their own consent data"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 6. Show statistics
DO $$
DECLARE
  total_users INT;
  users_with_consent INT;
  users_without_consent INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO users_with_consent FROM profiles WHERE consent_agreed_at IS NOT NULL;
  SELECT COUNT(*) INTO users_without_consent FROM profiles WHERE consent_agreed_at IS NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Consent Migration Statistics';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total Users: %', total_users;
  RAISE NOTICE 'Users WITH consent: %', users_with_consent;
  RAISE NOTICE 'Users WITHOUT consent: % (동의 화면 필요)', users_without_consent;
  RAISE NOTICE '===========================================';
  
  IF users_without_consent > 0 THEN
    RAISE NOTICE '⚠️  % users need to complete consent process', users_without_consent;
    RAISE NOTICE '앱 실행 시 ConsentScreen이 자동으로 표시됩니다.';
  END IF;
END $$;

-- 7. (Optional) For testing: Mark all existing users as needing consent
-- Uncomment if you want to force all users to go through consent screen
-- UPDATE profiles SET consent_agreed_at = NULL WHERE consent_agreed_at IS NULL;

