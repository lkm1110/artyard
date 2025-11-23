-- ============================================================
-- ArtYard Database Optimization - Medium Priority
-- ============================================================
-- 1-2주 내 적용 권장 사항들
-- 실행 시간: 약 10-20분 (데이터 양에 따라 다름)
-- ============================================================

-- ============================================================
-- 1. CASCADE 옵션 추가
-- ============================================================

-- artworks 삭제 시 관련 데이터도 함께 삭제되도록 CASCADE 추가

-- likes 테이블
ALTER TABLE likes 
DROP CONSTRAINT IF EXISTS likes_artwork_id_fkey,
ADD CONSTRAINT likes_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- comments 테이블
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_artwork_id_fkey,
ADD CONSTRAINT comments_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- bookmarks 테이블
ALTER TABLE bookmarks 
DROP CONSTRAINT IF EXISTS bookmarks_artwork_id_fkey,
ADD CONSTRAINT bookmarks_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- artwork_views 테이블
ALTER TABLE artwork_views 
DROP CONSTRAINT IF EXISTS artwork_views_artwork_id_fkey,
ADD CONSTRAINT artwork_views_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- artwork_colors 테이블
ALTER TABLE artwork_colors 
DROP CONSTRAINT IF EXISTS artwork_colors_artwork_id_fkey,
ADD CONSTRAINT artwork_colors_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- artwork_analytics 테이블
ALTER TABLE artwork_analytics 
DROP CONSTRAINT IF EXISTS artwork_analytics_artwork_id_fkey,
ADD CONSTRAINT artwork_analytics_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- artwork_shipping_settings 테이블
ALTER TABLE artwork_shipping_settings 
DROP CONSTRAINT IF EXISTS artwork_shipping_settings_artwork_id_fkey,
ADD CONSTRAINT artwork_shipping_settings_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;

-- artwork_style_relations 테이블
ALTER TABLE artwork_style_relations 
DROP CONSTRAINT IF EXISTS artwork_style_relations_artwork_id_fkey,
ADD CONSTRAINT artwork_style_relations_artwork_id_fkey 
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;


-- ============================================================
-- 2. 카운터 업데이트 트리거 추가
-- ============================================================

-- likes_count 자동 업데이트
CREATE OR REPLACE FUNCTION update_artwork_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artworks 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.artwork_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artworks 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.artwork_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_artwork_likes_count ON likes;
CREATE TRIGGER trigger_update_artwork_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_artwork_likes_count();


-- comments_count 자동 업데이트
CREATE OR REPLACE FUNCTION update_artwork_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artworks 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.artwork_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artworks 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.artwork_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_artwork_comments_count ON comments;
CREATE TRIGGER trigger_update_artwork_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_artwork_comments_count();


-- challenge_entries votes_count 자동 업데이트
CREATE OR REPLACE FUNCTION update_challenge_entry_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenge_entries 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenge_entries 
    SET votes_count = GREATEST(0, votes_count - 1) 
    WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_challenge_entry_votes_count ON challenge_votes;
CREATE TRIGGER trigger_update_challenge_entry_votes_count
AFTER INSERT OR DELETE ON challenge_votes
FOR EACH ROW EXECUTE FUNCTION update_challenge_entry_votes_count();


-- follower_count 자동 업데이트 (profiles 테이블에 컬럼 추가 필요시)
-- 현재 follows 테이블에서 동적으로 계산하고 있으므로 생략


-- ============================================================
-- 3. notification_preferences 기본값 함수 분리
-- ============================================================

CREATE OR REPLACE FUNCTION get_default_notification_preferences()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'sale', true,
    'new_like', true,
    'purchase', true,
    'newsletter', false,
    'auction_bid', true,
    'auction_won', true,
    'new_comment', true,
    'auction_lost', true,
    'new_follower', true,
    'system_updates', true,
    'voting_started', true,
    'payment_received', true,
    'challenge_started', true,
    'challenge_ending_soon', true
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- profiles 테이블에 적용
ALTER TABLE profiles 
ALTER COLUMN notification_preferences 
SET DEFAULT get_default_notification_preferences();


