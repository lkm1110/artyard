-- ===================================
-- 경매 생성 에러 해결
-- auction_reserve_price가 NULL인 경우 수정
-- ===================================

-- 1. 문제 확인: auction_reserve_price가 NULL인 작품 찾기
SELECT 
  ce.id,
  c.title as challenge_title,
  a.title as artwork_title,
  ce.final_rank,
  ce.auction_reserve_price,
  a.price as artwork_price
FROM challenge_entries ce
JOIN challenges c ON ce.challenge_id = c.id
JOIN artworks a ON ce.artwork_id = a.id
WHERE ce.challenge_id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
  AND ce.final_rank IN (1, 2, 3);

-- 2. 해결: NULL인 경우 작품 가격(artwork.price)을 사용하여 업데이트
UPDATE challenge_entries ce
SET auction_reserve_price = COALESCE(a.price, 100.00)
FROM artworks a
WHERE ce.artwork_id = a.id
  AND ce.challenge_id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
  AND ce.final_rank IN (1, 2, 3)
  AND ce.auction_reserve_price IS NULL;

-- 3. 재확인
SELECT 
  ce.id,
  a.title as artwork_title,
  ce.final_rank,
  ce.auction_reserve_price,
  ce.is_winner,
  ce.is_top_10
FROM challenge_entries ce
JOIN artworks a ON ce.artwork_id = a.id
WHERE ce.challenge_id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
  AND ce.final_rank IN (1, 2, 3)
ORDER BY ce.final_rank;

-- ===================================
-- 참고: 작품 가격이 없는 경우
-- ===================================

-- 작품 자체에 price가 NULL인지 확인
SELECT 
  a.id,
  a.title,
  a.price,
  ce.final_rank
FROM artworks a
JOIN challenge_entries ce ON a.id = ce.artwork_id
WHERE ce.challenge_id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae';

-- 작품 가격도 NULL이면 수동으로 설정
UPDATE artworks
SET price = 100.00
WHERE id IN (
  SELECT artwork_id 
  FROM challenge_entries 
  WHERE challenge_id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
)
AND price IS NULL;

