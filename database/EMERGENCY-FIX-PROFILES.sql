-- ===================================
-- 긴급 프로필 성능 수정
-- ===================================
-- 프로필 생성/조회가 30초 이상 걸리는 문제 즉시 해결

-- 1단계: 모든 RLS 정책 제거
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
        RAISE NOTICE '🗑️ 제거됨: %', policy_record.policyname;
    END LOOP;
END $$;

-- 2단계: 가장 단순한 RLS 정책만 적용
-- SELECT: 모든 프로필 공개
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
USING (true);

-- INSERT: 자신의 프로필만 생성 (단순 체크)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: 자신의 프로필만 수정 (단순 체크)
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- DELETE: 자신의 프로필만 삭제 (단순 체크)
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- 3단계: 인덱스 확인 및 생성
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- 4단계: 테이블 통계 갱신
ANALYZE profiles;

-- 5단계: 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ===== 긴급 수정 완료 =====';
  RAISE NOTICE '✅ RLS 정책: 최대한 단순화';
  RAISE NOTICE '✅ 인덱스: 추가 완료';
  RAISE NOTICE '✅ 통계: 갱신 완료';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 이제 앱을 재시작하고 다시 로그인해보세요.';
  RAISE NOTICE '⏱️  프로필 생성/조회가 1초 이내로 빨라져야 합니다.';
  RAISE NOTICE '';
END $$;

