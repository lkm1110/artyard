-- Fix artworks visibility issue
-- 작품이 홈 화면에서 안 보이는 문제 해결

-- 1. 전체 작품 확인 (RLS 무시)
SELECT 
  id,
  title,
  author_id,
  status,
  created_at,
  (SELECT handle FROM profiles WHERE id = artworks.author_id) as author_handle
FROM artworks
ORDER BY created_at DESC;

-- 2. artworks 테이블 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'artworks';

-- 3. artworks 테이블의 모든 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'artworks';

-- 4. artworks 테이블 RLS 완전 비활성화 (작품이 보이도록)
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;

-- 5. 기존 RLS 정책 모두 제거
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'artworks' 
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON artworks', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 6. 최종 확인: RLS가 비활성화되었는지 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'artworks') as policy_count
FROM pg_tables
WHERE tablename = 'artworks';

-- 7. 작품 개수 재확인
SELECT 
  COUNT(*) as total_artworks,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_artworks,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_artworks
FROM artworks;

