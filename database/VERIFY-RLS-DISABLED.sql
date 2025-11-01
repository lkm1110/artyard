-- ===================================
-- RLS 비활성화 확인
-- ===================================

-- 1. RLS 상태 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS 비활성화됨 (정상)'
    WHEN rowsecurity = true THEN '❌ RLS 아직 활성화됨!'
  END as status
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. 직접 프로필 조회 테스트 (RLS 없이)
-- 이 쿼리가 즉시 결과를 반환해야 함
SELECT 
  id,
  handle,
  created_at,
  '✅ 프로필 조회 성공 (빠름)' as test_result
FROM profiles
WHERE id = '8f0b4fa9-fd7f-4e93-8595-4fae8d5970dd'
LIMIT 1;

-- 3. 전체 프로필 개수 확인 (성능 테스트)
SELECT 
  COUNT(*) as total_profiles,
  '✅ 쿼리 빠름' as performance
FROM profiles;

-- 4. 가장 최근 프로필 확인
SELECT 
  id,
  handle,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

