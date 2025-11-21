-- Fix Challenge Status Constraint
-- Add 'voting' status to valid_challenge_status constraint

-- 1. Drop existing constraint
ALTER TABLE challenges 
DROP CONSTRAINT IF EXISTS valid_challenge_status;

-- 2. Add new constraint with 'voting' status
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_status 
CHECK (status IN ('upcoming', 'active', 'voting', 'ended', 'archived'));

-- 3. Update any existing challenges
-- (optional: if you have challenges that should be in voting status)
-- UPDATE challenges SET status = 'voting' WHERE status = 'ended' AND voting_end_date > NOW();

-- Verify
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_challenge_status';

-- Show all challenge statuses
SELECT status, COUNT(*) as count 
FROM challenges 
GROUP BY status;

