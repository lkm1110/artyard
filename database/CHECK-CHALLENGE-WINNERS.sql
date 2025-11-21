-- ===================================
-- 챌린지 우승작 확인 쿼리
-- ===================================

-- 1. 최근 종료된 챌린지 확인
SELECT 
  c.id,
  c.title,
  c.status,
  c.end_date,
  COUNT(ce.id) as total_entries,
  COUNT(CASE WHEN ce.is_winner = true THEN 1 END) as winners_count,
  COUNT(CASE WHEN ce.is_top_10 = true THEN 1 END) as top_10_count
FROM challenges c
LEFT JOIN challenge_entries ce ON c.id = ce.challenge_id
WHERE c.status IN ('ended', 'voting', 'archived')
GROUP BY c.id, c.title, c.status, c.end_date
ORDER BY c.end_date DESC
LIMIT 5;

-- 2. 우승작 상세 정보 (최근 챌린지)
SELECT 
  c.title as challenge_title,
  c.status as challenge_status,
  ce.id as entry_id,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.votes_count,
  ce.is_winner,
  ce.is_top_10,
  ce.final_rank,
  ce.auction_reserve_price
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
WHERE c.status IN ('ended', 'voting', 'archived')
  AND ce.is_top_10 = true
ORDER BY c.end_date DESC, ce.final_rank ASC
LIMIT 10;

-- 3. 경매에 추가되지 않은 우승작만 (Auction Management 화면에서 사용하는 쿼리와 동일)
SELECT 
  ce.id,
  ce.challenge_id,
  c.title as challenge_title,
  ce.artwork_id,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.auction_reserve_price,
  ce.votes_count,
  ce.is_winner,
  ce.final_rank,
  CASE 
    WHEN ai.id IS NOT NULL THEN true 
    ELSE false 
  END as is_in_auction
FROM challenge_entries ce
JOIN challenges c ON ce.challenge_id = c.id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
LEFT JOIN auction_items ai ON ce.artwork_id = ai.artwork_id
WHERE ce.is_winner = true
  AND ce.final_rank = 1
ORDER BY ce.created_at DESC;

-- 4. Top 3 확인 (1, 2, 3등)
SELECT 
  c.title as challenge_title,
  ce.final_rank,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.votes_count,
  ce.is_winner,
  ce.is_top_10,
  ce.auction_reserve_price
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
WHERE c.status IN ('ended', 'voting', 'archived')
  AND ce.final_rank IN (1, 2, 3)
ORDER BY c.end_date DESC, ce.final_rank ASC;

-- ===================================
-- 문제 진단
-- ===================================

-- 문제 1: 우승자가 선정되지 않았을 경우
-- → announce_challenge_winner() 실행 필요

-- 문제 2: final_rank가 없을 경우
-- → select_top_10_entries() 실행 필요

-- 문제 3: auction_reserve_price가 NULL일 경우
-- → 작품 업로드 시 가격을 입력하지 않음

-- 문제 4: 쿼리 결과가 비어있을 경우
-- → 챌린지가 아직 종료되지 않았거나 참가작이 없음

