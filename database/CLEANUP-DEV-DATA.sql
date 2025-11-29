-- =============================================
-- 개발 데이터 정리 스크립트
-- =============================================
-- 
-- 이 스크립트는 다음을 삭제합니다:
-- 1. 종료된 챌린지 (ended, archived)
-- 2. 종료된 경매 (ended, completed)
-- 3. 테스트 작품 (선택적)
--
-- ⚠️ 주의: 삭제 전 반드시 백업하세요!
-- =============================================

-- =============================================
-- STEP 1: 현재 데이터 상태 확인
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📊 현재 데이터 상태 확인 중...';
    RAISE NOTICE '';
END $$;

-- Artworks 통계
SELECT 
    '🎨 Artworks' as category,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE sale_status = 'available') as available,
    COUNT(*) FILTER (WHERE sale_status = 'sold') as sold,
    COUNT(*) FILTER (WHERE is_hidden = true) as hidden
FROM artworks;

-- Challenges 통계
SELECT 
    '🏆 Challenges' as category,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'ended') as ended,
    COUNT(*) FILTER (WHERE status = 'archived') as archived
FROM challenges;

-- Challenge Auctions 통계 (있다면)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'challenge_auctions') THEN
        RAISE NOTICE '🎭 Challenge Auctions 테이블 존재';
        PERFORM 1;
    ELSE
        RAISE NOTICE '⚠️ Challenge Auctions 테이블 없음 (정상)';
    END IF;
END $$;

-- =============================================
-- STEP 2: 백업 테이블 생성 (선택사항)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💾 백업 테이블 생성 중...';
    RAISE NOTICE '';
END $$;

-- 종료된 챌린지 백업
CREATE TABLE IF NOT EXISTS challenges_backup AS 
SELECT * FROM challenges 
WHERE status IN ('ended', 'archived')
LIMIT 0; -- 먼저 빈 테이블 생성

TRUNCATE challenges_backup;

INSERT INTO challenges_backup
SELECT * FROM challenges 
WHERE status IN ('ended', 'archived');

-- Challenge entries 백업
CREATE TABLE IF NOT EXISTS challenge_entries_backup AS 
SELECT * FROM challenge_entries 
LIMIT 0;

TRUNCATE challenge_entries_backup;

INSERT INTO challenge_entries_backup
SELECT ce.* 
FROM challenge_entries ce
JOIN challenges c ON c.id = ce.challenge_id
WHERE c.status IN ('ended', 'archived');

-- 백업 확인
SELECT 
    '📦 백업 완료' as status,
    (SELECT COUNT(*) FROM challenges_backup) as backed_up_challenges,
    (SELECT COUNT(*) FROM challenge_entries_backup) as backed_up_entries;

-- =============================================
-- STEP 3: 종료된 Challenge Auctions 삭제 (있다면)
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'challenge_auctions') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎭 종료된 Challenge Auctions 삭제 중...';
        
        -- ended, completed 상태 삭제
        DELETE FROM challenge_auctions
        WHERE status IN ('ended', 'completed')
        AND end_date < NOW() - INTERVAL '30 days'; -- 30일 이상 지난 것만
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Challenge Auctions 삭제 완료: % 개', deleted_count;
    ELSE
        RAISE NOTICE '⚠️ Challenge Auctions 테이블 없음 (Skip)';
    END IF;
END $$;

-- =============================================
-- STEP 4: 종료된 Challenges 삭제
-- =============================================

DO $$
DECLARE
    deleted_entries INTEGER;
    deleted_challenges INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏆 종료된 Challenges 삭제 중...';
    
    -- Challenge Entries 먼저 삭제 (또는 CASCADE로 자동 삭제됨)
    DELETE FROM challenge_entries
    WHERE challenge_id IN (
        SELECT id FROM challenges 
        WHERE status IN ('ended', 'archived')
        AND end_date < NOW() - INTERVAL '7 days' -- 7일 이상 지난 것만
    );
    GET DIAGNOSTICS deleted_entries = ROW_COUNT;
    
    -- Challenges 삭제
    DELETE FROM challenges
    WHERE status IN ('ended', 'archived')
    AND end_date < NOW() - INTERVAL '7 days'; -- 7일 이상 지난 것만
    GET DIAGNOSTICS deleted_challenges = ROW_COUNT;
    
    RAISE NOTICE '✅ Challenge Entries 삭제: % 개', deleted_entries;
    RAISE NOTICE '✅ Challenges 삭제: % 개', deleted_challenges;
