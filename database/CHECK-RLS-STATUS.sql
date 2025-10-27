-- ============================================
-- CHECK RLS STATUS
-- ============================================
-- 현재 RLS 상태를 확인하는 스크립트

-- 1. 테이블별 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS 활성화됨 (문제!)'
    ELSE '✅ RLS 비활성화됨 (정상)'
  END as rls_status,
  rowsecurity as is_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('bookmarks', 'likes', 'follows', 'comments', 'artworks')
ORDER BY tablename;

-- 2. 각 테이블의 정책 개수 확인
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('bookmarks', 'likes', 'follows', 'comments', 'artworks')
GROUP BY tablename
ORDER BY tablename;

-- 3. 상세 진단
DO $$ 
DECLARE
  likes_rls BOOLEAN;
  bookmarks_rls BOOLEAN;
  follows_rls BOOLEAN;
  likes_policies INTEGER;
  bookmarks_policies INTEGER;
  follows_policies INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '🔍 RLS 상태 진단';
  RAISE NOTICE '===========================================';
  
  -- likes 테이블 확인
  SELECT rowsecurity INTO likes_rls
  FROM pg_tables
  WHERE tablename = 'likes';
  
  SELECT COUNT(*) INTO likes_policies
  FROM pg_policies
  WHERE tablename = 'likes';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 likes 테이블:';
  IF likes_rls THEN
    RAISE NOTICE '  ❌ RLS 활성화됨 (문제!)';
  ELSE
    RAISE NOTICE '  ✅ RLS 비활성화됨';
  END IF;
  RAISE NOTICE '  정책 개수: %', likes_policies;
  
  -- bookmarks 테이블 확인
  SELECT rowsecurity INTO bookmarks_rls
  FROM pg_tables
  WHERE tablename = 'bookmarks';
  
  SELECT COUNT(*) INTO bookmarks_policies
  FROM pg_policies
  WHERE tablename = 'bookmarks';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 bookmarks 테이블:';
  IF bookmarks_rls THEN
    RAISE NOTICE '  ❌ RLS 활성화됨 (문제!)';
  ELSE
    RAISE NOTICE '  ✅ RLS 비활성화됨';
  END IF;
  RAISE NOTICE '  정책 개수: %', bookmarks_policies;
  
  -- follows 테이블 확인
  SELECT rowsecurity INTO follows_rls
  FROM pg_tables
  WHERE tablename = 'follows';
  
  SELECT COUNT(*) INTO follows_policies
  FROM pg_policies
  WHERE tablename = 'follows';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 follows 테이블:';
  IF follows_rls THEN
    RAISE NOTICE '  ❌ RLS 활성화됨 (문제!)';
  ELSE
    RAISE NOTICE '  ✅ RLS 비활성화됨';
  END IF;
  RAISE NOTICE '  정책 개수: %', follows_policies;
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  
  -- 최종 판정
  IF likes_rls OR bookmarks_rls OR follows_rls THEN
    RAISE NOTICE '❌ 문제 발견!';
    RAISE NOTICE 'NUCLEAR-OPTION-DISABLE-RLS.sql을 다시 실행하세요';
  ELSE
    IF likes_policies > 0 OR bookmarks_policies > 0 OR follows_policies > 0 THEN
      RAISE NOTICE '⚠️  RLS는 비활성화되었지만 정책이 남아있음';
      RAISE NOTICE 'NUCLEAR-OPTION-DISABLE-RLS.sql을 다시 실행하세요';
    ELSE
      RAISE NOTICE '✅ 모든 것이 정상입니다!';
      RAISE NOTICE '406 에러가 사라져야 합니다';
    END IF;
  END IF;
  
  RAISE NOTICE '===========================================';
END $$;

