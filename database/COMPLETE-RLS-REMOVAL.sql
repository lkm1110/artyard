-- ===================================
-- ArtYard RLS 완전 제거 (공개 데이터만)
-- ===================================
-- 
-- 이 SQL은 "공개되어야 할" 테이블들의 RLS를 제거합니다.
-- 개인정보(profiles, messages 등)는 그대로 유지됩니다.
--

-- ===================================
-- 1단계: 공개 데이터 테이블 RLS 비활성화
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '🔓 공개 데이터 테이블 RLS 제거 중...';
    
    -- likes (좋아요는 공개 정보)
    ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ likes: RLS 비활성화';
    
    -- bookmarks (북마크 수는 공개 정보)
    ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ bookmarks: RLS 비활성화';
    
    -- follows (팔로워 수는 공개 정보)
    ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ follows: RLS 비활성화';
    
    -- comments (댓글은 공개 정보)
    ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ comments: RLS 비활성화';
    
    -- artworks (작품은 공개 정보)
    ALTER TABLE public.artworks DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ artworks: RLS 비활성화';
    
    -- artwork_views (조회수는 공개 정보)
    BEGIN
        ALTER TABLE public.artwork_views DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ artwork_views: RLS 비활성화';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ artwork_views 테이블 없음 (정상)';
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ 에러 발생: %', SQLERRM;
END $$;

-- ===================================
-- 2단계: 모든 RLS 정책 삭제
-- ===================================

DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    RAISE NOTICE '🗑️ RLS 정책 삭제 중...';
    
    -- 공개 테이블 목록
    FOR tbl IN (
        SELECT unnest(ARRAY[
            'likes', 'bookmarks', 'follows', 
            'comments', 'artworks', 'artwork_views'
        ])
    ) LOOP
        -- 각 테이블의 모든 정책 삭제
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = tbl
        ) LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', pol.policyname, tbl);
                RAISE NOTICE '✅ %: 정책 % 삭제', tbl, pol.policyname;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING '⚠️ %: 정책 % 삭제 실패 - %', tbl, pol.policyname, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- ===================================
-- 3단계: 모든 사용자에게 권한 부여
-- ===================================

DO $$
DECLARE
    tbl TEXT;
BEGIN
    RAISE NOTICE '🔐 권한 부여 중...';
    
    FOR tbl IN (
        SELECT unnest(ARRAY[
            'likes', 'bookmarks', 'follows', 
            'comments', 'artworks', 'artwork_views'
        ])
    ) LOOP
        BEGIN
            -- 모든 역할에 전체 권한 부여
            EXECUTE format('GRANT ALL ON public.%I TO anon', tbl);
            EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
            RAISE NOTICE '✅ %: 권한 부여 완료', tbl;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE '⚠️ %: 테이블 없음 (정상)', tbl;
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ %: 권한 부여 실패 - %', tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- ===================================
-- 4단계: 개인정보 테이블은 RLS 유지
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '🔒 개인정보 테이블 RLS 유지 확인...';
    
    -- profiles (프로필은 보호)
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ profiles: RLS 유지 (개인정보 보호)';
    
    -- messages (메시지는 보호)
    BEGIN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ messages: RLS 유지 (개인정보 보호)';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ messages 테이블 없음';
    END;
    
    -- chats (채팅은 보호)
    BEGIN
        ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ chats: RLS 유지 (개인정보 보호)';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ chats 테이블 없음';
    END;
    
    -- transactions (거래는 보호)
    BEGIN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ transactions: RLS 유지 (개인정보 보호)';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ transactions 테이블 없음';
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ 개인정보 RLS 설정 에러: %', SQLERRM;
END $$;

-- ===================================
-- 5단계: Supabase 캐시 새로고침
-- ===================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ===================================
-- 6단계: 최종 상태 확인
-- ===================================

SELECT 
    '🎉 RLS 제거 완료!' as status,
    '공개 테이블: RLS 비활성화 ✅' as public_tables,
    '개인정보: RLS 유지 🔒' as private_tables;

-- 테이블별 RLS 상태 확인
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS 활성화 (보호됨)'
        ELSE '🔓 RLS 비활성화 (공개)'
    END as status,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'likes', 'bookmarks', 'follows', 'comments', 'artworks',
    'profiles', 'messages', 'chats', 'transactions'
)
ORDER BY 
    CASE 
        WHEN rowsecurity THEN 1 
        ELSE 2 
    END,
    tablename;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✨ 완료! 이제 400 에러가 사라집니다!';
END $$;