END $$;

-- =============================================
-- STEP 5: 테스트 작품 삭제 (선택적)
-- =============================================

DO $$
DECLARE
    deleted_artworks INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎨 테스트 작품 삭제 옵션...';
    RAISE NOTICE '⚠️ 아래 조건에 해당하는 작품만 삭제합니다:';
    RAISE NOTICE '   1. 제목에 "test", "테스트" 포함';
    RAISE NOTICE '   2. 숨김 처리된 작품 (is_hidden = true)';
    RAISE NOTICE '   3. 판매되지 않은 작품 (sale_status != sold)';
    RAISE NOTICE '';
    
    -- 주석을 제거하면 실행됩니다 (안전을 위해 기본적으로 비활성화)
    /*
    DELETE FROM artworks
    WHERE (
        -- 제목에 테스트 포함
        (title ILIKE '%test%' OR title ILIKE '%테스트%')
        -- 또는 숨김 처리된 작품
        OR is_hidden = true
    )
    AND sale_status != 'sold' -- 판매된 작품은 보존
    AND created_at < NOW() - INTERVAL '7 days'; -- 7일 이상 지난 것만
    
    GET DIAGNOSTICS deleted_artworks = ROW_COUNT;
    RAISE NOTICE '✅ 테스트 작품 삭제: % 개', deleted_artworks;
    */
    
    RAISE NOTICE '💡 테스트 작품 삭제는 비활성화되어 있습니다.';
    RAISE NOTICE '   필요시 스크립트에서 주석을 제거하세요.';
END $$;

-- =============================================
-- STEP 6: 관련 데이터 정리 (orphaned records)
-- =============================================

DO $$
DECLARE
    deleted_likes INTEGER;
    deleted_bookmarks INTEGER;
    deleted_comments INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 고아 레코드 정리 중...';
    
    -- 존재하지 않는 artwork를 참조하는 likes 삭제
    DELETE FROM likes
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_likes = ROW_COUNT;
    
    -- 존재하지 않는 artwork를 참조하는 bookmarks 삭제
    DELETE FROM bookmarks
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_bookmarks = ROW_COUNT;
    
    -- 존재하지 않는 artwork를 참조하는 comments 삭제
    DELETE FROM comments
    WHERE artwork_id NOT IN (SELECT id FROM artworks);
    GET DIAGNOSTICS deleted_comments = ROW_COUNT;
    
    RAISE NOTICE '✅ 고아 Likes 삭제: % 개', deleted_likes;
    RAISE NOTICE '✅ 고아 Bookmarks 삭제: % 개', deleted_bookmarks;
    RAISE NOTICE '✅ 고아 Comments 삭제: % 개', deleted_comments;
END $$;

-- =============================================
-- STEP 7: VACUUM (디스크 공간 회수)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧽 데이터베이스 최적화 중...';
END $$;

VACUUM ANALYZE artworks;
VACUUM ANALYZE challenges;
VACUUM ANALYZE challenge_entries;
VACUUM ANALYZE likes;
VACUUM ANALYZE bookmarks;
VACUUM ANALYZE comments;

-- =============================================
-- STEP 8: 정리 후 상태 확인
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
    pg_size_pretty(pg_total_relation_size('artworks')) as disk_size
FROM artworks
UNION ALL
SELECT 
    '🏆 Challenges',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('challenges'))
FROM challenges
UNION ALL
SELECT 
    '📝 Challenge Entries',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('challenge_entries'))
FROM challenge_entries
UNION ALL
SELECT 
    '❤️ Likes',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('likes'))
FROM likes
UNION ALL
SELECT 
    '🔖 Bookmarks',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('bookmarks'))
FROM bookmarks
UNION ALL
SELECT 
    '💬 Comments',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('comments'))
FROM comments;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 데이터 정리 완료!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 백업 테이블:';
    RAISE NOTICE '   - challenges_backup';
    RAISE NOTICE '   - challenge_entries_backup';
    RAISE NOTICE '';
    RAISE NOTICE '💡 백업을 삭제하려면:';
    RAISE NOTICE '   DROP TABLE challenges_backup;';
    RAISE NOTICE '   DROP TABLE challenge_entries_backup;';
    RAISE NOTICE '';
END $$;

