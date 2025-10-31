-- ========================================
-- 프로필 조회 성능 진단 스크립트
-- ========================================

-- 1. profiles 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. profiles 테이블의 모든 인덱스 확인
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- 3. profiles 테이블의 모든 트리거 확인
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 4. profiles 테이블의 외래 키 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 5. 현재 RLS 정책 재확인
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
WHERE tablename = 'profiles';

-- 6. 프로필 조회 쿼리 실행 계획 분석 (특정 사용자 ID로 테스트)
-- 아래 'YOUR_USER_ID'를 실제 사용자 ID로 교체하여 실행하세요
-- EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';

-- 7. profiles 테이블 통계 정보
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'profiles';

-- ========================================
-- 해결 방안:
-- ========================================

-- 만약 트리거가 많으면 임시로 비활성화:
-- ALTER TABLE profiles DISABLE TRIGGER ALL;
-- (테스트 후 반드시 다시 활성화: ALTER TABLE profiles ENABLE TRIGGER ALL;)

-- 만약 dead_rows가 많으면 VACUUM 실행:
-- VACUUM ANALYZE profiles;

-- 만약 인덱스가 없으면 생성:
-- CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
-- (하지만 id는 PRIMARY KEY라 자동으로 인덱스가 있어야 함)

