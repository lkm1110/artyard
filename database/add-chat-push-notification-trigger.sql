/**
 * Chat Message Push Notification Trigger
 * Sends push notification when user receives a new chat message
 */

-- ================================================================
-- Chat Message Notification Trigger
-- ================================================================

CREATE OR REPLACE FUNCTION notify_chat_message_push()
RETURNS TRIGGER AS $$
DECLARE
  sender_handle TEXT;
  receiver_id UUID;
  chat_info RECORD;
  function_url TEXT;
BEGIN
  -- 발신자 handle 조회
  SELECT handle INTO sender_handle
  FROM profiles
  WHERE id = NEW.sender_id;

  -- 채팅방 정보 조회 (수신자 확인)
  SELECT 
    CASE 
      WHEN a = NEW.sender_id THEN b
      ELSE a
    END as other_user_id
  INTO receiver_id
  FROM chats
  WHERE id = NEW.chat_id;

  -- 수신자가 없으면 종료
  IF receiver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 자기 자신에게는 알람 안 보냄 (이미 위에서 체크되지만 안전장치)
  IF NEW.sender_id = receiver_id THEN
    RETURN NEW;
  END IF;

  -- Edge Function URL 설정
  function_url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification';

  -- 메시지 내용 요약 (50자 제한)
  DECLARE
    message_preview TEXT;
  BEGIN
    IF LENGTH(NEW.content) > 50 THEN
      message_preview := SUBSTRING(NEW.content, 1, 47) || '...';
    ELSE
      message_preview := NEW.content;
    END IF;

    -- Edge Function 호출 (비동기)
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'userId', receiver_id,
        'title', 'New message from @' || sender_handle,
        'body', message_preview,
        'data', jsonb_build_object(
          'type', 'message',
          'chatId', NEW.chat_id,
          'messageId', NEW.id,
          'senderId', NEW.sender_id
        )
      )
    );
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 나도 메시지는 정상 전송
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성
DROP TRIGGER IF EXISTS on_chat_message_created ON messages;
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_message_push();

COMMENT ON FUNCTION notify_chat_message_push() IS 'Send push notification when user receives a new chat message';

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Chat message push notification trigger created!';
  RAISE NOTICE '   - notify_chat_message_push()';
END $$;

