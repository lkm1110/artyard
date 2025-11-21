-- ===================================
-- "Sea" 챌린지 상세 확인
-- ===================================

-- 1. "Sea" 챌린지 찾기
SELECT 
  id,
  title,
  status,
  topic,
  start_date,
  end_date,
  created_at
FROM challenges
WHERE title ILIKE '%sea%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 해당 챌린지의 참가작 확인
SELECT 
  ce.id as entry_id,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.votes_count,
  ce.is_top_10,
  ce.is_winner,
  ce.final_rank,
  ce.auction_reserve_price,
  ce.created_at
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
WHERE c.title ILIKE '%sea%'
ORDER BY ce.created_at DESC;

-- 3. 만약 결과가 비어있다면 → 작품이 challenge_entries에 등록되지 않은 것!
-- 4. 만약 작품은 있는데 final_rank가 NULL이면 → announce_challenge_winner() 실행 필요!

