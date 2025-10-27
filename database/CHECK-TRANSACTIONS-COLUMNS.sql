-- transactions 테이블의 모든 컬럼 확인
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- transactions 테이블에 status 컬럼이 있는지 확인
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'status'
    ) AS status_column_exists;

-- 샘플 데이터 확인 (1개만)
SELECT * FROM public.transactions LIMIT 1;

