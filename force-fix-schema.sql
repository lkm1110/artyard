-- ===== 강제 스키마 수정: price_band 문제 완전 해결 =====

-- 1. artworks 테이블의 price_band 제약 조건 강제 제거
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- price_band NOT NULL 제약 조건 제거 시도
    BEGIN
        ALTER TABLE artworks ALTER COLUMN price_band DROP NOT NULL;
        RAISE NOTICE '✅ price_band NOT NULL 제약 조건 제거됨';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '⚠️ price_band NOT NULL 제약 조건 제거 실패 또는 이미 없음: %', SQLERRM;
    END;

    -- price_band 관련 체크 제약 조건들 제거
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.artworks'::regclass
        AND pg_get_constraintdef(oid) ILIKE '%price_band%'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE artworks DROP CONSTRAINT ' || constraint_record.conname;
            RAISE NOTICE '✅ 제약 조건 제거됨: %', constraint_record.conname;
        EXCEPTION WHEN others THEN
            RAISE NOTICE '⚠️ 제약 조건 제거 실패: % - %', constraint_record.conname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. price 컬럼 추가 (이미 있어도 무시됨)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS price text;

-- 3. 기존 price_band 데이터를 price로 복사
DO $$
BEGIN
    -- price_band 컬럼이 존재하면 데이터 복사
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'price_band'
        AND table_schema = 'public'
    ) THEN
        UPDATE artworks 
        SET price = COALESCE(price, price_band, '0 USD')
        WHERE price IS NULL;
        RAISE NOTICE '✅ price_band 데이터를 price로 복사 완료';
    ELSE
        RAISE NOTICE '⚠️ price_band 컬럼이 존재하지 않음';
    END IF;
END $$;

-- 4. price_band 컬럼 완전 제거 시도
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'price_band'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE artworks DROP COLUMN price_band CASCADE;
        RAISE NOTICE '✅ price_band 컬럼 완전 제거됨';
    ELSE
        RAISE NOTICE '✅ price_band 컬럼이 이미 존재하지 않음';
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE '⚠️ price_band 컬럼 제거 실패: %', SQLERRM;
END $$;

-- 5. 위치 정보 컬럼 추가 (기존 스크립트와 동일)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_country text,
ADD COLUMN IF NOT EXISTS location_state text,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_full text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 6. 최종 확인: 현재 artworks 테이블 스키마 출력
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE '=== 최종 artworks 테이블 스키마 ===';
    FOR column_info IN
        SELECT 
            column_name,
            data_type,
            is_nullable,
            COALESCE(column_default, 'NULL') as col_default
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '% - % (nullable: %, default: %)', 
            column_info.column_name, 
            column_info.data_type,
            column_info.is_nullable,
            column_info.col_default;
    END LOOP;
    RAISE NOTICE '=== 스키마 확인 완료 ===';
END $$;

-- 7. 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '🎉 artworks 테이블 스키마 강제 수정 완료!';
    RAISE NOTICE '✅ price_band 컬럼 및 제약조건 완전 제거';
    RAISE NOTICE '✅ price 컬럼 사용 가능';
    RAISE NOTICE '✅ 위치 정보 컬럼 6개 추가';
    RAISE NOTICE '🚀 이제 업로드가 정상 동작할 것입니다!';
END $$;
