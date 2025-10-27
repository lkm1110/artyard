-- ===================================
-- 모든 RLS 완전 제거 (⚠️ 주의!)
-- ===================================
-- 
-- 경고: 이 스크립트는 모든 테이블의 RLS를 제거합니다.
-- 개발 환경에서만 사용하세요!
-- 프로덕션에서는 COMPLETE-RLS-REMOVAL.sql을 사용하세요.
--

-- 모든 테이블의 RLS 비활성화
DO $$
DECLARE
    tbl RECORD;
BEGIN
    RAISE NOTICE '⚠️ 모든 RLS 제거 중... (개발 환경 전용)';
    
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl.tablename);
            RAISE NOTICE '✅ %: RLS 비활성화', tbl.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ %: RLS 비활성화 실패 - %', tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 모든 RLS 정책 삭제
DO $$
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '🗑️ 모든 RLS 정책 삭제 중...';
    
    FOR pol IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format(
                'DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                pol.policyname, pol.schemaname, pol.tablename
            );
            RAISE NOTICE '✅ %: 정책 % 삭제', pol.tablename, pol.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ 정책 삭제 실패: %', SQLERRM;
        END;
    END LOOP;
END $$;

-- 모든 테이블에 전체 권한 부여
DO $$
DECLARE
    tbl RECORD;
BEGIN
    RAISE NOTICE '🔓 모든 테이블에 권한 부여 중...';
    
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('GRANT ALL ON public.%I TO anon', tbl.tablename);
            EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl.tablename);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.tablename);
            RAISE NOTICE '✅ %: 권한 부여', tbl.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ %: 권한 부여 실패', tbl.tablename;
        END;
    END LOOP;
END $$;

-- Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 최종 확인
SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled,
    SUM(CASE WHEN NOT rowsecurity THEN 1 ELSE 0 END) as rls_disabled
FROM pg_tables 
WHERE schemaname = 'public';

RAISE NOTICE '✨ 완료! 모든 RLS가 제거되었습니다.';
RAISE NOTICE '⚠️ 경고: 프로덕션 배포 전에 RLS를 다시 설정하세요!';

