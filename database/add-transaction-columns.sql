-- ===================================
-- Add missing columns to transactions table
-- ===================================
-- 구매자 연락처 정보 및 배송 메모를 위한 컬럼 추가

-- 1. 구매자 정보 컬럼 추가
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS buyer_name TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS buyer_address TEXT;

-- 2. 배송 메모 컬럼 추가
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- 3. 결제 관련 컬럼 추가 (없는 경우에만)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_fee INTEGER DEFAULT 0;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS seller_amount INTEGER;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS auto_confirm_at TIMESTAMPTZ;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_artwork_id ON transactions(artwork_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 5. 결과 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('buyer_name', 'buyer_phone', 'buyer_address', 'delivery_notes', 'payment_fee', 'seller_amount', 'auto_confirm_at')
ORDER BY column_name;

-- 6. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ transactions 테이블 컬럼 추가 완료!';
  RAISE NOTICE '✅ buyer_name, buyer_phone, buyer_address 추가됨';
  RAISE NOTICE '✅ delivery_notes, payment_fee, seller_amount 추가됨';
  RAISE NOTICE '✅ auto_confirm_at (에스크로 자동 완료 시간) 추가됨';
  RAISE NOTICE '📱 이제 결제가 정상적으로 작동합니다!';
END $$;


