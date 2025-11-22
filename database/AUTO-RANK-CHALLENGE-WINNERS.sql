-- =====================================================
-- 챌린지 종료 시 자동 순위 매기기
-- =====================================================
-- 종료된 챌린지의 작품들에게 votes_count 기준으로 순위 부여

-- 1. 특정 챌린지의 순위 매기기 함수
CREATE OR REPLACE FUNCTION rank_challenge_winners(challenge_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- votes_count 기준으로 순위 매기기
  WITH ranked_entries AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY votes_count DESC, created_at ASC) as rank
    FROM challenge_entries
    WHERE challenge_id = challenge_uuid
  )
  UPDATE challenge_entries ce
  SET final_rank = re.rank
  FROM ranked_entries re
  WHERE ce.id = re.id;
  
  RAISE NOTICE '✅ Challenge % ranked successfully', challenge_uuid;
END;
$$;

-- 2. 종료된 모든 챌린지의 순위 매기기 함수
CREATE OR REPLACE FUNCTION rank_all_ended_challenges()
RETURNS TABLE (
  challenge_id UUID,
  challenge_title TEXT,
  entries_ranked INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  challenge_record RECORD;
  ranked_count INTEGER;
BEGIN
  -- 종료되었지만 순위가 매겨지지 않은 챌린지 찾기
  -- status = 'ended' OR end_date < NOW() 둘 다 확인
  FOR challenge_record IN
    SELECT DISTINCT c.id, c.title
    FROM challenges c
    JOIN challenge_entries ce ON c.id = ce.challenge_id
    WHERE (c.status = 'ended' OR c.end_date < NOW())
      AND ce.final_rank IS NULL
  LOOP
    -- 순위 매기기
    PERFORM rank_challenge_winners(challenge_record.id);
    
    -- 매겨진 작품 수 확인
    SELECT COUNT(*) INTO ranked_count
    FROM challenge_entries
    WHERE challenge_id = challenge_record.id
      AND final_rank IS NOT NULL;
    
    -- 결과 반환
    challenge_id := challenge_record.id;
    challenge_title := challenge_record.title;
    entries_ranked := ranked_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 3. 매일 자동 실행: 종료된 챌린지 순위 매기기 (pg_cron 사용)
-- 주의: pg_cron extension이 활성화되어 있어야 함
-- Supabase Free Tier에는 pg_cron이 없을 수 있음
-- 필요시 수동 실행: SELECT * FROM rank_all_ended_challenges();

/*
-- pg_cron이 설치된 경우에만 실행 (선택 사항)
SELECT cron.schedule(
  'auto-rank-challenges',
  '0 1 * * *', -- 매일 01:00 UTC (한국시간 10:00)
  $$
  SELECT rank_all_ended_challenges();
  $$
);
*/

-- =====================================================
-- 사용 방법
-- =====================================================

-- 1. 특정 챌린지의 순위 매기기:
-- SELECT rank_challenge_winners('challenge-uuid-here');

-- 2. 종료된 모든 챌린지 순위 매기기:
-- SELECT * FROM rank_all_ended_challenges();

-- 3. 수동 실행: 현재 종료된 챌린지들에 순위 부여
SELECT * FROM rank_all_ended_challenges();

-- =====================================================
-- 순위 확인
-- =====================================================

-- 종료된 챌린지의 Top 3 확인
SELECT 
  c.title as challenge,
  a.title as artwork,
  p.handle as artist,
  ce.votes_count as votes,
  ce.final_rank as rank
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
LEFT JOIN artworks a ON ce.artwork_id = a.id
LEFT JOIN profiles p ON ce.author_id = p.id
WHERE c.end_date < NOW()
  AND ce.final_rank <= 3
ORDER BY c.end_date DESC, ce.final_rank ASC;

-- 권한 부여
GRANT EXECUTE ON FUNCTION rank_challenge_winners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rank_all_ended_challenges() TO authenticated;

