-- ===================================
-- profiles 테이블 RLS 정책 최적화
-- ===================================
-- 프로필 조회가 느린 문제를 해결합니다.
-- 복잡한 RLS 정책을 단순화하여 성능을 개선합니다.

-- 1. 현재 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. 기존 RLS 정책 모두 제거
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
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. RLS 활성화 유지
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. 최적화된 RLS 정책 생성

-- ✅ SELECT: 모든 사람이 모든 프로필을 볼 수 있음 (공개 프로필)
-- 가장 단순한 정책 - 성능 최고
CREATE POLICY "profiles_select_all"
ON profiles
FOR SELECT
USING (true);

-- ✅ INSERT: 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "profiles_insert_own"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ✅ UPDATE: 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ✅ UPDATE: 관리자는 모든 프로필 수정 가능
CREATE POLICY "profiles_update_admin"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- ✅ DELETE: 사용자는 자신의 프로필만 삭제 가능
CREATE POLICY "profiles_delete_own"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- 5. 인덱스 확인 및 생성 (성능 최적화)

-- profiles.id는 이미 primary key이므로 인덱스 있음
-- handle 검색을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- 6. 최종 확인
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual = 'true' THEN '✅ Public (Fast)'
    WHEN qual LIKE '%auth.uid() = id%' THEN '✅ Own Profile'
    WHEN qual LIKE '%is_admin%' THEN '✅ Admin Only'
    ELSE 'Custom'
  END as access_type
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ profiles 테이블 RLS 정책이 최적화되었습니다.';
  RAISE NOTICE '✅ SELECT 정책: 모든 프로필 공개 (true) - 가장 빠른 정책';
  RAISE NOTICE '✅ INSERT/UPDATE/DELETE: 본인 프로필만 가능';
  RAISE NOTICE '✅ 인덱스 추가: handle';
  RAISE NOTICE '⚠️  앱을 재시작하고 다시 로그인해주세요.';
END $$;

