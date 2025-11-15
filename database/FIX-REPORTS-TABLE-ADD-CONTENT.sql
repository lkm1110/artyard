-- ===================================
-- Reports 테이블에 content_id, content_type 컬럼 추가
-- App Store Guideline 1.2 완전 충족
-- ===================================

-- 1. content_id 컬럼 추가 (신고된 콘텐츠의 ID: 작품, 댓글 등)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS content_id UUID;

-- 2. content_type 컬럼 추가 (신고된 콘텐츠의 타입)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- 3. content_type 체크 제약 조건 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_content_type_check'
  ) THEN
    ALTER TABLE reports 
    ADD CONSTRAINT reports_content_type_check 
    CHECK (content_type IN ('artwork', 'comment', 'user', 'chat', 'message'));
  END IF;
END $$;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_reports_content 
ON reports(content_type, content_id);

-- 5. 기존 데이터 마이그레이션 (context를 content_type으로)
UPDATE reports 
SET content_type = 'user' 
WHERE content_type IS NULL AND context IN ('profile', 'user');

UPDATE reports 
SET content_type = 'chat' 
WHERE content_type IS NULL AND context = 'chat';

UPDATE reports 
SET content_type = 'artwork' 
WHERE content_type IS NULL AND context = 'artwork';

UPDATE reports 
SET content_type = 'comment' 
WHERE content_type IS NULL AND context = 'comment';

-- 6. admin_notes 컬럼 추가 (없는 경우)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 7. 테이블 주석 업데이트
COMMENT ON TABLE reports IS 'User reports for all content types (artworks, comments, users, chats)';
COMMENT ON COLUMN reports.reporter_id IS 'ID of user who submitted the report';
COMMENT ON COLUMN reports.reported_id IS 'ID of user being reported (author of content or user profile)';
COMMENT ON COLUMN reports.content_id IS 'ID of reported content (artwork_id, comment_id, etc.) - NULL for user reports';
COMMENT ON COLUMN reports.content_type IS 'Type of content: artwork, comment, user, chat, message';
COMMENT ON COLUMN reports.reason IS 'Reason for report: spam, inappropriate_content, harassment, other';
COMMENT ON COLUMN reports.context IS 'DEPRECATED: Use content_type instead';
COMMENT ON COLUMN reports.status IS 'Report status: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN reports.admin_notes IS 'Admin notes for internal review';

-- 8. 스키마 확인 쿼리
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ Reports table successfully updated with content_id and content_type columns';
  RAISE NOTICE '✅ Ready for App Store Guideline 1.2 compliance';
END $$;

