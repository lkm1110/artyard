-- ===================================
-- 어드민 시스템용 DB 스키마
-- ===================================

-- 1. profiles 테이블에 is_admin 필드 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. 신고(reports) 테이블 생성
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('artwork', 'user', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 관리자 액션 로그 테이블
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_artwork', 'ban_user', 'resolve_report', 'refund_order')),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 정지 테이블
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  ban_type TEXT DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id);

-- 6. RLS 정책 (관리자만 접근)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 신고 조회 가능
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 일반 사용자는 자신이 작성한 신고만 조회
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- 모든 사용자가 신고 작성 가능
CREATE POLICY "Anyone can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- 관리자만 신고 업데이트 가능
CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 관리자만 액션 로그 조회/작성 가능
CREATE POLICY "Admins can manage action logs"
ON admin_actions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 관리자만 사용자 정지 관리 가능
CREATE POLICY "Admins can manage bans"
ON user_bans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 7. 첫 번째 관리자 계정 추가 (본인 계정의 이메일로 변경 필요!)
-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE id = (SELECT id FROM profiles WHERE id = auth.uid()); 
-- ↑ Supabase 대시보드에서 본인 계정 직접 설정하거나, 아래처럼 이메일로 설정:

-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE id IN (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );

COMMENT ON TABLE reports IS '사용자 신고 테이블';
COMMENT ON TABLE admin_actions IS '관리자 액션 로그';
COMMENT ON TABLE user_bans IS '사용자 정지 테이블';

