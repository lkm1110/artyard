/**
 * Update Year Check Constraint for Classic Artworks
 * 고전 작품을 위해 연도 제약 조건 업데이트 (1900 → 1000)
 */

-- 1. 기존 constraint 제거
ALTER TABLE artworks 
DROP CONSTRAINT IF EXISTS artworks_year_check;

-- 2. 새로운 constraint 추가 (1000년부터 현재 연도까지)
ALTER TABLE artworks 
ADD CONSTRAINT artworks_year_check 
CHECK (
  year >= 1000 
  AND year <= EXTRACT(YEAR FROM CURRENT_DATE)
);

-- 3. 확인
DO $$
BEGIN
  RAISE NOTICE '✅ Year constraint가 성공적으로 업데이트되었습니다!';
  RAISE NOTICE '   Old: year >= 1900';
  RAISE NOTICE '   New: year >= 1000';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 이제 고전 작품을 업로드할 수 있습니다:';
  RAISE NOTICE '   - Renaissance (1400s-1600s)';
  RAISE NOTICE '   - Baroque (1600s-1750s)';
  RAISE NOTICE '   - Impressionism (1860s-1880s)';
  RAISE NOTICE '   - Vintage Photography (1800s)';
END $$;

