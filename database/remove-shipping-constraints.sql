-- ===================================
-- Remove old shipping-related NOT NULL constraints
-- ===================================
-- 배송 시스템 제거 후 남아있는 NOT NULL 제약조건 제거
-- (buyer-seller 직접 협의 방식으로 변경되었으므로 불필요)

-- 1. 현재 NOT NULL 제약조건 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name LIKE '%shipping%'
ORDER BY column_name;

-- 2. shipping 관련 컬럼들의 NOT NULL 제약조건 제거
ALTER TABLE transactions 
ALTER COLUMN shipping_recipient DROP NOT NULL;

ALTER TABLE transactions 
ALTER COLUMN shipping_phone DROP NOT NULL;

ALTER TABLE transactions 
ALTER COLUMN shipping_postal_code DROP NOT NULL;

ALTER TABLE transactions 
ALTER COLUMN shipping_address DROP NOT NULL;

-- 3. shipping_address_detail은 이미 NULL 허용일 수 있음 (에러 무시)
DO $$ 
BEGIN
  ALTER TABLE transactions 
  ALTER COLUMN shipping_address_detail DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'shipping_address_detail: already nullable or does not exist';
END $$;

-- 4. shipping_memo도 NULL 허용
DO $$ 
BEGIN
  ALTER TABLE transactions 
  ALTER COLUMN shipping_memo DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'shipping_memo: already nullable or does not exist';
END $$;

-- 5. tracking_number, carrier 등도 NULL 허용
DO $$ 
BEGIN
  ALTER TABLE transactions 
  ALTER COLUMN tracking_number DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'tracking_number: already nullable or does not exist';
END $$;

DO $$ 
BEGIN
  ALTER TABLE transactions 
  ALTER COLUMN carrier DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'carrier: already nullable or does not exist';
END $$;

-- 6. 변경 후 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULL 허용'
    WHEN is_nullable = 'NO' THEN '❌ NOT NULL'
  END as status
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND (column_name LIKE '%shipping%' OR column_name IN ('tracking_number', 'carrier'))
ORDER BY column_name;

-- 7. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ 배송 관련 NOT NULL 제약조건 제거 완료!';
  RAISE NOTICE '✅ shipping_recipient, shipping_phone 등이 이제 NULL 허용';
  RAISE NOTICE '💡 배송은 buyer-seller 간 직접 협의로 처리됩니다';
  RAISE NOTICE '📱 이제 결제가 정상적으로 작동합니다!';
END $$;


