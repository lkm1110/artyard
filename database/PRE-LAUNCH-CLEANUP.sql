-- =============================================
-- 🚀 출시 준비 데이터 정리
-- =============================================
-- 
-- 작업 내용:
-- 1. "Market scene" 작품만 남기고 모든 artworks 삭제
-- 2. 모든 challenges 삭제
-- 3. 모든 auctions 삭제 (있다면)
-- 4. 관련 고아 데이터 정리
-- 
-- ⚠️ 실행 전 확인:
-- ✅ 백업 완료
-- ✅ "Market scene" 작품 ID 확인
-- =============================================

-- =============================================
-- STEP 0: 사전 확인
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 출시 준비 데이터 정리 시작!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ 이 스크립트는 다음을 삭제합니다:';
    RAISE NOTICE '   - Market scene 외 모든 작품';
    RAISE NOTICE '   - 모든 챌린지';
    RAISE NOTICE '   - 모든 경매';
    RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 1: 현재 상태 확인
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📊 현재 데이터 상태:';
    RAISE NOTICE '';
END $$;

-- Artworks 통계
SELECT 
    '🎨 Artworks' as category,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE title = 'Market scene') as market_scene_count,
    COUNT(*) FILTER (WHERE title != 'Market scene') as to_be_deleted
FROM artworks;

-- Challenges 통계
SELECT 
    '🏆 Challenges' as category,
    COUNT(*) as total,
    COUNT(*) as to_be_deleted
FROM challenges;

-- Challenge Auctions (있다면)
DO $$
DECLARE
    auction_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'challenge_auctions') THEN
        SELECT COUNT(*) INTO auction_count FROM challenge_auctions;
        RAISE NOTICE '🎭 Challenge Auctions: % 개 (모두 삭제 예정)', auction_count;
    ELSE
        RAISE NOTICE '🎭 Challenge Auctions: 테이블 없음';
    END IF;
END $$;

-- =============================================
-- STEP 2: 백업 생성
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💾 백업 생성 중...';
    RAISE NOTICE '';
END $$;

-- Artworks 백업 (Market scene 제외한 모든 작품)
DROP TABLE IF EXISTS artworks_pre_launch_backup CASCADE;
CREATE TABLE artworks_pre_launch_backup AS 
SELECT * FROM artworks 
WHERE title != 'Market scene';

-- Challenges 백업
DROP TABLE IF EXISTS challenges_pre_launch_backup CASCADE;
CREATE TABLE challenges_pre_launch_backup AS 
SELECT * FROM challenges;

-- Challenge Entries 백업
DROP TABLE IF EXISTS challenge_entries_pre_launch_backup CASCADE;
CREATE TABLE challenge_entries_pre_launch_backup AS 
SELECT * FROM challenge_entries;

-- 백업 완료 확인
SELECT 
    '📦 백업 완료' as status,
    (SELECT COUNT(*) FROM artworks_pre_launch_backup) as backed_up_artworks,
    (SELECT COUNT(*) FROM challenges_pre_launch_backup) as backed_up_challenges,
    (SELECT COUNT(*) FROM challenge_entries_pre_launch_backup) as backed_up_entries;

-- =============================================
-- STEP 3: Challenge Auctions 삭제 (있다면)
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'challenge_auctions') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎭 Challenge Auctions 삭제 중...';
        
        DELETE FROM challenge_auctions;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RAISE NOTICE '✅ 삭제 완료: % 개', deleted_count;
    END IF;
END $$;

-- =============================================
-- STEP 4: Challenges 완전 삭제
-- =============================================

DO $$
DECLARE
    deleted_entries INTEGER;
    deleted_challenges INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏆 Challenges 삭제 중...';
    
    -- Challenge Entries 먼저 삭제
    DELETE FROM challenge_entries;
    GET DIAGNOSTICS deleted_entries = ROW_COUNT;
    RAISE NOTICE '✅ Challenge Entries 삭제: % 개', deleted_entries;
    
    -- Challenges 삭제
    DELETE FROM challenges;
    GET DIAGNOSTICS deleted_challenges = ROW_COUNT;
    RAISE NOTICE '✅ Challenges 삭제: % 개', deleted_challenges;
END $$;

