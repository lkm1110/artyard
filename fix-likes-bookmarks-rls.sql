-- likes 및 bookmarks 테이블 RLS 정책 수정
-- 406 Not Acceptable 오류 해결

-- likes 테이블 RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
DROP POLICY IF EXISTS "likes_select_policy" ON likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON likes;

-- 새로운 likes 정책 생성
CREATE POLICY "Anyone can view likes" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- bookmarks 테이블 RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view all bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_policy" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_policy" ON bookmarks;

-- 새로운 bookmarks 정책 생성
CREATE POLICY "Anyone can view bookmarks" ON bookmarks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS 활성화
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('likes', 'bookmarks')
ORDER BY tablename, cmd, policyname;

