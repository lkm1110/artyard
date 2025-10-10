-- 현재 artworks 테이블 스키마 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- price_band 관련 제약 조건 확인
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.artworks'::regclass
AND pg_get_constraintdef(oid) ILIKE '%price_band%';

-- price_band 컬럼이 있는 모든 테이블 찾기
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE column_name = 'price_band';

-- artworks 테이블 DDL 확인 (PostgreSQL 방식)
SELECT 
    'CREATE TABLE ' || schemaname||'.'||tablename || ' (' ||
    string_agg(column_name||' '||type||coalesce(' not null', ''), ', ') || ');' as ddl
FROM (
    SELECT 
        c.table_schema as schemaname,
        c.table_name as tablename,
        c.column_name,
        c.udt_name as type,
        CASE WHEN c.is_nullable = 'NO' THEN ' not null' ELSE '' END as null_constraint
    FROM information_schema.columns c 
    WHERE c.table_name = 'artworks' 
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position
) t
GROUP BY schemaname, tablename;

-- 현재 artworks 테이블의 실제 데이터 확인 (price, price_band 컬럼 상태)
SELECT 
    'Data Check' as check_type,
    COUNT(*) as total_rows,
    COUNT(price) as price_not_null,
    COUNT(price_band) as price_band_not_null
FROM artworks
LIMIT 1;

RAISE NOTICE '=== artworks 테이블 스키마 진단 완료 ===';
