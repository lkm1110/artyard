-- ============================================
-- CHECK ADMIN_ACTIONS TABLE SCHEMA
-- ============================================
-- admin_actions 테이블의 스키마와 제약 조건 확인

-- 1. 테이블 컬럼 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'admin_actions'
ORDER BY ordinal_position;

-- 2. CHECK 제약 조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.admin_actions'::regclass
AND contype = 'c';

-- 3. 현재 저장된 action_type 값 확인 (있다면)
SELECT DISTINCT action_type
FROM admin_actions
LIMIT 10;

