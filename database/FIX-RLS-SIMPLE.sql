-- ===================================
-- 가장 단순한 RLS 정책 (확실한 해결)
-- ===================================

-- 1. RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 제거
DROP POLICY IF EXISTS profiles_select_all ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

-- 3. 가장 단순한 정책만 적용
-- SELECT: 모든 사람이 모든 프로필을 볼 수 있음 (공개)
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
TO authenticated, anon
USING (true);

-- INSERT: 자신의 ID로만 생성 가능
CREATE POLICY "Enable insert for users based on user_id"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: 자신의 프로필만 수정 가능
CREATE POLICY "Enable update for users based on user_id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: 자신의 프로필만 삭제 가능
CREATE POLICY "Enable delete for users based on user_id"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. 확인
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual = 'true' THEN '✅ Public (Fast)'
    WHEN qual LIKE '%auth.uid() = id%' THEN '✅ Own only'
    ELSE 'Custom'
  END as type
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 완료
DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS 정책 재설정 완료';
  RAISE NOTICE '✅ SELECT: 공개 (빠름)';
  RAISE NOTICE '✅ INSERT/UPDATE/DELETE: 본인만';
  RAISE NOTICE '';
  RAISE NOTICE '앱을 재시작하고 로그인하세요!';
END $$;

