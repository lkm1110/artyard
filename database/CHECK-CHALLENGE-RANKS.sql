-- 챌린지 순위 확인 쿼리
-- 종료된 챌린지의 final_rank가 설정되었는지 확인

-- 1. 종료된 챌린지 확인
SELECT 
  id,
  title,
  status,
  end_date,
  CASE 
    WHEN end_date < NOW() THEN 'ENDED'
    ELSE 'ACTIVE'
  END as actual_status
FROM challenges
WHERE end_date < NOW()
ORDER BY end_date DESC
LIMIT 5;

-- 2. 종료된 챌린지의 작품과 순위 확인
SELECT 
  c.id as challenge_id,
  c.title as challenge_title,
  c.end_date,
  ce.id as entry_id,
  ce.votes_count,
  ce.final_rank,
  a.title as artwork_title,
  p.handle as artist
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
LEFT JOIN artworks a ON ce.artwork_id = a.id
LEFT JOIN profiles p ON ce.author_id = p.id
WHERE c.end_date < NOW()
ORDER BY c.end_date DESC, ce.votes_count DESC
LIMIT 20;

-- 3. final_rank가 NULL인 종료된 챌린지 작품들
SELECT 
  c.title as challenge,
  ce.votes_count,
  ce.final_rank,
  a.title as artwork
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
LEFT JOIN artworks a ON ce.artwork_id = a.id
WHERE c.end_date < NOW()
  AND ce.final_rank IS NULL
ORDER BY c.end_date DESC, ce.votes_count DESC;

