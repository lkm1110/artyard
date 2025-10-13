-- chats 테이블과 profiles 테이블 간 외래키 관계 설정

-- 1. 기존 외래키 제약조건 확인 및 삭제 (있다면)
DO $$ 
BEGIN
    -- chats_a_fkey 외래키가 있으면 삭제
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_a_fkey'
    ) THEN
        ALTER TABLE chats DROP CONSTRAINT chats_a_fkey;
    END IF;
    
    -- chats_b_fkey 외래키가 있으면 삭제
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_b_fkey'
    ) THEN
        ALTER TABLE chats DROP CONSTRAINT chats_b_fkey;
    END IF;
END $$;

-- 2. 외래키 제약조건 추가 (실제 컬럼명 a, b 사용)
ALTER TABLE chats 
ADD CONSTRAINT chats_a_fkey 
FOREIGN KEY (a) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE chats 
ADD CONSTRAINT chats_b_fkey 
FOREIGN KEY (b) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. messages 테이블 외래키도 확인 및 설정
DO $$ 
BEGIN
    -- messages_chat_id_fkey 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_chat_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
    END IF;
    
    -- messages_sender_id_fkey 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 향상) - 실제 컬럼명 a, b 사용
CREATE INDEX IF NOT EXISTS idx_chats_a ON chats(a);
CREATE INDEX IF NOT EXISTS idx_chats_b ON chats(b);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 5. Supabase 스키마 캐시 새로고침을 위한 더미 업데이트 (PostgreSQL 호환)
DO $$ 
BEGIN
    -- 첫 번째 레코드 하나만 업데이트하여 스키마 캐시 새로고침 (실제 컬럼명 a 사용)
    UPDATE chats SET a = a 
    WHERE id = (SELECT id FROM chats WHERE a IS NOT NULL LIMIT 1);
EXCEPTION
    WHEN OTHERS THEN
        -- 레코드가 없어도 에러 무시
        NULL;
END $$;

-- 완료 메시지
SELECT 'chats-profiles 외래키 관계 설정 완료!' as result;
