-- =============================================
-- 추천 알고리즘 헬퍼 함수
-- =============================================

-- 사용자가 이미 본 작품 가져오기
CREATE OR REPLACE FUNCTION get_seen_artworks(user_id_input UUID)
RETURNS TABLE(artwork_id UUID) AS $$
BEGIN
  RETURN QUERY
  -- 좋아요한 작품
  SELECT DISTINCT artwork_id FROM likes WHERE user_id = user_id_input
  UNION
  -- 북마크한 작품
  SELECT DISTINCT artwork_id FROM bookmarks WHERE user_id = user_id_input
  UNION
  -- 자신의 작품
  SELECT DISTINCT id FROM artworks WHERE author_id = user_id_input;
END;
$$ LANGUAGE plpgsql;

-- 완료
DO $$
BEGIN
  RAISE NOTICE '✅ 추천 알고리즘 함수 생성 완료!';
END $$;

