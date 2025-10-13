-- ====================================================
-- 모든 RLS 정책 완전 해제 (임시 해결)
-- ====================================================

-- 🚨 Likes 테이블 RLS 완전 비활성화
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select_policy" ON likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON likes;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON likes;

-- 🚨 Bookmarks 테이블 RLS 완전 비활성화  
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_policy" ON bookmarks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bookmarks;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON bookmarks;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON bookmarks;

-- 🚨 Follows 테이블 RLS 완전 비활성화
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select_policy" ON follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
DROP POLICY IF EXISTS "follows_delete_policy" ON follows;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON follows;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON follows;
DROP POLICY IF EXISTS "Enable delete for users based on follower_id" ON follows;

-- 🚀 모든 권한 부여
GRANT ALL ON likes TO anon, authenticated;
GRANT ALL ON bookmarks TO anon, authenticated;
GRANT ALL ON follows TO anon, authenticated;

-- 🔍 확인용 쿼리
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('likes', 'bookmarks', 'follows')
ORDER BY tablename;

-- 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('likes', 'bookmarks', 'follows')
ORDER BY tablename, policyname;

COMMIT;
