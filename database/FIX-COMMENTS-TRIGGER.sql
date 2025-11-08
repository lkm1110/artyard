-- ===================================
-- comments 트리거 수정
-- ===================================
-- comments 테이블의 컬럼은 author_id인데
-- 트리거에서 user_id를 참조하고 있어서 에러 발생
-- NEW.user_id → NEW.author_id로 수정

-- 댓글 알림 함수 수정
CREATE OR REPLACE FUNCTION notify_artwork_comment()
RETURNS TRIGGER AS $$
DECLARE
  artwork_owner_id UUID;
  artwork_title TEXT;
  commenter_handle TEXT;
BEGIN
  -- 자기 자신의 작품에 댓글 단 경우 알림 안 보냄
  IF NEW.author_id = (SELECT author_id FROM artworks WHERE id = NEW.artwork_id) THEN
    RETURN NEW;
  END IF;

  -- 작품 정보
  SELECT author_id, title INTO artwork_owner_id, artwork_title
  FROM artworks
  WHERE id = NEW.artwork_id;

  -- 댓글 작성자 정보
  SELECT handle INTO commenter_handle
  FROM profiles
  WHERE id = NEW.author_id;

  -- 알림 큐에 추가
  INSERT INTO notification_queue (user_id, title, body, data, channel_id)
  VALUES (
    artwork_owner_id,
    '💬 New Comment!',
    commenter_handle || ' commented on your artwork "' || artwork_title || '"',
    jsonb_build_object(
      'type', 'comment',
      'artworkId', NEW.artwork_id,
      'commentId', NEW.id,
      'userId', NEW.author_id
    ),
    'social'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_notify_comment ON comments;
CREATE TRIGGER trigger_notify_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_artwork_comment();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Comments trigger fixed: user_id → author_id';
END $$;


