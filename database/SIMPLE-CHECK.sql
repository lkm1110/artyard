-- ===================================
-- 간단한 스키마 확인 (에러 없는 버전)
-- ===================================

-- 1. transactions 테이블이 존재하는가?
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) AS transactions_exists;

-- 2. transactions 테이블의 컬럼 목록
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 3. likes 테이블이 존재하는가?
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'likes'
    ) AS likes_exists;

-- 4. likes 테이블의 컬럼 목록
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'likes'
ORDER BY ordinal_position;

-- 5. bookmarks 테이블이 존재하는가?
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'bookmarks'
    ) AS bookmarks_exists;

-- 6. bookmarks 테이블의 컬럼 목록
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'bookmarks'
ORDER BY ordinal_position;

-- 7. settlements 테이블이 존재하는가?
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'settlements'
    ) AS settlements_exists;

-- 8. settlements 테이블의 컬럼 목록
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'settlements'
ORDER BY ordinal_position;

-- 9. 모든 public 테이블 목록 (간단히)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

