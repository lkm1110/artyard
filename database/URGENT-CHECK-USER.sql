-- ===================================
-- 긴급: 특정 사용자 프로필 확인
-- ===================================

-- 1. 해당 사용자 프로필 존재 여부 확인 (RLS 무시)
SELECT 
  id,
  handle,
  consent_agreed_at,
  created_at,
  updated_at
FROM profiles
WHERE id = '8f0b4fa9-fd7f-4e93-8595-4fae8d5970dd';

-- 2. 현재 RLS 정책 확인
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3. RLS 활성화 상태 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

