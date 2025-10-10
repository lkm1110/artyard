-- 작품 삭제/수정을 위한 RLS 정책 수정
-- artworks 테이블의 UPDATE 정책 확인 및 수정

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Users can update their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can delete their own artworks" ON artworks;
DROP POLICY IF EXISTS "artworks_update_policy" ON artworks;
DROP POLICY IF EXISTS "artworks_delete_policy" ON artworks;

-- 새로운 UPDATE 정책 생성 (작품 수정 및 소프트 삭제)
CREATE POLICY "Users can update their own artworks" ON artworks
    FOR UPDATE USING (
        auth.uid() = author_id
    )
    WITH CHECK (
        auth.uid() = author_id
    );

-- SELECT 정책도 확인 (기존 정책이 있다면 유지)
DO $$
BEGIN
    -- SELECT 정책이 없다면 생성
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'artworks' 
        AND policyname LIKE '%select%' 
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Anyone can view non-hidden artworks" ON artworks
            FOR SELECT USING (is_hidden = false OR auth.uid() = author_id);
    END IF;
END $$;

-- INSERT 정책도 확인 (기존 정책이 있다면 유지)
DO $$
BEGIN
    -- INSERT 정책이 없다면 생성
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'artworks' 
        AND policyname LIKE '%insert%' 
        AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert their own artworks" ON artworks
            FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
END $$;

-- RLS 활성화 확인
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'artworks'
ORDER BY cmd, policyname;
