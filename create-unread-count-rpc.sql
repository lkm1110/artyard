-- 읽지 않은 메시지 수를 빠르게 계산하는 RPC 함수 생성

-- 1. RPC 함수 생성 (사용자별 읽지 않은 메시지 수 계산)
CREATE OR REPLACE FUNCTION count_unread_messages(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER := 0;
  chat_record RECORD;
BEGIN
  -- 사용자가 참여한 모든 채팅방에서 읽지 않은 메시지 수 계산
  FOR chat_record IN 
    SELECT id FROM chats WHERE a = user_id OR b = user_id
  LOOP
    -- 각 채팅방에서 읽지 않은 메시지 수 추가
    SELECT total_count + COUNT(*)
    INTO total_count
    FROM messages 
    WHERE chat_id = chat_record.id 
      AND sender_id != user_id  -- 자신이 보낸 메시지 제외
      AND (is_read IS NULL OR is_read = FALSE);  -- 읽지 않은 메시지만
  END LOOP;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION count_unread_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_unread_messages(UUID) TO anon;

-- 3. 테스트 (현재 사용자의 읽지 않은 메시지 수 확인)
-- SELECT count_unread_messages(auth.uid());

-- 완료 메시지
SELECT 'RPC 함수 count_unread_messages 생성 완료!' as result;
