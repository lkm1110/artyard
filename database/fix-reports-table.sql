-- ===================================
-- Reports 테이블 수정
-- reported_user_id → reported_id로 변경
-- ===================================

-- 1. 기존 테이블이 있으면 삭제하고 다시 생성 (데이터 손실 주의!)
DROP TABLE IF EXISTS reports CASCADE;

-- 2. reports 테이블 생성
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  context TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- 3. 인덱스 생성
CREATE INDEX idx_reports_reported ON reports(reported_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- 4. RLS 정책 설정
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 제출한 신고만 볼 수 있음
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- 사용자는 신고를 제출할 수 있음
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- 관리자는 모든 신고를 볼 수 있음
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자는 신고를 업데이트할 수 있음
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

COMMENT ON TABLE reports IS '사용자 신고 기록';
COMMENT ON COLUMN reports.reporter_id IS '신고한 사용자 ID';
COMMENT ON COLUMN reports.reported_id IS '신고당한 사용자 ID';
COMMENT ON COLUMN reports.reason IS '신고 사유 (spam, inappropriate_content, harassment, other)';
COMMENT ON COLUMN reports.context IS '신고 컨텍스트 (chat, artwork, profile, comment)';
COMMENT ON COLUMN reports.status IS '처리 상태 (pending, reviewed, resolved, dismissed)';

