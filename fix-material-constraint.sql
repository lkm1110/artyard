-- ===== Material 제약 조건 문제 해결 =====

-- 1. 현재 material 제약 조건 확인
DO $$
DECLARE
    constraint_record RECORD;
    constraint_def text;
BEGIN
    RAISE NOTICE '=== Material 제약 조건 진단 시작 ===';
    
    -- artworks_material_check 제약 조건 찾기
    FOR constraint_record IN
        SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'public.artworks'::regclass
        AND conname LIKE '%material%'
    LOOP
        RAISE NOTICE '발견된 Material 제약조건: % - %', constraint_record.constraint_name, constraint_record.constraint_definition;
    END LOOP;

    -- material 관련 모든 제약 조건 확인
    FOR constraint_record IN
        SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'public.artworks'::regclass
        AND pg_get_constraintdef(oid) ILIKE '%material%'
    LOOP
        RAISE NOTICE 'Material 관련 제약조건: % - %', constraint_record.constraint_name, constraint_record.constraint_definition;
    END LOOP;
END $$;

-- 2. 기존 artworks의 material 값들 확인
DO $$
DECLARE
    material_record RECORD;
BEGIN
    RAISE NOTICE '=== 기존 Material 값들 ===';
    
    FOR material_record IN
        SELECT DISTINCT material, COUNT(*) as count
        FROM artworks 
        GROUP BY material
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Material: % (count: %)', material_record.material, material_record.count;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE '기존 작품 데이터가 없습니다.';
    END IF;
END $$;

-- 3. artworks_material_check 제약 조건 제거
DO $$
BEGIN
    -- artworks_material_check 제약 조건 제거 시도
    BEGIN
        ALTER TABLE artworks DROP CONSTRAINT artworks_material_check;
        RAISE NOTICE '✅ artworks_material_check 제약 조건 제거됨';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '⚠️ artworks_material_check 제약 조건 제거 실패 또는 이미 없음: %', SQLERRM;
    END;
    
    -- 모든 material 관련 제약 조건 제거 시도
    DECLARE
        constraint_name text;
    BEGIN
        FOR constraint_name IN
            SELECT conname
            FROM pg_constraint 
            WHERE conrelid = 'public.artworks'::regclass
            AND pg_get_constraintdef(oid) ILIKE '%material%'
            AND contype = 'c' -- check constraint만
        LOOP
            BEGIN
                EXECUTE 'ALTER TABLE artworks DROP CONSTRAINT ' || constraint_name;
                RAISE NOTICE '✅ Material 관련 제약 조건 제거됨: %', constraint_name;
            EXCEPTION WHEN others THEN
                RAISE NOTICE '⚠️ 제약 조건 제거 실패: % - %', constraint_name, SQLERRM;
            END;
        END LOOP;
    END;
END $$;

-- 4. material 컬럼을 단순 text로 재정의 (제약 조건 없이)
DO $$
BEGIN
    -- material 컬럼이 NOT NULL인지 확인하고 유지
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'material'
        AND is_nullable = 'NO'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ material 컬럼은 이미 NOT NULL text 타입입니다';
    ELSE
        ALTER TABLE artworks ALTER COLUMN material TYPE text;
        ALTER TABLE artworks ALTER COLUMN material SET NOT NULL;
        RAISE NOTICE '✅ material 컬럼을 NOT NULL text로 설정함';
    END IF;
END $$;

-- 5. 새로운 Material 값들에 대한 참고 정보 출력
DO $$
BEGIN
    RAISE NOTICE '=== 허용되는 Material 값들 (프론트엔드 기준) ===';
    RAISE NOTICE 'Illustration, Photography, Printmaking, Craft, Design Poster, Drawing, Other';
    RAISE NOTICE '=== 이제 모든 Material 값이 허용됩니다 ===';
END $$;

-- 6. 최종 확인
DO $$
DECLARE
    constraint_count integer;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'public.artworks'::regclass
    AND pg_get_constraintdef(oid) ILIKE '%material%'
    AND contype = 'c';
    
    IF constraint_count = 0 THEN
        RAISE NOTICE '🎉 모든 Material 제약 조건이 성공적으로 제거되었습니다!';
        RAISE NOTICE '✅ 이제 "Illustration" 값으로 업로드가 가능합니다!';
    ELSE
        RAISE NOTICE '⚠️ 아직 % 개의 Material 제약 조건이 남아있습니다', constraint_count;
    END IF;
END $$;
