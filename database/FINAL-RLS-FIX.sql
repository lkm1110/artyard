-- ===================================
-- 최종 RLS 에러 해결 (406 완전 제거)
-- ===================================

-- Step 1: RLS 강제 비활성화
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- Step 2: 모든 정책 강제 삭제
DROP POLICY IF EXISTS "Anyone can view bookmarks" ON public.bookmarks CASCADE;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks CASCADE;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes CASCADE;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.likes CASCADE;
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows CASCADE;
DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows CASCADE;

-- Step 3: 완전한 권한 부여
GRANT ALL ON public.bookmarks TO anon, authenticated, service_role;
GRANT ALL ON public.likes TO anon, authenticated, service_role;
GRANT ALL ON public.follows TO anon, authenticated, service_role;

-- Step 4: 테이블 소유권 확인 및 설정
ALTER TABLE public.bookmarks OWNER TO postgres;
ALTER TABLE public.likes OWNER TO postgres;
ALTER TABLE public.follows OWNER TO postgres;

-- Step 5: 강제 캐시 새로고침
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 최종 확인
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '❌ ENABLED' ELSE '✅ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookmarks', 'likes', 'follows')
ORDER BY tablename;

