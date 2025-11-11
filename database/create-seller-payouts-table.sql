-- Create seller_payouts table for tracking seller payments
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  
  -- Amounts
  total_amount DECIMAL(10, 2) NOT NULL, -- 총 결제 금액
  platform_fee DECIMAL(10, 2) NOT NULL, -- 플랫폼 수수료 (10%)
  seller_amount DECIMAL(10, 2) NOT NULL, -- 판매자 수령액
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Shipping address (배송 주소 - 판매자에게 전달)
  shipping_address JSONB,
  
  -- Seller bank info (판매자 계좌 정보)
  bank_info JSONB,
  
  -- Admin notes
  admin_notes TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_transaction_id ON seller_payouts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_created_at ON seller_payouts(created_at DESC);

-- Add RLS policies
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own payouts
CREATE POLICY "Sellers can view their own payouts"
  ON seller_payouts
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Only admins can insert/update payouts (handled by Edge Function)
CREATE POLICY "Service role can manage payouts"
  ON seller_payouts
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE seller_payouts IS '판매자 정산 테이블 - 결제 완료 시 자동 생성되며, Admin이 수동으로 정산 처리';
COMMENT ON COLUMN seller_payouts.status IS 'pending: 정산 대기, paid: 정산 완료, failed: 정산 실패';
COMMENT ON COLUMN seller_payouts.shipping_address IS '구매자 배송 주소 (판매자에게 전달)';
COMMENT ON COLUMN seller_payouts.bank_info IS '판매자 계좌 정보 (암호화 필요)';

