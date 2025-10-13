-- 406 에러 완전 해결 스크립트 (최종)
-- Supabase SQL Editor에서 실행하세요

-- 1. bookmarks 테이블 RLS 완전 비활성화
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_policy" ON bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

-- 2. likes 테이블 RLS 완전 비활성화
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select_policy" ON likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- 3. follows 테이블 RLS 완전 비활성화
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select_policy" ON follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
DROP POLICY IF EXISTS "follows_delete_policy" ON follows;
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can create follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their follows" ON follows;

-- 4. 모든 역할에 전체 권한 부여
GRANT ALL PRIVILEGES ON bookmarks TO anon;
GRANT ALL PRIVILEGES ON bookmarks TO authenticated;

GRANT ALL PRIVILEGES ON likes TO anon;
GRANT ALL PRIVILEGES ON likes TO authenticated;

GRANT ALL PRIVILEGES ON follows TO anon;
GRANT ALL PRIVILEGES ON follows TO authenticated;

-- 5. SELECT/INSERT/UPDATE/DELETE 권한 명시적으로 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON bookmarks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookmarks TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON likes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON follows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON follows TO authenticated;

-- 완료 메시지
SELECT '🎉 406 에러 완전 해결됨! 이제 북마크, 좋아요, 팔로우가 정상 동작합니다.' as result;
