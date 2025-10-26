-- ===================================
-- RLS 강제 비활성화 (최종 버전)
-- 이전 스크립트가 안먹혔다면 이걸 시도
-- ===================================

-- Step 1: 테이블 존재 확인
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking tables...';
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookmarks') THEN
        RAISE NOTICE '✅ bookmarks table exists';
    ELSE
        RAISE WARNING '❌ bookmarks table NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
        RAISE NOTICE '✅ likes table exists';
    ELSE
        RAISE WARNING '❌ likes table NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        RAISE NOTICE '✅ follows table exists';
    ELSE
        RAISE WARNING '❌ follows table NOT found';
    END IF;
END $$;

-- Step 2: 각 테이블별로 개별 처리
DO $$
BEGIN
    -- bookmarks
    BEGIN
        ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS disabled for bookmarks';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ bookmarks: %', SQLERRM;
    END;
    
    -- likes
    BEGIN
        ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS disabled for likes';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ likes: %', SQLERRM;
    END;
    
    -- follows
    BEGIN
        ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS disabled for follows';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ follows: %', SQLERRM;
    END;
END $$;

-- Step 3: 정책 삭제 (있다면)
DO $$
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '🗑️ Dropping policies...';
    
    -- bookmarks policies
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'bookmarks'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.bookmarks', pol.policyname);
            RAISE NOTICE '✅ Dropped: bookmarks.%', pol.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ Failed to drop bookmarks.%: %', pol.policyname, SQLERRM;
        END;
    END LOOP;
    
    -- likes policies
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'likes'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.likes', pol.policyname);
            RAISE NOTICE '✅ Dropped: likes.%', pol.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ Failed to drop likes.%: %', pol.policyname, SQLERRM;
        END;
    END LOOP;
    
    -- follows policies
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'follows'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.follows', pol.policyname);
            RAISE NOTICE '✅ Dropped: follows.%', pol.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ Failed to drop follows.%: %', pol.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: 권한 부여
DO $$
BEGIN
    RAISE NOTICE '🔐 Granting permissions...';
    
    BEGIN
        GRANT ALL ON public.bookmarks TO anon;
        GRANT ALL ON public.bookmarks TO authenticated;
        GRANT ALL ON public.bookmarks TO service_role;
        RAISE NOTICE '✅ Permissions granted for bookmarks';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ bookmarks permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT ALL ON public.likes TO anon;
        GRANT ALL ON public.likes TO authenticated;
        GRANT ALL ON public.likes TO service_role;
        RAISE NOTICE '✅ Permissions granted for likes';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ likes permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT ALL ON public.follows TO anon;
        GRANT ALL ON public.follows TO authenticated;
        GRANT ALL ON public.follows TO service_role;
        RAISE NOTICE '✅ Permissions granted for follows';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '⚠️ follows permissions: %', SQLERRM;
    END;
END $$;

-- Step 5: 현재 상태 확인
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ ENABLED (문제!)' 
        ELSE '✅ DISABLED (정상)' 
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookmarks', 'likes', 'follows')
ORDER BY tablename;

-- 실행 후 결과를 확인하세요!

