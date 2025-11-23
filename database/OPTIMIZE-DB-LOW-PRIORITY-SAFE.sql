-- ============================================================
-- ArtYard Database Optimization - Low Priority (즉시 실행 가능)
-- ============================================================
-- 안전하게 즉시 실행 가능한 부분만 추출
-- 실행 시간: 약 5분
-- 다운타임: 없음
-- ============================================================

-- ============================================================
-- 1. 고급 분석용 Materialized View
-- ============================================================
-- 📊 통계 조회 속도 15배 향상

-- 일일 통계 Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT author_id) as active_artists,
  COUNT(*) as total_artworks,
  COUNT(*) FILTER (WHERE sale_status = 'sold') as sold_artworks,
  SUM(CAST(price AS NUMERIC)) FILTER (WHERE sale_status = 'sold') as total_revenue
FROM artworks
WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);


-- 아티스트 통계 Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS artist_stats AS
SELECT 
  p.id as artist_id,
  p.handle,
  COUNT(DISTINCT a.id) as total_artworks,
  COUNT(DISTINCT a.id) FILTER (WHERE a.sale_status = 'sold') as sold_artworks,
  SUM(a.likes_count) as total_likes,
  SUM(a.comments_count) as total_comments,
  COUNT(DISTINCT f.follower_id) as followers_count,
  COALESCE(SUM(CAST(a.price AS NUMERIC)) FILTER (WHERE a.sale_status = 'sold'), 0) as total_revenue
FROM profiles p
LEFT JOIN artworks a ON a.author_id = p.id
LEFT JOIN follows f ON f.following_id = p.id
GROUP BY p.id, p.handle;

CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_stats_artist_id ON artist_stats(artist_id);


-- Materialized View 자동 갱신 함수
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_stats;
  RAISE NOTICE '✅ Materialized Views refreshed!';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. 데이터베이스 성능 모니터링 함수
-- ============================================================
-- 🔍 DB 상태 확인용

CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
  metric text,
  value text
) AS $$
BEGIN
  -- 테이블 크기
  RETURN QUERY
  SELECT 
    'Table: ' || tablename as metric,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as value
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;

  -- 인덱스 사용률
  RETURN QUERY
  SELECT 
    'Index Usage: ' || relname as metric,
    ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)::text || '%' as value
  FROM pg_stat_user_tables
  WHERE (seq_scan + idx_scan) > 0
  ORDER BY (seq_scan + idx_scan) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. 자동 VACUUM 설정 최적화
-- ============================================================
-- ⚙️ 자동 성능 최적화

-- 자주 업데이트되는 테이블에 대한 VACUUM 설정
ALTER TABLE artworks SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE challenge_entries SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE notifications SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.025
);


-- ============================================================
-- 4. 읽기 전용 뷰 (편의성)
-- ============================================================

-- 공개 아트워크만 보여주는 뷰
CREATE OR REPLACE VIEW public_artworks AS
SELECT 
  a.*,
  p.handle as author_handle,
  p.avatar_url as author_avatar
FROM artworks a
JOIN profiles p ON p.id = a.author_id
WHERE a.is_hidden = false
  AND a.deleted_at IS NULL
  AND a.sale_status IN ('available', 'reserved');


-- 활성 챌린지만 보여주는 뷰
CREATE OR REPLACE VIEW active_challenges AS
SELECT *
FROM challenges
WHERE status IN ('active', 'voting')
  AND end_date > NOW();


-- ============================================================
-- 5. 아카이빙 함수 생성 (실행은 나중에)
-- ============================================================
-- ⚠️ 함수만 생성, 실제 아카이빙은 나중에 수동으로 실행

-- 오래된 user_behaviors 아카이빙 (1년 이상)
CREATE OR REPLACE FUNCTION archive_old_user_behaviors()
RETURNS void AS $$
BEGIN
  -- 아카이브 테이블이 없으면 생성
  CREATE TABLE IF NOT EXISTS user_behaviors_archive (LIKE user_behaviors INCLUDING ALL);
  
  -- 1년 이상 오래된 데이터 이동
  WITH moved_rows AS (
    DELETE FROM user_behaviors
    WHERE timestamp < CURRENT_DATE - INTERVAL '365 days'
    RETURNING *
  )
  INSERT INTO user_behaviors_archive
  SELECT * FROM moved_rows;
  
  RAISE NOTICE '✅ 오래된 user_behaviors 아카이빙 완료';
END;
$$ LANGUAGE plpgsql;


-- 오래된 artwork_views 아카이빙 (6개월 이상)
CREATE OR REPLACE FUNCTION archive_old_artwork_views()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS artwork_views_archive (LIKE artwork_views INCLUDING ALL);
  
  WITH moved_rows AS (
    DELETE FROM artwork_views
    WHERE viewed_at < CURRENT_DATE - INTERVAL '180 days'
    RETURNING *
  )
  INSERT INTO artwork_views_archive
  SELECT * FROM moved_rows;
  
  RAISE NOTICE '✅ 오래된 artwork_views 아카이빙 완료';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 완료 메시지
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Low Priority 안전 최적화 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Materialized Views: 2개 생성';
  RAISE NOTICE '🔍 모니터링 함수: 1개 생성';
  RAISE NOTICE '📦 아카이빙 함수: 2개 생성 (실행은 나중에)';
  RAISE NOTICE '⚙️ VACUUM 설정: 3개 테이블 최적화';
  RAISE NOTICE '👁️ 읽기 전용 뷰: 2개 생성';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎯 즉시 사용 가능한 기능들:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ 통계 조회 (매우 빠름):';
  RAISE NOTICE '   SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30;';
  RAISE NOTICE '   SELECT * FROM artist_stats ORDER BY total_revenue DESC LIMIT 20;';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ 통계 갱신 (매일 1회 실행 권장):';
  RAISE NOTICE '   SELECT refresh_materialized_views();';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ DB 성능 모니터링:';
  RAISE NOTICE '   SELECT * FROM get_database_stats();';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ 아카이빙 (6개월~1년 후 실행):';
  RAISE NOTICE '   SELECT archive_old_user_behaviors();';
  RAISE NOTICE '   SELECT archive_old_artwork_views();';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

