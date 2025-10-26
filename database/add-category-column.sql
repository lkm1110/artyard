-- artworks 테이블에 category 컬럼 추가

DO $$
BEGIN
    -- category 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.artworks
        ADD COLUMN category TEXT;
        
        RAISE NOTICE 'category 컬럼이 artworks 테이블에 추가되었습니다.';
        
        -- 기존 데이터에 기본 category 설정 (material 기반으로 추측)
        UPDATE public.artworks
        SET category = CASE 
            WHEN material ILIKE '%paint%' OR material ILIKE '%oil%' OR material ILIKE '%acrylic%' OR material ILIKE '%watercolor%' THEN 'Painting'
            WHEN material ILIKE '%sculpture%' OR material ILIKE '%ceramic%' OR material ILIKE '%clay%' THEN 'Sculpture'
            WHEN material ILIKE '%photo%' THEN 'Photography'
            WHEN material ILIKE '%digital%' OR material ILIKE '%3d%' THEN 'Digital Art'
            WHEN material ILIKE '%draw%' OR material ILIKE '%pencil%' OR material ILIKE '%charcoal%' THEN 'Drawing'
            WHEN material ILIKE '%print%' OR material ILIKE '%screen%' THEN 'Print'
            WHEN material ILIKE '%mixed%' OR material ILIKE '%collage%' THEN 'Mixed Media'
            ELSE 'Other'
        END
        WHERE category IS NULL;
        
        RAISE NOTICE '기존 artworks 데이터에 category가 설정되었습니다.';
    ELSE
        RAISE NOTICE 'category 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 인덱스 추가 (검색 성능 향상)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'artworks' 
        AND indexname = 'idx_artworks_category'
    ) THEN
        CREATE INDEX idx_artworks_category ON public.artworks(category);
        RAISE NOTICE 'idx_artworks_category 인덱스가 생성되었습니다.';
    ELSE
        RAISE NOTICE 'idx_artworks_category 인덱스가 이미 존재합니다.';
    END IF;
END $$;

