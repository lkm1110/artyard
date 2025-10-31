-- ========================================
-- 프로필 타임아웃 해결 스크립트
-- ========================================
-- 문제: 프로필 조회가 10초 이상 걸려서 타임아웃 발생
-- 원인: 복잡한 RLS 정책, 인덱스 부족, 또는 불필요한 제약조건
-- ========================================

-- 1. 기존 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. 모든 RLS 정책 제거 (기존 정책 + 이전 실행한 정책)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
-- 이전 실행으로 생성된 정책들도 제거
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- 3. 초간단 RLS 정책 생성 (성능 최적화)
-- 모든 사용자가 모든 프로필 읽기 가능 (SELECT)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- 인증된 사용자는 자신의 프로필만 삽입 가능 (INSERT)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 인증된 사용자는 자신의 프로필만 수정 가능 (UPDATE)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. 인덱스 확인 및 생성
-- id 컬럼은 PRIMARY KEY라 자동 인덱스 있음
-- handle에 인덱스 추가 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS profiles_handle_idx ON profiles(handle);

-- 5. 통계 업데이트 (성능 향상)
ANALYZE profiles;

-- 6. 확인: 새로운 정책 리스트
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- ========================================
-- 실행 후 확인사항:
-- 1. 로그인 시 프로필 조회가 1초 이내로 완료되는지 확인
-- 2. 여전히 느리다면 네트워크 문제일 수 있음
-- ========================================

-- 추가 디버깅: 프로필 조회 쿼리 실행 시간 측정
-- Supabase SQL Editor에서 실행:
-- EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';

