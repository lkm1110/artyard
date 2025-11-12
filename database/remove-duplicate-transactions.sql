-- Remove Duplicate Transactions
-- Keep only the earliest transaction for each duplicate set

-- 1. Check for duplicates first
SELECT 
  artwork_id, 
  buyer_id, 
  COUNT(*) as duplicate_count
FROM transactions
GROUP BY artwork_id, buyer_id
HAVING COUNT(*) > 1;

-- 2. Delete duplicates, keeping only the oldest record for each (artwork_id, buyer_id) pair
DELETE FROM transactions
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY artwork_id, buyer_id 
        ORDER BY created_at ASC  -- Keep the oldest transaction
      ) as row_num
    FROM transactions
  ) t
  WHERE row_num > 1  -- Delete all but the first (oldest) record
);

-- 3. Verify duplicates are removed
SELECT 
  artwork_id, 
  buyer_id, 
  COUNT(*) as count_after_cleanup
FROM transactions
GROUP BY artwork_id, buyer_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if successful

