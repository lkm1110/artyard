-- material 제약 조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.artworks'::regclass
AND conname = 'artworks_material_check';

-- artworks 테이블의 material 컬럼 정보 확인  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
AND column_name = 'material'
AND table_schema = 'public';

-- 기존 artworks에서 사용되는 material 값들 확인
SELECT DISTINCT material, COUNT(*) as count
FROM artworks 
GROUP BY material
ORDER BY count DESC;

RAISE NOTICE '=== Material 제약 조건 진단 완료 ===';
