-- ===================================
-- Push Notifications Database Schema
-- ===================================

-- Push Tokens 테이블
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_push_token ON push_tokens(push_token);

-- RLS 정책
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push tokens" ON push_tokens;
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Notification Queue 테이블 (백그라운드 전송용)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  channel_id TEXT DEFAULT 'default',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);

-- ===================================
-- 자동 알림 전송 함수들
-- ===================================

-- 좋아요 알림
CREATE OR REPLACE FUNCTION notify_artwork_like()
RETURNS TRIGGER AS $$
DECLARE
  artwork_owner_id UUID;
  artwork_title TEXT;
  liker_handle TEXT;
BEGIN
  -- 자기 자신의 작품에 좋아요한 경우 알림 안 보냄
  IF NEW.user_id = (SELECT author_id FROM artworks WHERE id = NEW.artwork_id) THEN
    RETURN NEW;
  END IF;

  -- 작품 정보 가져오기
  SELECT author_id, title INTO artwork_owner_id, artwork_title
  FROM artworks
  WHERE id = NEW.artwork_id;

  -- 좋아요 누른 사람 정보
  SELECT handle INTO liker_handle
  FROM profiles
  WHERE id = NEW.user_id;

  -- 알림 큐에 추가
  INSERT INTO notification_queue (user_id, title, body, data, channel_id)
  VALUES (
    artwork_owner_id,
    '❤️ New Like!',
    liker_handle || ' liked your artwork "' || artwork_title || '"',
    jsonb_build_object(
      'type', 'like',
      'artworkId', NEW.artwork_id,
      'userId', NEW.user_id
    ),
    'social'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
CREATE TRIGGER trigger_notify_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_artwork_like();

-- 댓글 알림
CREATE OR REPLACE FUNCTION notify_artwork_comment()
RETURNS TRIGGER AS $$
DECLARE
  artwork_owner_id UUID;
  artwork_title TEXT;
  commenter_handle TEXT;
BEGIN
  -- 자기 자신의 작품에 댓글 단 경우 알림 안 보냄
  IF NEW.user_id = (SELECT author_id FROM artworks WHERE id = NEW.artwork_id) THEN
    RETURN NEW;
  END IF;

  -- 작품 정보
  SELECT author_id, title INTO artwork_owner_id, artwork_title
  FROM artworks
  WHERE id = NEW.artwork_id;

  -- 댓글 작성자 정보
  SELECT handle INTO commenter_handle
  FROM profiles
  WHERE id = NEW.user_id;

  -- 알림 큐에 추가
  INSERT INTO notification_queue (user_id, title, body, data, channel_id)
  VALUES (
    artwork_owner_id,
    '💬 New Comment',
    commenter_handle || ' commented on "' || artwork_title || '"',
    jsonb_build_object(
      'type', 'comment',
      'artworkId', NEW.artwork_id,
      'commentId', NEW.id
    ),
    'social'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_comment ON comments;
CREATE TRIGGER trigger_notify_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_artwork_comment();

-- 팔로우 알림
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_handle TEXT;
BEGIN
  -- 팔로워 정보
  SELECT handle INTO follower_handle
  FROM profiles
  WHERE id = NEW.follower_id;

  -- 알림 큐에 추가
  INSERT INTO notification_queue (user_id, title, body, data, channel_id)
  VALUES (
    NEW.following_id,
    '👥 New Follower!',
    follower_handle || ' started following you',
    jsonb_build_object(
      'type', 'follow',
      'userId', NEW.follower_id
    ),
    'social'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_follow ON follows;
CREATE TRIGGER trigger_notify_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower();

-- 새 메시지 알림
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_info RECORD;
  sender_handle TEXT;
  recipient_id UUID;
BEGIN
  -- 채팅 정보 가져오기
  SELECT user1_id, user2_id INTO chat_info
  FROM chats
  WHERE id = NEW.chat_id;

  -- 수신자 결정
  IF chat_info.user1_id = NEW.sender_id THEN
    recipient_id := chat_info.user2_id;
  ELSE
    recipient_id := chat_info.user1_id;
  END IF;

  -- 발신자 정보
  SELECT handle INTO sender_handle
  FROM profiles
  WHERE id = NEW.sender_id;

  -- 알림 큐에 추가
  INSERT INTO notification_queue (user_id, title, body, data, channel_id)
  VALUES (
    recipient_id,
    '💬 ' || sender_handle,
    NEW.content,
    jsonb_build_object(
      'type', 'message',
      'chatId', NEW.chat_id,
      'senderId', NEW.sender_id
    ),
    'messages'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_message ON messages;
CREATE TRIGGER trigger_notify_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- 거래 상태 변경 알림
CREATE OR REPLACE FUNCTION notify_transaction_status_change()
RETURNS TRIGGER AS $$
DECLARE
  artwork_title TEXT;
  buyer_handle TEXT;
BEGIN
  -- 작품 정보
  SELECT title INTO artwork_title
  FROM artworks
  WHERE id = NEW.artwork_id;

  -- 구매자 정보
  SELECT handle INTO buyer_handle
  FROM profiles
  WHERE id = NEW.buyer_id;

  -- 상태별 알림
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 판매자에게: 결제 완료
    INSERT INTO notification_queue (user_id, title, body, data, channel_id)
    VALUES (
      NEW.seller_id,
      '💰 Sale Completed!',
      buyer_handle || ' purchased "' || artwork_title || '" for $' || NEW.total_amount::TEXT,
      jsonb_build_object(
        'type', 'sale',
        'transactionId', NEW.id,
        'artworkId', NEW.artwork_id
      ),
      'sales'
    );

    -- 구매자에게: 주문 완료
    INSERT INTO notification_queue (user_id, title, body, data, channel_id)
    VALUES (
      NEW.buyer_id,
      '✅ Order Confirmed',
      'Your order for "' || artwork_title || '" has been confirmed!',
      jsonb_build_object(
        'type', 'order',
        'transactionId', NEW.id,
        'artworkId', NEW.artwork_id
      ),
      'sales'
    );
  END IF;

  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    -- 구매자에게: 배송 시작
    INSERT INTO notification_queue (user_id, title, body, data, channel_id)
    VALUES (
      NEW.buyer_id,
      '📦 Shipped!',
      '"' || artwork_title || '" is on its way!',
      jsonb_build_object(
        'type', 'shipping',
        'transactionId', NEW.id,
        'artworkId', NEW.artwork_id
      ),
      'sales'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_transaction ON transactions;
CREATE TRIGGER trigger_notify_transaction
AFTER UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION notify_transaction_status_change();

-- Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Push notifications schema created successfully!';
  RAISE NOTICE '📝 Triggers enabled for:';
  RAISE NOTICE '   - Likes → notify_artwork_like()';
  RAISE NOTICE '   - Comments → notify_artwork_comment()';
  RAISE NOTICE '   - Follows → notify_new_follower()';
  RAISE NOTICE '   - Messages → notify_new_message()';
  RAISE NOTICE '   - Transactions → notify_transaction_status_change()';
END $$;

