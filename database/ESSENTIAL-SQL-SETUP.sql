-- ===================================
-- ArtYard 필수 SQL 설정 (한번에 실행)
-- ===================================
-- 
-- 이 파일은 3개의 필수 SQL을 하나로 합친 것입니다:
-- 1. settlements-schema.sql (정산 시스템)
-- 2. add-message-read-status.sql (메시지 읽음)
-- 3. COMPLETE-RLS-REMOVAL.sql (RLS 제거)
--

-- ===================================
-- PART 1: 정산 시스템 (Settlements)
-- ===================================

-- 정산 테이블
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 정산 기간
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 금액 정보
  total_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 실제 정산액
  
  -- 거래 건수
  transaction_count INTEGER NOT NULL DEFAULT 0,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'processing', 'completed', 'failed')
  ),
  
  -- 은행 정보
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  
  -- 처리 정보
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 메모
  admin_note TEXT,
  reject_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_artist_id ON settlements(artist_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- 작가는 자신의 정산만 조회
DROP POLICY IF EXISTS "Artists can view own settlements" ON settlements;
CREATE POLICY "Artists can view own settlements"
  ON settlements FOR SELECT
  USING (artist_id = auth.uid());

-- 관리자는 모두 조회/수정 가능
DROP POLICY IF EXISTS "Admins can manage all settlements" ON settlements;
CREATE POLICY "Admins can manage all settlements"
  ON settlements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- settlement_items 테이블 (정산 상세 내역)
CREATE TABLE IF NOT EXISTS settlement_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  
  artwork_id UUID NOT NULL REFERENCES artworks(id),
  artwork_title TEXT NOT NULL,
  
  sale_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  payment_fee DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_transaction_id ON settlement_items(transaction_id);

-- RLS
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists can view own settlement items" ON settlement_items;
CREATE POLICY "Artists can view own settlement items"
  ON settlement_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM settlements
      WHERE settlements.id = settlement_items.settlement_id
      AND settlements.artist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all settlement items" ON settlement_items;
CREATE POLICY "Admins can manage all settlement items"
  ON settlement_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ===================================
-- PART 2: 메시지 읽음 상태
-- ===================================

-- is_read 컬럼 추가
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);
CREATE INDEX IF NOT EXISTS idx_messages_chat_read ON messages (chat_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_read ON messages (sender_id, is_read);

-- ===================================
-- PART 3: RLS 제거 (공개 데이터만)
-- ===================================

DO $$
BEGIN
    -- 공개 데이터 테이블 RLS 비활성화
    ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.artworks DISABLE ROW LEVEL SECURITY;
    
    BEGIN
        ALTER TABLE public.artwork_views DISABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
END $$;

-- 정책 삭제
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    FOR tbl IN (
        SELECT unnest(ARRAY[
            'likes', 'bookmarks', 'follows', 
            'comments', 'artworks', 'artwork_views'
        ])
    ) LOOP
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = tbl
        ) LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', pol.policyname, tbl);
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END;
        END LOOP;
    END LOOP;
END $$;

-- 권한 부여
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN (
        SELECT unnest(ARRAY[
            'likes', 'bookmarks', 'follows', 
            'comments', 'artworks', 'artwork_views'
        ])
    ) LOOP
        BEGIN
            EXECUTE format('GRANT ALL ON public.%I TO anon', tbl);
            EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
        EXCEPTION
            WHEN undefined_table THEN NULL;
            WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

-- Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 정산 시스템 생성 완료!';
    RAISE NOTICE '✅ 메시지 읽음 상태 추가 완료!';
    RAISE NOTICE '✅ RLS 제거 완료!';
    RAISE NOTICE '🎉 모든 설정이 완료되었습니다!';
END $$;

