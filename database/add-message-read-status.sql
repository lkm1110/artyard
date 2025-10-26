-- messages 테이블에 읽음 상태 컬럼 추가

-- 1. is_read 컬럼 추가 (기본값: false)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. 기존 메시지들을 읽음으로 표시 (선택사항)
-- UPDATE messages SET is_read = true WHERE is_read IS NULL;

-- 3. 읽음 상태 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);
CREATE INDEX IF NOT EXISTS idx_messages_chat_read ON messages (chat_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_read ON messages (sender_id, is_read);

-- 4. 새 메시지 알림을 위한 함수 생성
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 메시지가 추가되면 실시간 알림 발송
    PERFORM pg_notify('new_message', json_build_object(
        'message_id', NEW.id,
        'chat_id', NEW.chat_id,
        'sender_id', NEW.sender_id,
        'body', NEW.body,
        'created_at', NEW.created_at
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 메시지 알림 트리거 생성
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- 완료 메시지
SELECT 'messages 테이블 읽음 상태 및 알림 시스템 설정 완료!' as result;
