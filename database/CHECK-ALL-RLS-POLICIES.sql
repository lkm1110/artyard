-- Check all RLS policies across all tables
-- 모든 테이블의 RLS 정책 확인

-- ============================================
-- 1. 모든 테이블의 RLS 활성화 상태 확인
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE tablename = pg_tables.tablename 
     AND schemaname = pg_tables.schemaname
  ) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. 모든 RLS 정책 상세 정보 (테이블별)
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. RLS가 활성화되었지만 정책이 없는 테이블 (위험!)
-- ============================================
SELECT 
  t.schemaname,
  t.tablename,
  t.rowsecurity as rls_enabled
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_policies p 
    WHERE p.tablename = t.tablename 
      AND p.schemaname = t.schemaname
  )
ORDER BY t.tablename;

-- ============================================
-- 4. 테이블별 RLS 정책 개수 요약
-- ============================================
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(p.policyname, ', ') as policy_names
FROM pg_tables t
LEFT JOIN pg_policies p 
  ON t.tablename = p.tablename 
  AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ============================================
-- 5. 주요 테이블별 RLS 상태 (간단한 버전)
-- ============================================
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS 활성화'
    ELSE '❌ RLS 비활성화'
  END as rls_status,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE tablename = pg_tables.tablename 
     AND schemaname = 'public'
  ) as "정책 개수"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'artworks',
    'likes',
    'bookmarks',
    'follows',
    'comments',
    'messages',
    'chats',
    'transactions',
    'reviews',
    'challenges',
    'challenge_entries'
  )
ORDER BY tablename;

-- ============================================
-- 6. 각 테이블의 작업별(SELECT/INSERT/UPDATE/DELETE) 정책 확인
-- ============================================
SELECT 
  tablename,
  cmd as operation,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- ============================================
-- 7. 관리자 권한이 필요한 정책들
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as condition
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
ORDER BY tablename, policyname;

-- ============================================
-- 8. 공개 접근(public access) 정책들
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as condition
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true'
ORDER BY tablename, policyname;

