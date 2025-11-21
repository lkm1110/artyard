-- ===================================
-- Challenge 익명 시스템 & 경매 개선
-- 1. 작가 익명 (Top 3만 공개)
-- 2. 경매 최소 금액 (Reserve Price)
-- 3. 1등만 경매 대상
-- ===================================

-- 1. challenge_entries에 auction_reserve_price 컬럼 추가
ALTER TABLE challenge_entries
ADD COLUMN IF NOT EXISTS auction_reserve_price DECIMAL(10,2);

-- 2. auction_items에 reserve_price를 challenge_entries에서 가져오도록 설정
-- (이미 reserve_price 컬럼이 있음)

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_challenge_entries_winner 
ON challenge_entries(challenge_id, is_winner) 
WHERE is_winner = true;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Challenge 익명 시스템 업데이트 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '추가된 기능:';
  RAISE NOTICE '  - 경매 최소 금액 (auction_reserve_price)';
  RAISE NOTICE '  - 작가 익명 (클라이언트에서 처리)';
  RAISE NOTICE '  - 1등만 경매 대상 (클라이언트에서 처리)';
  RAISE NOTICE '========================================';
END $$;

