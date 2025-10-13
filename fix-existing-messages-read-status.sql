-- 기존 메시지들의 is_read NULL 문제 해결

-- 1. 먼저 is_read 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'is_read';

-- 2. 기존 메시지들 중 is_read가 NULL인 것들을 TRUE로 설정 (이미 읽었다고 가정)
UPDATE messages 
SET is_read = TRUE 
WHERE is_read IS NULL;

-- 3. 업데이트 결과 확인
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN is_read = TRUE THEN 1 END) as read_messages,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_messages,
  COUNT(CASE WHEN is_read IS NULL THEN 1 END) as null_messages
FROM messages;

-- 완료 메시지
SELECT '기존 메시지들의 읽음 상태 정리 완료!' as result;
