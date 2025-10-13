-- profiles 테이블 RLS 정책 수정 (닉네임 중복 체크 허용)

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for handle check" ON profiles;

-- 2. RLS 비활성화 (임시)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. anon, authenticated 역할에 모든 권한 부여
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- 4. RLS 재활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. 새로운 정책 생성
CREATE POLICY "Allow read access to all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 완료 메시지
SELECT 'profiles 테이블 RLS 정책 수정 완료!' as result;
