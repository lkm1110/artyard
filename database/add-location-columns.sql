/**
 * Add Location Columns to Artworks Table
 * 작품 위치 정보를 저장하기 위한 컬럼 추가
 */

-- 1. Location 컬럼 추가
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_full TEXT;

-- 2. Location 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_artworks_location_country 
ON artworks(location_country) 
WHERE location_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_location_city 
ON artworks(location_city) 
WHERE location_city IS NOT NULL;

-- 3. 확인
DO $$
BEGIN
  RAISE NOTICE '✅ Location 컬럼이 성공적으로 추가되었습니다!';
  RAISE NOTICE '   - location_country: 국가 (예: South Korea, United States)';
  RAISE NOTICE '   - location_city: 도시 (예: Seoul, New York)';
  RAISE NOTICE '   - location_full: 전체 주소 텍스트 (예: Seoul, South Korea)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 인덱스도 생성되어 검색 성능이 향상되었습니다!';
END $$;
