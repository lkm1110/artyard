-- ================================
-- 스키마만 업데이트 (기존 데이터 보존)
-- 초기화 없이 필요한 변경사항만 적용
-- ================================

-- 1. artworks 테이블에 price 컬럼 추가 (price_band → price)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS price text;

-- 기존 price_band 데이터를 price로 복사
UPDATE artworks 
SET price = price_band 
WHERE price IS NULL AND price_band IS NOT NULL;

-- 2. 위치 정보 컬럼 추가 (작품 판매 위치)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_country text,
ADD COLUMN IF NOT EXISTS location_state text,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_full text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 3. profiles 테이블에도 위치 정보 추가 (사용자 기본 위치)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_country text,
ADD COLUMN IF NOT EXISTS location_state text, 
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_full text;

-- 2. Storage 버킷 생성 (이미 있다면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 필요한 함수들 생성/업데이트
CREATE OR REPLACE FUNCTION increment_likes_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET likes_count = likes_count + 1
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET comments_count = comments_count + 1
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 채팅 업데이트 시간 갱신 함수
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 삽입 시 채팅 시간 업데이트 트리거
DROP TRIGGER IF EXISTS update_chat_timestamp_trigger ON messages;
CREATE TRIGGER update_chat_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- 5. 유틸리티 함수들
CREATE OR REPLACE FUNCTION get_app_stats()
RETURNS TABLE(
  total_users bigint,
  total_artworks bigint, 
  total_likes bigint,
  total_comments bigint,
  active_chats bigint
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    (SELECT count(*) FROM profiles) as total_users,
    (SELECT count(*) FROM artworks WHERE is_hidden = false) as total_artworks,
    (SELECT count(*) FROM likes) as total_likes,
    (SELECT count(*) FROM comments) as total_comments,
    (SELECT count(DISTINCT chat_id) FROM messages WHERE created_at > now() - interval '30 days') as active_chats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    COALESCE(p.policy_count, 0) as policy_count
  FROM pg_tables t
  LEFT JOIN (
    SELECT 
      tablename,
      count(*) as policy_count
    FROM pg_policies 
    GROUP BY tablename
  ) p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 인덱스 생성 (존재하지 않을 경우에만)
CREATE INDEX IF NOT EXISTS idx_artworks_author_id ON artworks(author_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_material ON artworks(material);
CREATE INDEX IF NOT EXISTS idx_artworks_location ON artworks(location_country, location_state, location_city);
CREATE INDEX IF NOT EXISTS idx_artworks_coordinates ON artworks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_country, location_state, location_city);
CREATE INDEX IF NOT EXISTS idx_likes_user_artwork ON likes(user_id, artwork_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_artwork ON bookmarks(user_id, artwork_id);
CREATE INDEX IF NOT EXISTS idx_comments_artwork ON comments(artwork_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_users ON chats(a, b);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 스키마 업데이트 완료! (기존 데이터 보존됨)';
  RAISE NOTICE '💰 Price: price_band → price 컬럼 추가 및 데이터 복사';
  RAISE NOTICE '🗺️ Location: artworks/profiles에 위치 정보 컬럼 추가';
  RAISE NOTICE '📦 Storage: artworks 버킷 생성';
  RAISE NOTICE '🔧 Functions: 좋아요/댓글 카운터 함수 생성';
  RAISE NOTICE '⚡ Index: 성능 최적화 + 위치 검색 인덱스 생성';
  RAISE NOTICE '📊 확인: SELECT * FROM get_app_stats();';
END $$;
