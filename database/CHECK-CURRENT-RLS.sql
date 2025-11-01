-- ===================================
-- 현재 RLS 정책 확인
-- ===================================

-- 1. profiles 테이블의 현재 RLS 정책 확인
SELECT 
  policyname,
  cmd as operation,
  qual as condition,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. RLS가 활성화되어 있는지 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 3. 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- 4. 직접 프로필 조회 테스트 (현재 로그인한 사용자)
SELECT 
  id,
  handle,
  created_at
FROM profiles
WHERE id = '8f0b4fa9-fd7f-4e93-8595-4fae8d5970dd'
LIMIT 1;

-- 5. auth.uid() 테스트
SELECT 
  auth.uid() as current_user_id,
  (SELECT COUNT(*) FROM profiles WHERE id = auth.uid()) as profile_exists;


