-- ===================================
-- 긴급: profiles 테이블 RLS 임시 비활성화
-- ===================================
-- ⚠️ 테스트 목적으로만 사용하세요!
-- ⚠️ 프로덕션에서는 RLS를 다시 활성화해야 합니다!

-- 1. 현재 RLS 상태 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. profiles 테이블의 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. 변경 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 4. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '⚠️ profiles 테이블 RLS가 비활성화되었습니다.';
  RAISE NOTICE '⚠️ 이제 모든 사용자가 모든 프로필을 읽고 쓸 수 있습니다!';
  RAISE NOTICE '⚠️ 테스트 후 반드시 RLS를 다시 활성화하세요!';
  RAISE NOTICE '📱 앱을 재시작하고 로그인을 시도하세요.';
END $$;

-- ===================================
-- RLS 다시 활성화하려면 아래 명령 실행:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ===================================

