-- ===================================
-- profiles 테이블 RLS 정책 확인
-- ===================================
-- 현재 적용된 RLS 정책을 확인합니다.

-- 1. 현재 RLS 정책 상세 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 2. 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- 3. 테이블 통계 확인
SELECT 
  schemaname,
  relname as table_name,
  n_live_tup as row_count,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'profiles';

