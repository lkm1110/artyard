-- ===================================
-- 관리자용 RLS 정책 추가
-- ===================================

-- 1. transactions 테이블: 관리자는 모든 거래 조회 가능
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- 2. transactions 테이블: 관리자는 모든 거래 수정 가능
CREATE POLICY "Admins can update all transactions" ON public.transactions
FOR UPDATE USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- 3. likes 테이블: RLS 완전 비활성화 (이미 시도했지만 재확인)
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;

-- 4. bookmarks 테이블: RLS 완전 비활성화
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;

-- 5. follows 테이블: RLS 완전 비활성화
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- 6. Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 확인 쿼리
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    p.polname AS policy_name,
    CASE p.polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'transactions'
ORDER BY p.polname;

