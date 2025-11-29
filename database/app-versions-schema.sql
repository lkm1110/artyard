-- =============================================
-- 앱 버전 관리 시스템
-- =============================================
-- 
-- 기능:
-- 1. 강제 업데이트
-- 2. 권장 업데이트
-- 3. 최소 지원 버전
-- 4. 릴리즈 노트
-- =============================================

-- 앱 버전 테이블
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 플랫폼
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  
  -- 버전 정보
  version TEXT NOT NULL,  -- '1.0.1'
  build_number INTEGER NOT NULL,
  
  -- 지원 버전
  min_supported_version TEXT NOT NULL, -- '1.0.0'
  min_supported_build INTEGER NOT NULL,
  
  -- 업데이트 정책
  force_update BOOLEAN DEFAULT false, -- 강제 업데이트 여부
  recommended_update BOOLEAN DEFAULT true, -- 권장 업데이트 여부
  
  -- 릴리즈 정보
  release_notes TEXT,
  release_notes_ko TEXT, -- 한글 릴리즈 노트
  
  -- 다운로드 URL
  download_url TEXT,
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false,
  
  -- 롤아웃 (점진적 배포)
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- 날짜
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions(platform);
CREATE INDEX IF NOT EXISTS idx_app_versions_active ON app_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions(platform, version);

-- RLS 활성화 (공개 읽기)
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능
DROP POLICY IF EXISTS "Anyone can view app versions" ON app_versions;
CREATE POLICY "Anyone can view app versions"
  ON app_versions FOR SELECT
  USING (is_active = true);

-- 초기 데이터 삽입
INSERT INTO app_versions (
  platform,
  version,
  build_number,
  min_supported_version,
  min_supported_build,
  force_update,
  recommended_update,
  release_notes,
  release_notes_ko,
  download_url
) VALUES
-- iOS
(
  'ios',
  '1.0.1',
  31,
  '1.0.0',
  1,
  false,
  false,
  'Initial release with bug fixes',
  '초기 버전 버그 수정',
  'https://apps.apple.com/app/artyard'
),
-- Android
(
  'android',
  '1.0.1',
  21,
  '1.0.0',
  1,
  false,
  false,
  'Initial release with bug fixes',
  '초기 버전 버그 수정',
  'https://play.google.com/store/apps/details?id=com.artyard'
)
ON CONFLICT DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 앱 버전 관리 시스템 생성 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '📱 현재 버전:';
  RAISE NOTICE '   - iOS: 1.0.1 (Build 31)';
  RAISE NOTICE '   - Android: 1.0.1 (Build 21)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 사용 방법:';
  RAISE NOTICE '   1. 새 버전 출시 시 INSERT';
  RAISE NOTICE '   2. force_update = true로 강제 업데이트';
  RAISE NOTICE '   3. 앱 시작 시 버전 체크';
END $$;

