-- ===================================
-- Challenge Votes - 1계정 1작품 투표 제한
-- ===================================

-- 1. 기존 중복 투표 제거 (최신 것만 유지)
DELETE FROM challenge_votes a
USING challenge_votes b
WHERE a.id < b.id
AND a.challenge_id = b.challenge_id
AND a.voter_id = b.voter_id;

-- 2. UNIQUE constraint 추가 (1계정당 1작품만 투표)
ALTER TABLE challenge_votes
DROP CONSTRAINT IF EXISTS challenge_votes_unique_vote;

ALTER TABLE challenge_votes
ADD CONSTRAINT challenge_votes_unique_vote
UNIQUE (challenge_id, voter_id);

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_challenge_votes_voter
ON challenge_votes(voter_id, challenge_id);

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Challenge Votes 제약 조건 업데이트 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1계정당 1작품만 투표 가능';
  RAISE NOTICE '기존 중복 투표 제거됨';
  RAISE NOTICE '========================================';
END $$;

