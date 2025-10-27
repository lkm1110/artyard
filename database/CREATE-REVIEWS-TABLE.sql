-- ============================================
-- CREATE REVIEWS TABLE
-- ============================================
-- 구매자가 작품에 대한 리뷰를 남기는 테이블

-- 1. reviews 테이블 생성
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 거래당 하나의 리뷰만 작성 가능
  UNIQUE(transaction_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reviews_artwork ON reviews(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_transaction ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성

-- 모든 사람이 리뷰 조회 가능 (공개)
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO public
USING (true);

-- 구매자만 리뷰 작성 가능 (자신이 구매한 작품에 대해서만)
DROP POLICY IF EXISTS "Buyers can create reviews" ON reviews;
CREATE POLICY "Buyers can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_id
    AND transactions.buyer_id = auth.uid()
    AND transactions.status = 'completed'
  )
);

-- 작성자만 자신의 리뷰 수정 가능
DROP POLICY IF EXISTS "Reviewers can update own reviews" ON reviews;
CREATE POLICY "Reviewers can update own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

-- 작성자만 자신의 리뷰 삭제 가능
DROP POLICY IF EXISTS "Reviewers can delete own reviews" ON reviews;
CREATE POLICY "Reviewers can delete own reviews"
ON reviews FOR DELETE
TO authenticated
USING (reviewer_id = auth.uid());

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- 6. 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ reviews 테이블 생성 완료!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '기능:';
  RAISE NOTICE '  - 구매 완료된 작품에 대한 리뷰 작성';
  RAISE NOTICE '  - 1-5점 평점 시스템';
  RAISE NOTICE '  - 한 거래당 하나의 리뷰만 작성 가능';
  RAISE NOTICE '  - 모든 사용자가 리뷰 조회 가능';
  RAISE NOTICE '  - 작성자만 수정/삭제 가능';
  RAISE NOTICE '===========================================';
END $$;

-- 7. 테이블 확인
SELECT 
  table_name,
  'Table created successfully' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'reviews';

