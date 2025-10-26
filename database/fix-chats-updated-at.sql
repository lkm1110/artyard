-- chats 테이블에 updated_at 컬럼 추가 및 트리거 설정

-- 1. updated_at 컬럼 추가
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 기존 레코드의 updated_at을 created_at으로 초기화
UPDATE chats 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. updated_at 자동 업데이트 함수 생성 (이미 있으면 교체)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. chats 테이블 트리거 생성 (이미 있으면 먼저 삭제)
DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 메시지 추가시 chats 테이블의 updated_at을 자동 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 메시지가 추가될 때 해당 채팅방의 updated_at 갱신
    UPDATE chats 
    SET updated_at = NOW() 
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. messages 테이블에 트리거 생성 (이미 있으면 먼저 삭제)
DROP TRIGGER IF EXISTS update_chat_on_new_message ON messages;
CREATE TRIGGER update_chat_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_on_message();

-- 완료 메시지
SELECT 'chats 테이블 updated_at 설정 완료!' as result;
