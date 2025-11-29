-- =============================================
-- 공격적 데이터 정리 (개발 환경 전용)
-- =============================================
-- 
-- ⚠️ 경고: 이 스크립트는 많은 데이터를 삭제합니다!
-- 프로덕션에서는 절대 사용하지 마세요!
-- 
-- 삭제 대상:
-- 1. 모든 종료된 챌린지
-- 2. 모든 테스트 작품
-- 3. 판매되지 않은 오래된 작품
-- 4. 고아 레코드
-- =============================================

-- =============================================
-- 확인 메시지
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '⚠️⚠️⚠️ 공격적 정리 모드 ⚠️⚠️⚠️';
    RAISE NOTICE '';
    RAISE NOTICE '이 스크립트는 많은 데이터를 삭제합니다!';
    RAISE NOTICE '계속하려면 아래 조건을 확인하세요:';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 백업 완료';
    RAISE NOTICE '✅ 개발 환경임을 확인';
    RAISE NOTICE '✅ 프로덕션 아님을 재확인';
    RAISE NOTICE '';
    RAISE NOTICE '계속하려면 이 스크립트를 계속 실행하세요...';
    RAISE NOTICE '';
END $$;

-- =============================================
-- 1. 모든 종료된 챌린지 삭제
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '🏆 모든 종료된 챌린지 삭제 중...';
    
    DELETE FROM challenges
    WHERE status IN ('ended', 'archived');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 삭제: % 개 챌린지', deleted_count;
END $$;

-- =============================================
-- 2. 테스트 작품 완전 삭제
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎨 테스트 작품 삭제 중...';
    
    DELETE FROM artworks
    WHERE (
        -- 제목에 테스트 단어 포함
        title ILIKE '%test%' 
        OR title ILIKE '%테스트%'
        OR title ILIKE '%sample%'
        OR title ILIKE '%예시%'
        OR title ILIKE '%임시%'
        -- 설명에 테스트 포함
        OR description ILIKE '%test%'
        OR description ILIKE '%테스트%'
        -- 숨김 처리
        OR is_hidden = true
    )
    AND sale_status != 'sold'; -- 판매된 것은 유지
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 삭제: % 개 테스트 작품', deleted_count;
END $$;

-- =============================================
-- 3. 오래된 미판매 작품 삭제 (선택적)
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📅 오래된 작품 삭제 중...';
    RAISE NOTICE '   조건: 30일 이상 + 좋아요 0개 + 댓글 0개 + 미판매';
    
    DELETE FROM artworks
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND sale_status = 'available'
    AND likes_count = 0
    AND comments_count = 0;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 삭제: % 개 오래된 작품', deleted_count;
END $$;

-- =============================================
-- 4. 중복 데이터 정리
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔁 중복 데이터 정리 중...';
    
    -- 중복 likes 삭제 (같은 사용자가 같은 작품에 여러 번 좋아요)
    DELETE FROM likes a
    WHERE a.ctid < (
        SELECT MAX(b.ctid)
        FROM likes b
        WHERE a.user_id = b.user_id
        AND a.artwork_id = b.artwork_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 중복 Likes 삭제: % 개', deleted_count;
    
    -- 중복 bookmarks 삭제
    DELETE FROM bookmarks a
    WHERE a.ctid < (
        SELECT MAX(b.ctid)
        FROM bookmarks b
        WHERE a.user_id = b.user_id
        AND a.artwork_id = b.artwork_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 중복 Bookmarks 삭제: % 개', deleted_count;
    
    -- 중복 follows 삭제
    DELETE FROM follows a
    WHERE a.ctid < (
        SELECT MAX(b.ctid)
        FROM follows b
        WHERE a.follower_id = b.follower_id
        AND a.following_id = b.following_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 중복 Follows 삭제: % 개', deleted_count;
END $$;

-- =============================================
-- 5. 고아 레코드 완전 정리
-- =============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 고아 레코드 완전 정리 중...';
    
    -- Likes
    DELETE FROM likes
    WHERE artwork_id NOT IN (SELECT id FROM artworks)
    OR user_id NOT IN (SELECT id FROM profiles);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Likes: % 개', deleted_count;
    
    -- Bookmarks
    DELETE FROM bookmarks
    WHERE artwork_id NOT IN (SELECT id FROM artworks)
    OR user_id NOT IN (SELECT id FROM profiles);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Bookmarks: % 개', deleted_count;
    
    -- Comments
    DELETE FROM comments
    WHERE artwork_id NOT IN (SELECT id FROM artworks)
    OR author_id NOT IN (SELECT id FROM profiles);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Comments: % 개', deleted_count;
    
    -- Follows
    DELETE FROM follows
    WHERE follower_id NOT IN (SELECT id FROM profiles)
    OR following_id NOT IN (SELECT id FROM profiles);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Follows: % 개', deleted_count;
    
    -- Challenge Entries
    DELETE FROM challenge_entries
    WHERE challenge_id NOT IN (SELECT id FROM challenges)
    OR artwork_id NOT IN (SELECT id FROM artworks)
    OR author_id NOT IN (SELECT id FROM profiles);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 고아 Challenge Entries: % 개', deleted_count;
END $$;

-- =============================================
-- 6. 통계 재계산
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 통계 재계산 중...';
END $$;

-- Artworks 통계 업데이트
UPDATE artworks a
SET 
    likes_count = (SELECT COUNT(*) FROM likes WHERE artwork_id = a.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE artwork_id = a.id);

-- Challenges 통계 업데이트
UPDATE challenges c
SET 
    entries_count = (SELECT COUNT(*) FROM challenge_entries WHERE challenge_id = c.id),
    participants_count = (SELECT COUNT(DISTINCT author_id) FROM challenge_entries WHERE challenge_id = c.id);

DO $$
BEGIN
    RAISE NOTICE '✅ 통계 재계산 완료';
END $$;

-- =============================================
-- 7. VACUUM FULL (디스크 공간 완전 회수)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧽 데이터베이스 최적화 중... (시간이 걸릴 수 있습니다)';
END $$;

VACUUM FULL ANALYZE artworks;
VACUUM FULL ANALYZE challenges;
VACUUM FULL ANALYZE challenge_entries;
VACUUM FULL ANALYZE likes;
VACUUM FULL ANALYZE bookmarks;
VACUUM FULL ANALYZE comments;
VACUUM FULL ANALYZE follows;

-- =============================================
-- 8. 최종 통계
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✨ 정리 완료! 최종 통계:';
    RAISE NOTICE '';
END $$;

SELECT 
    'Database Summary' as report,
    (SELECT COUNT(*) FROM artworks) as artworks,
    (SELECT COUNT(*) FROM challenges) as challenges,
    (SELECT COUNT(*) FROM likes) as likes,
    (SELECT COUNT(*) FROM bookmarks) as bookmarks,
    (SELECT COUNT(*) FROM comments) as comments,
    (SELECT COUNT(*) FROM follows) as follows,
    (SELECT COUNT(*) FROM profiles) as users;

-- 디스크 사용량
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('artworks', 'challenges', 'likes', 'bookmarks', 'comments', 'follows', 'profiles')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 공격적 정리 완료!';
    RAISE NOTICE '데이터베이스가 깨끗해졌습니다.';
    RAISE NOTICE '';
END $$;

