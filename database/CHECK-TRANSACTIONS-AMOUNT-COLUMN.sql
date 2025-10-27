-- transactions 테이블의 금액 관련 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
  AND (
    column_name LIKE '%amount%' OR
    column_name LIKE '%price%' OR
    column_name LIKE '%total%' OR
    column_name LIKE '%revenue%'
  )
ORDER BY ordinal_position;

-- 또는 모든 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

