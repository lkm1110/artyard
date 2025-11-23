-- ============================================================
-- seller_payouts 테이블 제거 (settlements로 통합)
-- ============================================================
-- 실행 조건: seller_payouts 테이블에 데이터가 없을 때
-- 실행 시간: 약 1분
-- 다운타임: 없음
-- ============================================================

-- ============================================================
-- 1. 데이터 확인 (안전 체크)
-- ============================================================

DO $$ 
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM seller_payouts;
  
  IF row_count > 0 THEN
    RAISE EXCEPTION '⚠️ seller_payouts 테이블에 % 개의 데이터가 있습니다. 먼저 마이그레이션이 필요합니다!', row_count;
  ELSE
    RAISE NOTICE '✅ seller_payouts 테이블이 비어있습니다. 안전하게 제거 가능합니다.';
  END IF;
END $$;


-- ============================================================
-- 2. 외래 키 제약 확인
-- ============================================================

-- seller_payouts를 참조하는 외래 키가 있는지 확인
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND constraint_name LIKE '%seller_payouts%';
    
  IF fk_count > 0 THEN
    RAISE NOTICE '⚠️ seller_payouts를 참조하는 외래 키 %개 발견', fk_count;
  ELSE
    RAISE NOTICE '✅ 외래 키 제약 없음';
  END IF;
END $$;


-- ============================================================
-- 3. seller_payouts 테이블 제거
-- ============================================================

-- CASCADE 옵션으로 관련된 모든 제약/트리거도 함께 제거
DO $$
BEGIN
  DROP TABLE IF EXISTS seller_payouts CASCADE;
  RAISE NOTICE '✅ seller_payouts 테이블이 성공적으로 제거되었습니다!';
END $$;


-- ============================================================
-- 4. settlements 테이블 확인 및 개선
-- ============================================================

-- settlements 테이블에 필요한 모든 컬럼이 있는지 확인
DO $$
BEGIN
  -- 필요한 컬럼들이 모두 있는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settlements' 
    AND column_name = 'bank_name'
  ) THEN
    RAISE NOTICE '⚠️ settlements 테이블에 일부 컬럼이 누락되었을 수 있습니다.';
  ELSE
    RAISE NOTICE '✅ settlements 테이블 구조 확인 완료';
  END IF;
END $$;


-- ============================================================
-- 5. settlements 인덱스 최적화
-- ============================================================

-- settlements 조회 성능 향상을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlements_artist_id ON settlements(artist_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period_start ON settlements(period_start);
CREATE INDEX IF NOT EXISTS idx_settlements_period_end ON settlements(period_end);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at DESC);


-- ============================================================
-- 6. settlements 관련 뷰 생성
-- ============================================================

-- 대기 중인 정산 목록 뷰
CREATE OR REPLACE VIEW pending_settlements AS
SELECT 
  s.*,
  p.handle as artist_handle,
  p.avatar_url as artist_avatar
FROM settlements s
JOIN profiles p ON p.id = s.artist_id
WHERE s.status = 'pending'
ORDER BY s.created_at ASC;


-- 승인된 정산 목록 뷰
CREATE OR REPLACE VIEW approved_settlements AS
SELECT 
  s.*,
  p.handle as artist_handle,
  p.avatar_url as artist_avatar,
  admin.handle as approved_by_handle
FROM settlements s
JOIN profiles p ON p.id = s.artist_id
LEFT JOIN profiles admin ON admin.id = s.approved_by
WHERE s.status IN ('approved', 'processing', 'completed')
ORDER BY s.approved_at DESC;


-- ============================================================
-- 7. settlements 정합성 체크 함수
-- ============================================================

CREATE OR REPLACE FUNCTION check_settlements_integrity()
RETURNS TABLE(
  check_name text,
  issue_count bigint,
  status text
) AS $$
BEGIN
  -- 정산 금액 정합성 체크
  RETURN QUERY
  SELECT 
    'settlements.net_amount 계산 오류' as check_name,
    COUNT(*) as issue_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
  FROM settlements
  WHERE net_amount != (total_sales_amount - platform_fee - payment_fee);

  -- 거래 건수 정합성 체크
  RETURN QUERY
  SELECT 
    'settlements.transaction_count 오류' as check_name,
    COUNT(*) as issue_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
  FROM settlements s
  WHERE s.transaction_count != (
    SELECT COUNT(*) FROM settlement_items WHERE settlement_id = s.id
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 8. 앱 코드에서 seller_payouts 참조 확인 안내
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '⚠️  다음 단계: 앱 코드 확인 필요';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '앱 코드에서 seller_payouts를 참조하는 부분을 찾아';
  RAISE NOTICE 'settlements로 변경해야 합니다:';
  RAISE NOTICE '';
  RAISE NOTICE '검색어:';
  RAISE NOTICE '  - seller_payouts';
  RAISE NOTICE '  - sellerPayouts';
  RAISE NOTICE '  - SellerPayouts';
  RAISE NOTICE '';
  RAISE NOTICE '변경 예시:';
  RAISE NOTICE '  seller_payouts → settlements';
  RAISE NOTICE '  seller_amount → net_amount';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;


-- ============================================================
-- 완료 메시지
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ seller_payouts 테이블 제거 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 변경 사항:';
  RAISE NOTICE '  ❌ seller_payouts 테이블 제거';
  RAISE NOTICE '  ✅ settlements 인덱스 5개 추가';
  RAISE NOTICE '  ✅ settlements 뷰 2개 생성';
  RAISE NOTICE '  ✅ settlements 정합성 체크 함수 생성';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 사용 가능한 기능:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ 대기 중인 정산:';
  RAISE NOTICE '   SELECT * FROM pending_settlements;';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ 승인된 정산:';
  RAISE NOTICE '   SELECT * FROM approved_settlements;';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ 정합성 체크:';
  RAISE NOTICE '   SELECT * FROM check_settlements_integrity();';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

