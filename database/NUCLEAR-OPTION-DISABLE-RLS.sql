-- ============================================
-- NUCLEAR OPTION: COMPLETELY DISABLE RLS
-- ============================================
-- bookmarks, likes, follows 테이블의 RLS를 완전히 제거
-- 406 에러를 완전히 박살냄

-- 1. bookmarks 테이블 RLS 완전 제거
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  -- 테이블이 존재하는지 확인
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
    RAISE NOTICE '🔨 bookmarks 테이블 발견 - RLS 제거 시작';
    
    -- 모든 정책 삭제
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = 'bookmarks'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON bookmarks', policy_record.policyname);
      RAISE NOTICE '  ✅ 정책 삭제: %', policy_record.policyname;
    END LOOP;
    
    -- RLS 비활성화
    ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS 완전히 비활성화';
  ELSE
    RAISE NOTICE '⚠️  bookmarks 테이블 없음';
  END IF;
END $$;

-- 2. likes 테이블 RLS 완전 제거
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
    RAISE NOTICE '🔨 likes 테이블 발견 - RLS 제거 시작';
    
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = 'likes'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON likes', policy_record.policyname);
      RAISE NOTICE '  ✅ 정책 삭제: %', policy_record.policyname;
    END LOOP;
    
    ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS 완전히 비활성화';
  ELSE
    RAISE NOTICE '⚠️  likes 테이블 없음';
  END IF;
END $$;

-- 3. follows 테이블 RLS 완전 제거
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
    RAISE NOTICE '🔨 follows 테이블 발견 - RLS 제거 시작';
    
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = 'follows'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON follows', policy_record.policyname);
      RAISE NOTICE '  ✅ 정책 삭제: %', policy_record.policyname;
    END LOOP;
    
    ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS 완전히 비활성화';
  ELSE
    RAISE NOTICE '⚠️  follows 테이블 없음';
  END IF;
END $$;

-- 4. comments 테이블도 공개로 (혹시 모르니까)
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    RAISE NOTICE '🔨 comments 테이블 발견 - RLS 제거 시작';
    
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = 'comments'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON comments', policy_record.policyname);
      RAISE NOTICE '  ✅ 정책 삭제: %', policy_record.policyname;
    END LOOP;
    
    ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS 완전히 비활성화';
  ELSE
    RAISE NOTICE '⚠️  comments 테이블 없음';
  END IF;
END $$;

-- 5. artworks 테이블도 공개로
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks') THEN
    RAISE NOTICE '🔨 artworks 테이블 발견 - RLS 제거 시작';
    
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = 'artworks'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON artworks', policy_record.policyname);
      RAISE NOTICE '  ✅ 정책 삭제: %', policy_record.policyname;
    END LOOP;
    
    ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS 완전히 비활성화';
  ELSE
    RAISE NOTICE '⚠️  artworks 테이블 없음';
  END IF;
END $$;

-- 6. 최종 확인
DO $$ 
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '💥 RLS 완전 제거 완료!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '제거된 테이블:';
  RAISE NOTICE '  - bookmarks';
  RAISE NOTICE '  - likes';
  RAISE NOTICE '  - follows';
  RAISE NOTICE '  - comments';
  RAISE NOTICE '  - artworks';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  주의: 프로덕션에서는 적절한 RLS 설정 필요';
  RAISE NOTICE '개발 중에는 이 상태로 사용 가능';
  RAISE NOTICE '===========================================';
END $$;

-- 7. 현재 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS 활성화'
    ELSE '✅ RLS 비활성화'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('bookmarks', 'likes', 'follows', 'comments', 'artworks')
ORDER BY tablename;

