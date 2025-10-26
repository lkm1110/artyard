-- ====================================================
-- 메시지 수정/삭제 기능을 위한 데이터베이스 스키마 확장
-- ====================================================

-- 🔧 Messages 테이블에 수정/삭제 관련 컬럼 추가
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS original_body TEXT NULL; -- 원본 메시지 백업

-- 📝 수정/삭제 이력을 위한 새 테이블 생성
CREATE TABLE IF NOT EXISTS message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('edit', 'delete', 'restore')),
  old_content TEXT,
  new_content TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NULL -- 삭제 이유 등
);

-- 🔧 Message History 테이블 RLS 설정
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 채팅 참여자만 이력 볼 수 있음
CREATE POLICY "message_history_select_policy" ON message_history
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE m.id = message_history.message_id 
    AND (c.a = auth.uid() OR c.b = auth.uid())
  )
);

-- RLS 정책: 메시지 작성자만 이력 생성 가능
CREATE POLICY "message_history_insert_policy" ON message_history
FOR INSERT 
TO authenticated
WITH CHECK (performed_by = auth.uid());

-- 🚀 테이블 권한 부여
GRANT SELECT, INSERT ON message_history TO authenticated;

-- 📊 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_edited ON messages(is_edited, edited_at);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_message_history_message_id ON message_history(message_id);
CREATE INDEX IF NOT EXISTS idx_message_history_performed_at ON message_history(performed_at DESC);

-- 🔍 확인용 쿼리
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND column_name IN ('is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'original_body')
ORDER BY column_name;

COMMIT;

