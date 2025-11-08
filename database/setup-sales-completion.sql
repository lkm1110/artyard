-- ===================================
-- Sales Completion Automation Setup
-- ===================================
-- 판매 완료 자동 처리 시스템 구축

-- 1. 트랜잭션 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_artwork_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- 결제 완료 시 작품 상태를 'sold'로 변경
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE artworks
    SET 
      sale_status = 'sold',
      sold_at = NEW.paid_at,
      buyer_id = NEW.buyer_id
    WHERE id = NEW.artwork_id;
    
    RAISE NOTICE '✅ Artwork % marked as sold', NEW.artwork_id;
  END IF;
  
  -- 환불 시 작품 상태를 다시 'available'로 변경
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    UPDATE artworks
    SET 
      sale_status = 'available',
      sold_at = NULL,
      buyer_id = NULL
    WHERE id = NEW.artwork_id;
    
    RAISE NOTICE '✅ Artwork % marked as available (refunded)', NEW.artwork_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_artwork_on_sale ON transactions;
CREATE TRIGGER trigger_update_artwork_on_sale
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_artwork_on_sale();

-- 3. 에스크로 자동 완료 함수
CREATE OR REPLACE FUNCTION auto_complete_escrowed_transactions()
RETURNS void AS $$
DECLARE
  completed_count INT := 0;
BEGIN
  -- auto_confirm_at 시간이 지난 'paid' 상태의 트랜잭션을 'completed'로 변경
  WITH updated AS (
    UPDATE transactions
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE 
      status = 'paid'
      AND auto_confirm_at IS NOT NULL
      AND auto_confirm_at <= NOW()
    RETURNING id, seller_id, amount, seller_amount
  )
  SELECT COUNT(*) INTO completed_count FROM updated;
  
  IF completed_count > 0 THEN
    RAISE NOTICE '✅ % transactions auto-completed after escrow period', completed_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 판매자 정산 처리 함수
CREATE OR REPLACE FUNCTION process_seller_payout()
RETURNS void AS $$
DECLARE
  payout_record RECORD;
BEGIN
  -- 완료된 트랜잭션 중 아직 정산되지 않은 것들 처리
  FOR payout_record IN
    SELECT 
      id,
      seller_id,
      seller_amount,
      artwork_id
    FROM transactions
    WHERE 
      status = 'completed'
      AND payout_status != 'paid'
      AND completed_at IS NOT NULL
  LOOP
    -- 정산 상태 업데이트
    UPDATE transactions
    SET payout_status = 'paid'
    WHERE id = payout_record.id;
    
    -- 판매자에게 알림
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      payout_record.seller_id,
      'payout',
      'Payment Released! 💰',
      'Your earnings have been released. Amount: $' || payout_record.seller_amount,
      '/sales/' || payout_record.id
    );
    
    RAISE NOTICE '✅ Payout processed for transaction %', payout_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. payout_status 컬럼 추가 (없는 경우에만)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending';

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_payout_status_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_payout_status_check 
CHECK (payout_status IN ('pending', 'paid', 'failed'));

-- 6. completed_at 컬럼 추가 (없는 경우에만)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_transactions_auto_confirm ON transactions(auto_confirm_at) 
WHERE status = 'paid';

CREATE INDEX IF NOT EXISTS idx_transactions_payout_status ON transactions(payout_status)
WHERE status = 'completed';

-- 8. 테스트 - 에스크로 자동 완료 실행
-- SELECT auto_complete_escrowed_transactions();

-- 9. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ 판매 완료 자동화 시스템 구축 완료!';
  RAISE NOTICE '✅ 트리거: 결제 시 자동으로 작품 상태 변경';
  RAISE NOTICE '✅ 에스크로: 7일 후 자동 완료 함수 준비됨';
  RAISE NOTICE '✅ 정산: 완료된 거래 정산 처리 함수 준비됨';
  RAISE NOTICE '';
  RAISE NOTICE '📋 수동 실행 방법:';
  RAISE NOTICE '   - 에스크로 완료: SELECT auto_complete_escrowed_transactions();';
  RAISE NOTICE '   - 정산 처리: SELECT process_seller_payout();';
  RAISE NOTICE '';
  RAISE NOTICE '⏰ 자동 실행을 위해서는 Supabase Cron Job을 설정하세요:';
  RAISE NOTICE '   - pg_cron 확장 설치';
  RAISE NOTICE '   - 매일 실행되도록 스케줄 설정';
END $$;

-- ===================================
-- Supabase Cron Job 설정 (선택적)
-- ===================================
-- 
-- Supabase Dashboard → Database → Extensions → pg_cron 활성화
-- 
-- 그 다음 아래 SQL 실행:
-- 
-- SELECT cron.schedule(
--   'auto-complete-escrow',
--   '0 */6 * * *',  -- 6시간마다 실행
--   $$SELECT auto_complete_escrowed_transactions()$$
-- );
-- 
-- SELECT cron.schedule(
--   'process-payouts',
--   '0 1 * * *',  -- 매일 새벽 1시 실행
--   $$SELECT process_seller_payout()$$
-- );
-- ===================================