-- ============================================================
-- 4. Soft Delete 컬럼 추가
-- ============================================================

-- artworks 테이블
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_artworks_deleted_at ON artworks(deleted_at) WHERE deleted_at IS NULL;

-- comments 테이블
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NULL;

-- profiles 테이블
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;


-- Active 데이터만 보여주는 뷰 생성
CREATE OR REPLACE VIEW active_artworks AS
SELECT * FROM artworks 
WHERE deleted_at IS NULL 
  AND is_hidden = false
  AND sale_status != 'sold';

CREATE OR REPLACE VIEW active_comments AS
SELECT * FROM comments 
WHERE deleted_at IS NULL;


-- ============================================================
-- 5. 데이터 정합성 체크 함수
-- ============================================================

CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
  check_name text,
  issue_count bigint,
  status text
) AS $$
BEGIN
  -- likes_count 정합성 체크
  RETURN QUERY
  SELECT 
    'artworks.likes_count' as check_name,
    COUNT(*) as issue_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
  FROM artworks a
  WHERE a.likes_count != (
    SELECT COUNT(*) FROM likes WHERE artwork_id = a.id
  );

  -- comments_count 정합성 체크
  RETURN QUERY
  SELECT 
    'artworks.comments_count' as check_name,
    COUNT(*) as issue_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
  FROM artworks a
  WHERE a.comments_count != (
    SELECT COUNT(*) FROM comments WHERE artwork_id = a.id
  );

  -- challenge_entries.votes_count 정합성 체크
  RETURN QUERY
  SELECT 
    'challenge_entries.votes_count' as check_name,
    COUNT(*) as issue_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
  FROM challenge_entries ce
  WHERE ce.votes_count != (
    SELECT COUNT(*) FROM challenge_votes WHERE entry_id = ce.id
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 6. 정합성 수정 함수
-- ============================================================

CREATE OR REPLACE FUNCTION fix_data_integrity()
RETURNS void AS $$
BEGIN
  -- likes_count 수정
  UPDATE artworks a
  SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE artwork_id = a.id
  );

  -- comments_count 수정
  UPDATE artworks a
  SET comments_count = (
    SELECT COUNT(*) FROM comments WHERE artwork_id = a.id
  );

  -- challenge_entries votes_count 수정
  UPDATE challenge_entries ce
  SET votes_count = (
    SELECT COUNT(*) FROM challenge_votes WHERE entry_id = ce.id
  );

  RAISE NOTICE '✅ 데이터 정합성 수정 완료!';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 7. user_bans 만료 자동 처리
-- ============================================================

-- 활성 ban만 보여주는 뷰
CREATE OR REPLACE VIEW active_user_bans AS
SELECT 
  *,
  CASE 
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN false
    ELSE is_active
  END as currently_active
FROM user_bans
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

-- 정기적으로 만료된 ban 비활성화 (일 1회 실행 권장)
CREATE OR REPLACE FUNCTION cleanup_expired_bans()
RETURNS integer AS $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE user_bans
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RAISE NOTICE '✅ % expired bans deactivated', affected_rows;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 완료 메시지
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Medium Priority 최적화 완료!';
  RAISE NOTICE '🔗 CASCADE 옵션 추가: 8개 테이블';
  RAISE NOTICE '⚡ 자동 업데이트 트리거: 3개';
  RAISE NOTICE '🗑️ Soft Delete 지원: 3개 테이블';
  RAISE NOTICE '🔍 데이터 정합성 체크 함수 추가';
  RAISE NOTICE '';
  RAISE NOTICE '📊 정합성 체크 실행: SELECT * FROM check_data_integrity();';
  RAISE NOTICE '🔧 정합성 수정 실행: SELECT fix_data_integrity();';
END $$;

