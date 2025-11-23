-- ============================================================
-- ArtYard Database Optimization - Low Priority
-- ============================================================
-- 추후 필요시 적용할 최적화 사항들
-- 실행 시간: 약 30분 이상 (데이터 양에 따라 다름)
-- 주의: 파티셔닝은 다운타임이 필요할 수 있습니다
-- ============================================================

-- ============================================================
-- 1. 테이블 파티셔닝 (대용량 데이터 처리)
-- ============================================================

-- ⚠️ 주의: 파티셔닝은 기존 테이블을 변환하는 작업이므로
-- 프로덕션 환경에서는 유지보수 시간에 실행하세요

-- user_behaviors 파티셔닝 (timestamp 기준)
-- 현재 테이블 백업
-- CREATE TABLE user_behaviors_backup AS SELECT * FROM user_behaviors;

-- 기존 테이블 제거 후 파티션 테이블 생성
-- DROP TABLE user_behaviors;
/*
CREATE TABLE user_behaviors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  artwork_id uuid,
  behavior_type text NOT NULL CHECK (behavior_type = ANY (ARRAY['view'::text, 'like'::text, 'unlike'::text, 'bookmark'::text, 'unbookmark'::text, 'share'::text, 'comment'::text, 'search'::text, 'scroll'::text, 'upload'::text, 'download'::text, 'report'::text, 'profile_view'::text, 'follow'::text, 'unfollow'::text])),
  behavior_data jsonb DEFAULT '{}'::jsonb,
  intensity_score double precision DEFAULT 1.0 CHECK (intensity_score >= 0::double precision AND intensity_score <= 10::double precision),
  session_id text,
  device_type text,
  user_agent text,
  ip_address inet,
  location_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT user_behaviors_pkey PRIMARY KEY (id, timestamp),
  CONSTRAINT user_behaviors_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id),
  CONSTRAINT user_behaviors_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES artworks(id)
) PARTITION BY RANGE (timestamp);

-- 2024년 파티션
CREATE TABLE user_behaviors_2024 PARTITION OF user_behaviors
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 2025년 파티션
CREATE TABLE user_behaviors_2025 PARTITION OF user_behaviors
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 2026년 파티션
CREATE TABLE user_behaviors_2026 PARTITION OF user_behaviors
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- 데이터 복원
-- INSERT INTO user_behaviors SELECT * FROM user_behaviors_backup;
*/


-- artwork_views 파티셔닝 (viewed_at 기준)
/*
CREATE TABLE artwork_views_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_id uuid NOT NULL,
  viewer_id uuid,
  session_id character varying,
  referrer character varying,
  device_type character varying,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT artwork_views_pkey PRIMARY KEY (id, viewed_at),
  CONSTRAINT artwork_views_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  CONSTRAINT artwork_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE
) PARTITION BY RANGE (viewed_at);

-- 월별 파티션 생성
CREATE TABLE artwork_views_2025_01 PARTITION OF artwork_views_new
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE artwork_views_2025_02 PARTITION OF artwork_views_new
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ... 필요한 만큼 추가
*/


-- ============================================================
-- 2. seller_payouts 테이블 제거 (settlements로 통합)
-- ============================================================

-- ⚠️ 주의: 데이터 마이그레이션 필요
-- 현재 seller_payouts 데이터가 있다면 먼저 settlements로 이동

/*
-- seller_payouts 데이터를 settlements로 마이그레이션
INSERT INTO settlements (
  artist_id,
  period_start,
  period_end,
  total_sales_amount,
  platform_fee,
  net_amount,
  transaction_count,
  status,
  bank_name,
  account_number,
  account_holder,
  created_at
)
SELECT 
  seller_id,
  created_at,
  created_at,
  total_amount,
  platform_fee,
  seller_amount,
  1,
  status,
  bank_info->>'bank_name',
  bank_info->>'account_number',
  bank_info->>'account_holder',
  created_at
FROM seller_payouts;

-- seller_payouts 테이블 제거
DROP TABLE seller_payouts CASCADE;
*/


-- ============================================================
-- 3. 고급 분석용 Materialized View
-- ============================================================

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
-- 4. 데이터베이스 성능 모니터링 함수
-- ============================================================

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
-- 5. 오래된 데이터 아카이빙
-- ============================================================

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
-- 6. 자동 VACUUM 설정 최적화
-- ============================================================

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
-- 7. 읽기 전용 복제본용 뷰 (옵션)
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
-- 완료 메시지
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Low Priority 최적화 완료!';
  RAISE NOTICE '📊 Materialized Views: 2개';
  RAISE NOTICE '🔍 모니터링 함수: 1개';
  RAISE NOTICE '📦 아카이빙 함수: 2개';
  RAISE NOTICE '⚙️ VACUUM 설정 최적화: 3개 테이블';
  RAISE NOTICE '';
  RAISE NOTICE '📊 통계 조회: SELECT * FROM get_database_stats();';
  RAISE NOTICE '🔄 뷰 갱신: SELECT refresh_materialized_views();';
  RAISE NOTICE '📦 아카이빙: SELECT archive_old_user_behaviors();';
END $$;

