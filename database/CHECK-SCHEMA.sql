-- ===================================
-- 현재 데이터베이스 스키마 확인
-- ===================================

-- 1. transactions 테이블 컬럼 확인
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 2. likes 테이블 확인
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'likes'
ORDER BY ordinal_position;

-- 3. bookmarks 테이블 확인
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookmarks'
ORDER BY ordinal_position;

-- 4. settlements 테이블 확인
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'settlements'
ORDER BY ordinal_position;

-- 5. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN relrowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END AS rls_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('transactions', 'likes', 'bookmarks', 'settlements')
ORDER BY c.relname;

-- 6. 각 테이블의 RLS 정책 확인
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
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'likes', 'bookmarks', 'settlements')
ORDER BY tablename, policyname;

