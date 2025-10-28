-- Check chats and messages table schema
-- chats와 messages 테이블 구조 확인

-- 1. chats 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chats'
ORDER BY ordinal_position;

-- 2. messages 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 3. chats 테이블 샘플 데이터 (컬럼명 확인)
SELECT * FROM chats LIMIT 1;

-- 4. messages 테이블 샘플 데이터 (컬럼명 확인)
SELECT * FROM messages LIMIT 1;

