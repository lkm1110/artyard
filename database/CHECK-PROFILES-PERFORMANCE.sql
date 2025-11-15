-- ===================================
-- profiles 테이블 성능 문제 진단
-- ===================================

-- 1. 트리거 확인 (프로필 생성 시 실행되는 트리거들)
SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_statement as trigger_function,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. RLS 정책 확인 (INSERT 작업이 느린지 확인)
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression,
  CASE 
    WHEN cmd = 'INSERT' AND with_check LIKE '%EXISTS%' THEN '⚠️ SLOW: Has subquery'
    WHEN cmd = 'INSERT' AND with_check LIKE '%SELECT%' THEN '⚠️ SLOW: Has SELECT'
    WHEN cmd = 'INSERT' THEN '✅ OK'
    ELSE 'N/A'
  END as performance_impact
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3. 함수 확인 (프로필 관련 함수들)
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%profile%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- 4. 인덱스 확인
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%pkey%' THEN '✅ Primary Key'
    WHEN indexname LIKE '%unique%' THEN '✅ Unique'
    ELSE '📊 Index'
  END as index_type
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- 5. 테이블 통계 (행 수 확인)
SELECT 
  relname as table_name,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'profiles';

-- 6. 프로필 생성 테스트 (실제로 얼마나 느린지 측정)
DO $$
DECLARE
  start_time timestamptz;
  end_time timestamptz;
  duration interval;
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- 시작 시간
  start_time := clock_timestamp();
  
  -- 테스트 프로필 생성
  INSERT INTO profiles (id, handle, school, department, bio)
  VALUES (
    test_user_id,
    'test_' || substring(test_user_id::text, 1, 8),
    'Test School',
    'Test Department',
    'Test user for performance testing'
  );
  
  -- 종료 시간
  end_time := clock_timestamp();
  duration := end_time - start_time;
  
  -- 결과 출력
  RAISE NOTICE '⏱️ 프로필 생성 소요 시간: %', duration;
  RAISE NOTICE '✅ 테스트 사용자 ID: %', test_user_id;
  
  -- 성능 판정
  IF duration > interval '1 second' THEN
    RAISE WARNING '❌ 매우 느림! (1초 이상)';
    RAISE WARNING '💡 트리거나 RLS 정책을 확인하세요';
  ELSIF duration > interval '500 milliseconds' THEN
    RAISE WARNING '⚠️ 느림 (500ms 이상)';
  ELSE
    RAISE NOTICE '✅ 정상 속도';
  END IF;
  
  -- 테스트 데이터 삭제
  DELETE FROM profiles WHERE id = test_user_id;
  RAISE NOTICE '🗑️ 테스트 데이터 삭제 완료';
END $$;

-- 7. 권장 사항
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 성능 최적화 권장 사항 ===';
  RAISE NOTICE '1. 위의 트리거 목록에 복잡한 로직이 있는지 확인';
  RAISE NOTICE '2. RLS INSERT 정책에 서브쿼리가 있으면 제거';
  RAISE NOTICE '3. 프로필 생성 시간이 500ms 이상이면 최적화 필요';
  RAISE NOTICE '4. OPTIMIZE-PROFILES-RLS.sql 실행 권장';
  RAISE NOTICE '';
END $$;