-- =============================================
-- STEP 5: 거래 데이터 정리 (Foreign Key 대응)
-- =============================================

DO $$
DECLARE
    market_scene_id UUID;
    deleted_transactions INTEGER;
    deleted_reviews INTEGER;
    deleted_payouts INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💳 거래 데이터 정리 중...';
    
    -- Market scene ID 확인
    SELECT id INTO market_scene_id
    FROM artworks 
    WHERE title = 'Market scene'
    LIMIT 1;
    
    IF market_scene_id IS NULL THEN
        RAISE WARNING '⚠️ Market scene을 찾을 수 없습니다!';
        RAISE WARNING '   스크립트를 중단합니다.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Market scene ID: %', market_scene_id;
    RAISE NOTICE '';
    
    -- Transactions 관련 데이터 삭제
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transaction_reviews') THEN
        DELETE FROM transaction_reviews
        WHERE transaction_id IN (
            SELECT id FROM transactions 
            WHERE artwork_id != market_scene_id
        );
        GET DIAGNOSTICS deleted_reviews = ROW_COUNT;
        RAISE NOTICE '✅ Transaction Reviews 삭제: % 개', deleted_reviews;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'payouts') THEN
        DELETE FROM payouts
        WHERE transaction_id IN (
            SELECT id FROM transactions 
            WHERE artwork_id != market_scene_id
        );
        GET DIAGNOSTICS deleted_payouts = ROW_COUNT;
        RAISE NOTICE '✅ Payouts 삭제: % 개', deleted_payouts;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transaction_history') THEN
        DELETE FROM transaction_history
        WHERE transaction_id IN (
            SELECT id FROM transactions 
            WHERE artwork_id != market_scene_id
        );
    END IF;
    
    -- Market scene 외 모든 거래 삭제
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transactions') THEN
        DELETE FROM transactions
        WHERE artwork_id != market_scene_id;
        GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
        RAISE NOTICE '✅ Transactions 삭제: % 개', deleted_transactions;
    END IF;
    
    RAISE NOTICE '✅ 거래 데이터 정리 완료';
END $$;

-- =============================================
-- STEP 6: Artworks 삭제 (Market scene 제외)
-- =============================================

DO $$
DECLARE
    market_scene_id UUID;
    deleted_artworks INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎨 Artworks 삭제 중...';
    RAISE NOTICE '   보존: Market scene';
    RAISE NOTICE '';
    
    -- Market scene ID 확인
    SELECT id INTO market_scene_id
    FROM artworks 
    WHERE title = 'Market scene'
    LIMIT 1;
    
    IF market_scene_id IS NOT NULL THEN
        RAISE NOTICE '✅ Market scene 발견: %', market_scene_id;
        RAISE NOTICE '   이 작품은 삭제하지 않습니다.';
    ELSE
        RAISE WARNING '⚠️ Market scene을 찾을 수 없습니다!';
        RAISE WARNING '   스크립트를 중단합니다.';
        RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ 다른 모든 작품 삭제 중...';
    
    -- Market scene 외 모든 작품 삭제 (이제 Foreign Key 문제 없음)
    DELETE FROM artworks
    WHERE title != 'Market scene';
    GET DIAGNOSTICS deleted_artworks = ROW_COUNT;
    
    RAISE NOTICE '✅ 삭제 완료: % 개 작품', deleted_artworks;
    RAISE NOTICE '✅ 보존됨: Market scene';
END $$;

-- =============================================
-- STEP 7: 관련 데이터 정리
-- =============================================

DO $$
DECLARE
    deleted_likes INTEGER;
    deleted_bookmarks INTEGER;
    deleted_comments INTEGER;
    deleted_views INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 고아 레코드 정리 중...';
    
    -- 존재하지 않는 artwork를 참조하는 데이터 삭제
    
    -- Likes
    DELETE FROM likes
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_likes = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Likes: % 개 삭제', deleted_likes;
    
    -- Bookmarks
    DELETE FROM bookmarks
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_bookmarks = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Bookmarks: % 개 삭제', deleted_bookmarks;
    
    -- Comments
    DELETE FROM comments
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_comments = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Comments: % 개 삭제', deleted_comments;
    
    -- Artwork Views (있다면)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'artwork_views') THEN
        DELETE FROM artwork_views
        WHERE artwork_id NOT IN (SELECT id FROM artworks);
        GET DIAGNOSTICS deleted_views = ROW_COUNT;
        RAISE NOTICE '✅ 고아 Views: % 개 삭제', deleted_views;
    END IF;
    
