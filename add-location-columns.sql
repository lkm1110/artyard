-- ================================
-- ArtYard 위치 정보 컬럼 추가
-- 작품에 위치 정보 저장 기능
-- ================================

-- artworks 테이블에 위치 정보 컬럼 추가
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_district TEXT,
ADD COLUMN IF NOT EXISTS location_street TEXT,
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_full TEXT,
ADD COLUMN IF NOT EXISTS location_accuracy FLOAT,
ADD COLUMN IF NOT EXISTS location_timestamp BIGINT;

-- 위치 정보 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_artworks_location_city 
ON artworks(location_city) WHERE location_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_location_country 
ON artworks(location_country) WHERE location_country IS NOT NULL;

-- 지리적 검색을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_coordinates 
ON artworks(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN artworks.location_latitude IS '위도 (소수점 8자리까지)';
COMMENT ON COLUMN artworks.location_longitude IS '경도 (소수점 8자리까지)';
COMMENT ON COLUMN artworks.location_country IS '국가명';
COMMENT ON COLUMN artworks.location_state IS '주/도';
COMMENT ON COLUMN artworks.location_city IS '시/군/구';
COMMENT ON COLUMN artworks.location_district IS '동/면/읍';
COMMENT ON COLUMN artworks.location_street IS '도로명';
COMMENT ON COLUMN artworks.location_name IS '장소명/건물명';
COMMENT ON COLUMN artworks.location_full IS '전체 주소 텍스트';
COMMENT ON COLUMN artworks.location_accuracy IS 'GPS 정확도 (미터)';
COMMENT ON COLUMN artworks.location_timestamp IS '위치 수집 시간 (타임스탬프)';
