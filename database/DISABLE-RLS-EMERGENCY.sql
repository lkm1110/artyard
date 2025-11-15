-- ===================================
-- 긴급: RLS 임시 비활성화
-- ===================================
-- ⚠️ 주의: 보안상 임시 조치입니다!
-- 테스트 후 반드시 다시 활성화하세요.

-- profiles 테이블 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '⚠️ profiles RLS 비활성화 완료';
  RAISE NOTICE '⚠️ 임시 조치입니다! 테스트 후 다시 활성화하세요';
  RAISE NOTICE '';
  RAISE NOTICE '앱을 다시 시작하고 로그인을 테스트하세요.';
  RAISE NOTICE '로그인이 빠르게 작동하면 RLS 정책이 문제였던 것입니다.';
END $$;