END $$;

-- =============================================
-- STEP 8: Market scene 통계 업데이트
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Market scene 통계 업데이트 중...';
END $$;

-- Market scene의 likes, comments 카운트 재계산
UPDATE artworks
SET 
    likes_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE artwork_id = artworks.id
    ),
    comments_count = (
        SELECT COUNT(*) 
        FROM comments 
        WHERE artwork_id = artworks.id
    )
WHERE title = 'Market scene';

DO $$
DECLARE
    updated_likes INTEGER;
    updated_comments INTEGER;
BEGIN
    SELECT likes_count, comments_count 
    INTO updated_likes, updated_comments
    FROM artworks 
    WHERE title = 'Market scene';
    
    RAISE NOTICE '✅ Market scene 통계 업데이트 완료';
    RAISE NOTICE '   Likes: %', updated_likes;
    RAISE NOTICE '   Comments: %', updated_comments;
END $$;

-- =============================================
-- STEP 9: 통계 업데이트 (ANALYZE)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 데이터베이스 통계 업데이트 중...';
END $$;

-- ANALYZE만 실행 (VACUUM은 Supabase에서 자동으로 처리됨)
ANALYZE artworks;
ANALYZE challenges;
ANALYZE challenge_entries;
ANALYZE likes;
ANALYZE bookmarks;
ANALYZE comments;

DO $$
BEGIN
    RAISE NOTICE '✅ 통계 업데이트 완료';
    RAISE NOTICE '';
    RAISE NOTICE '💡 참고: VACUUM은 Supabase가 자동으로 관리합니다.';
    RAISE NOTICE '   수동 실행이 필요하면 psql 또는 pgAdmin을 사용하세요.';
END $$;

-- =============================================
-- STEP 10: 최종 상태 확인
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✨ 정리 완료! 최종 상태:';
    RAISE NOTICE '';
END $$;

-- 최종 통계
SELECT 
    '🎨 Artworks' as category,
    COUNT(*) as total,
    STRING_AGG(title, ', ') as remaining_artworks
FROM artworks
UNION ALL
SELECT 
    '🏆 Challenges',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '없음' ELSE CAST(COUNT(*) AS TEXT) END
FROM challenges
UNION ALL
SELECT 
    '❤️ Likes',
    COUNT(*),
    '(Market scene 관련)'
FROM likes
UNION ALL
SELECT 
    '🔖 Bookmarks',
    COUNT(*),
    '(Market scene 관련)'
FROM bookmarks
UNION ALL
SELECT 
    '💬 Comments',
    COUNT(*),
    '(Market scene 관련)'
FROM comments;

-- Market scene 상세 정보
SELECT 
    '📋 Market scene 상세' as info,
    title,
    author_id,
    sale_status,
    likes_count,
    comments_count,
    created_at
FROM artworks
WHERE title = 'Market scene';

-- 디스크 사용량
SELECT 
    '💾 데이터베이스 크기' as category,
    pg_size_pretty(pg_database_size(current_database())) as size;

-- =============================================
-- STEP 11: 백업 안내
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 출시 준비 정리 완료!';
    RAISE NOTICE '';
    RAISE NOTICE '📦 백업 테이블:';
    RAISE NOTICE '   - artworks_pre_launch_backup';
    RAISE NOTICE '   - challenges_pre_launch_backup';
    RAISE NOTICE '   - challenge_entries_pre_launch_backup';
    RAISE NOTICE '';
    RAISE NOTICE '💡 백업을 삭제하려면:';
    RAISE NOTICE '   DROP TABLE artworks_pre_launch_backup;';
    RAISE NOTICE '   DROP TABLE challenges_pre_launch_backup;';
    RAISE NOTICE '   DROP TABLE challenge_entries_pre_launch_backup;';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 출시 준비가 완료되었습니다!';
    RAISE NOTICE '';
END $$;

