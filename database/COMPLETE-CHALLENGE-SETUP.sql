-- ===================================
-- 챌린지 완료 설정 (경매 준비)
-- ===================================

-- 1. 챌린지 상태를 'ended'로 변경 (앱에서 'Ended' 표시)
UPDATE challenges
SET status = 'ended'
WHERE id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae';

-- 2. 최종 확인: Top 3 작품 (경매 대상)
SELECT 
  c.title as challenge_title,
  c.status as challenge_status,
  ce.final_rank,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.votes_count,
  ce.auction_reserve_price,
  ce.is_winner,
  ce.is_top_10
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
WHERE c.id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
  AND ce.final_rank IN (1, 2, 3)
ORDER BY ce.final_rank;

-- 3. 경매에 추가 가능한 작품 확인 (Auction Management에서 보이는 목록)
SELECT 
  ce.id as entry_id,
  ce.challenge_id,
  c.title as challenge_title,
  ce.artwork_id,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.final_rank,
  ce.auction_reserve_price,
  ce.votes_count,
  CASE 
    WHEN ai.id IS NOT NULL THEN true 
    ELSE false 
  END as is_in_auction
FROM challenge_entries ce
JOIN challenges c ON ce.challenge_id = c.id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
LEFT JOIN auction_items ai ON ce.artwork_id = ai.artwork_id
WHERE ce.final_rank IN (1, 2, 3)
  AND c.id = '478f6cb9-af6b-4d99-b9c1-2c0b86f2f1ae'
ORDER BY ce.final_rank;

-- ===================================
-- 결과 해석:
-- ===================================
-- challenge_status: 'ended' → ✅ 완료됨
-- final_rank: 1, 2, 3 → ✅ Top 3 선정됨
-- auction_reserve_price: NOT NULL → ✅ 최소 입찰가 설정됨
-- is_in_auction: false → ✅ 아직 경매에 추가 안됨 (추가 가능!)
-- ===================================

