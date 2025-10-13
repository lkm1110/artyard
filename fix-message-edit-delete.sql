-- ====================================================
-- 메시지 수정/삭제 기능 완전 설정 (기존 정책 제거 후 재설치)
-- ====================================================

-- 🧹 기존 정책들 완전 제거 (에러 방지)
DROP POLICY IF EXISTS "message_history_select_policy" ON message_history;
DROP POLICY IF EXISTS "message_history_insert_policy" ON message_history;
DROP POLICY IF EXISTS "message_history_update_policy" ON message_history;
DROP POLICY IF EXISTS "message_history_delete_policy" ON message_history;

-- 🗑️ 기존 테이블이 있다면 제거 (완전 초기화)
DROP TABLE IF EXISTS message_history CASCADE;

-- 📊 Messages 테이블에 컬럼 추가 (중복 방지)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS original_body TEXT NULL;

-- 📝 수정/삭제 이력 테이블 새로 생성
CREATE TABLE message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('edit', 'delete', 'restore')),
  old_content TEXT,
  new_content TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NULL
);

-- 🔐 RLS 설정
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- ✅ 새로운 RLS 정책들 생성
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

-- 🔍 확인용 쿼리 (선택사항)
-- 새로운 컬럼들 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND column_name IN ('is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'original_body')
ORDER BY column_name;

-- 새로운 테이블 확인
SELECT tablename, schemaname, rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'message_history';

-- 정책 확인
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'message_history'
ORDER BY policyname;

COMMIT;
