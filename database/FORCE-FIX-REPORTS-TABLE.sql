-- ===================================
-- Reports 테이블 강제 수정
-- Supabase 스키마 캐시 리로드 포함
-- ===================================

-- 1. 먼저 기존 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- 2. content_id 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'content_id'
  ) THEN
    ALTER TABLE reports ADD COLUMN content_id UUID;
    RAISE NOTICE '✅ content_id 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'ℹ️ content_id 컬럼 이미 존재';
  END IF;
END $$;

-- 3. content_type 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE reports ADD COLUMN content_type TEXT;
    RAISE NOTICE '✅ content_type 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'ℹ️ content_type 컬럼 이미 존재';
  END IF;
END $$;

-- 4. admin_notes 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE reports ADD COLUMN admin_notes TEXT;
    RAISE NOTICE '✅ admin_notes 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'ℹ️ admin_notes 컬럼 이미 존재';
  END IF;
END $$;

-- 5. content_type 체크 제약 조건 추가 (기존 제약 먼저 삭제)
DO $$ 
BEGIN
  -- 기존 제약 조건 삭제
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_content_type_check'
  ) THEN
    ALTER TABLE reports DROP CONSTRAINT reports_content_type_check;
    RAISE NOTICE 'ℹ️ 기존 제약 조건 삭제됨';
  END IF;
  
  -- 새 제약 조건 추가
  ALTER TABLE reports 
  ADD CONSTRAINT reports_content_type_check 
  CHECK (content_type IN ('artwork', 'comment', 'user', 'chat', 'message', NULL));
  
  RAISE NOTICE '✅ content_type 체크 제약 조건 추가됨';
END $$;

-- 6. 인덱스 추가
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_reports_content 
  ON reports(content_type, content_id);
  
  RAISE NOTICE '✅ 인덱스 추가됨';
END $$;

-- 7. 기존 데이터 마이그레이션
DO $$ 
BEGIN
  UPDATE reports 
  SET content_type = CASE
    WHEN context IN ('profile', 'user') THEN 'user'
    WHEN context = 'chat' THEN 'chat'
    WHEN context = 'artwork' THEN 'artwork'
    WHEN context = 'comment' THEN 'comment'
    ELSE 'user'
  END
  WHERE content_type IS NULL;
  
  RAISE NOTICE '✅ 기존 데이터 마이그레이션 완료';
END $$;

-- 8. 변경 후 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- 9. PostgREST 스키마 캐시 강제 리로드 (매우 중요!)
NOTIFY pgrst, 'reload schema';

-- 10. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅✅✅ Reports 테이블 수정 완료! ✅✅✅';
  RAISE NOTICE '✅ PostgREST 스키마 캐시 리로드됨';
  RAISE NOTICE '✅ 앱을 재시작해주세요!';
END $$;

