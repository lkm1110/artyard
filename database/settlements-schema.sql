-- ===================================
-- 정산 관리 시스템 Database Schema
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
-- 자동 정산 생성 함수
-- ===================================

CREATE OR REPLACE FUNCTION create_weekly_settlements()
RETURNS void AS $$
DECLARE
  artist RECORD;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
  settlement_id UUID;
  total_sales DECIMAL(12,2);
  total_platform_fee DECIMAL(12,2);
  total_payment_fee DECIMAL(12,2);
  total_net_amount DECIMAL(12,2);
  tx_count INTEGER;
BEGIN
  -- 지난주 월요일 00:00 ~ 일요일 23:59
  period_start := date_trunc('week', NOW() - INTERVAL '1 week');
  period_end := period_start + INTERVAL '1 week' - INTERVAL '1 second';
  
  RAISE NOTICE 'Creating settlements for period: % to %', period_start, period_end;
  
  -- 판매가 있는 작가들만 (confirmed 상태)
  FOR artist IN
    SELECT DISTINCT seller_id as artist_id
    FROM transactions
    WHERE status = 'confirmed'
      AND confirmed_at BETWEEN period_start AND period_end
      AND NOT EXISTS (
        SELECT 1 FROM settlement_items si
        JOIN settlements s ON s.id = si.settlement_id
        WHERE si.transaction_id = transactions.id
      )
  LOOP
    -- 해당 작가의 정산 집계
    SELECT
      COUNT(*),
      COALESCE(SUM(total_amount - COALESCE(shipping_fee, 0)), 0) as sales,
      COALESCE(SUM((total_amount - COALESCE(shipping_fee, 0)) * 0.10), 0) as platform_fee,
      COALESCE(SUM((total_amount - COALESCE(shipping_fee, 0)) * 0.03), 0) as payment_fee
    INTO
      tx_count,
      total_sales,
      total_platform_fee,
      total_payment_fee
    FROM transactions
    WHERE seller_id = artist.artist_id
      AND status = 'confirmed'
      AND confirmed_at BETWEEN period_start AND period_end;
    
    total_net_amount := total_sales - total_platform_fee - total_payment_fee;
    
    -- 정산 레코드 생성
    INSERT INTO settlements (
      artist_id,
      period_start,
      period_end,
      total_sales_amount,
      platform_fee,
      payment_fee,
      net_amount,
      transaction_count,
      status
    ) VALUES (
      artist.artist_id,
      period_start,
      period_end,
      total_sales,
      total_platform_fee,
      total_payment_fee,
      total_net_amount,
      tx_count,
      'pending'
    ) RETURNING id INTO settlement_id;
    
    -- 정산 상세 내역 생성
    INSERT INTO settlement_items (
      settlement_id,
      transaction_id,
      artwork_id,
      artwork_title,
      sale_amount,
      platform_fee,
      payment_fee,
      net_amount,
      sold_at,
      confirmed_at
    )
    SELECT
      settlement_id,
      t.id,
      t.artwork_id,
      a.title,
      t.total_amount - COALESCE(t.shipping_fee, 0),
      (t.total_amount - COALESCE(t.shipping_fee, 0)) * 0.10,
      (t.total_amount - COALESCE(t.shipping_fee, 0)) * 0.03,
      (t.total_amount - COALESCE(t.shipping_fee, 0)) * 0.87,
      t.created_at,
      t.confirmed_at
    FROM transactions t
    JOIN artworks a ON a.id = t.artwork_id
    WHERE t.seller_id = artist.artist_id
      AND t.status = 'confirmed'
      AND t.confirmed_at BETWEEN period_start AND period_end;
    
    RAISE NOTICE 'Created settlement for artist %: $%', artist.artist_id, total_net_amount;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 정산 완료 후 상태 업데이트 함수
-- ===================================

CREATE OR REPLACE FUNCTION complete_settlement(settlement_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE settlements
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = settlement_id_input;
  
  RAISE NOTICE 'Settlement % marked as completed', settlement_id_input;
END;
$$ LANGUAGE plpgsql;

-- Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Settlement system schema created successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Set up cron job in Supabase Dashboard';
  RAISE NOTICE '   2. Run create_weekly_settlements() every Monday';
  RAISE NOTICE '   3. Implement admin approval UI';
END $$;

