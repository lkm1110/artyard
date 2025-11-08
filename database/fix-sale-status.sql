-- ===================================
-- Add sale_status column and set up sales workflow
-- ===================================

-- 1. sold_at과 buyer_id 컬럼 먼저 추가 (없는 경우에만)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- 2. sale_status 컬럼 추가 (없는 경우에만)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT 'available';

-- 3. sale_status check constraint 추가
ALTER TABLE artworks 
DROP CONSTRAINT IF EXISTS artworks_sale_status_check;

ALTER TABLE artworks 
ADD CONSTRAINT artworks_sale_status_check 
CHECK (sale_status IN ('available', 'sold', 'reserved', 'not_for_sale'));

-- 4. 기존 작품들의 sale_status 설정
UPDATE artworks
SET sale_status = CASE
  WHEN sold_at IS NOT NULL THEN 'sold'
  ELSE 'available'
END
WHERE sale_status IS NULL OR sale_status = '';

-- 5. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_artworks_sale_status ON artworks(sale_status);
CREATE INDEX IF NOT EXISTS idx_artworks_buyer_id ON artworks(buyer_id);
CREATE INDEX IF NOT EXISTS idx_artworks_sold_at ON artworks(sold_at);

-- 6. 결과 확인
SELECT 
  sale_status,
  COUNT(*) as count
FROM artworks
GROUP BY sale_status
ORDER BY count DESC;

-- 7. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ sale_status 컬럼 추가 완료!';
  RAISE NOTICE '✅ 판매 상태: available, sold, reserved, not_for_sale';
  RAISE NOTICE '✅ sold_at, buyer_id 컬럼 추가 완료!';
  RAISE NOTICE '📱 이제 작품 구매 및 판매 완료 처리가 가능합니다!';
END $$;

