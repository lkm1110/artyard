-- ============================================
-- ArtYard 최종 설치 (절대 에러 안 남!)
-- ============================================

-- ============================================
-- 기존 테이블 완전 삭제
-- ============================================

DROP TABLE IF EXISTS artwork_views CASCADE;
DROP TABLE IF EXISTS artist_analytics CASCADE;
DROP TABLE IF EXISTS challenge_entries CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS transaction_reviews CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS artwork_shipping_settings CASCADE;
DROP TABLE IF EXISTS shipping_addresses CASCADE;

-- ============================================
-- 새 테이블 생성
-- ============================================

-- 1. 배송 주소
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  address VARCHAR(500) NOT NULL,
  address_detail VARCHAR(200),
  country VARCHAR(2) DEFAULT 'KR',
  state VARCHAR(100),
  city VARCHAR(100),
  delivery_memo TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_default_address_per_user ON shipping_addresses(user_id) WHERE is_default = true;
CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);

-- 2. 작품 배송 설정
CREATE TABLE artwork_shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL UNIQUE,
  domestic_enabled BOOLEAN DEFAULT true,
  domestic_fee INTEGER DEFAULT 3000,
  domestic_free_threshold INTEGER DEFAULT 100000,
  international_enabled BOOLEAN DEFAULT false,
  asia_fee INTEGER DEFAULT 12000,
  north_america_fee INTEGER DEFAULT 18000,
  europe_fee INTEGER DEFAULT 25000,
  fragile BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT false,
  insurance_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artwork_shipping_artwork ON artwork_shipping_settings(artwork_id);

-- 3. 거래 테이블 ⭐ status 컬럼 포함!
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  platform_fee INTEGER NOT NULL,
  seller_amount INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe_card',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  shipping_recipient VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_postal_code VARCHAR(10) NOT NULL,
  shipping_address VARCHAR(500) NOT NULL,
  shipping_address_detail VARCHAR(200),
  shipping_country VARCHAR(2) DEFAULT 'KR',
  shipping_memo TEXT,
  tracking_number VARCHAR(100),
  carrier VARCHAR(50),
  shipping_zone VARCHAR(50) DEFAULT 'domestic',
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  auto_confirm_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'confirmed', 'refunded', 'disputed', 'cancelled'))
);

CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_artwork ON transactions(artwork_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 4. 거래 이력
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transaction_history_transaction ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_created_at ON transaction_history(created_at DESC);

-- 5. 정산
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount INTEGER NOT NULL,
  stripe_transfer_id VARCHAR(255),
  stripe_payout_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_transaction ON payouts(transaction_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- 6. 리뷰
CREATE TABLE transaction_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  shipping_rating INTEGER CHECK (shipping_rating >= 1 AND shipping_rating <= 5),
  comment TEXT,
  images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_one_review_per_transaction ON transaction_reviews(transaction_id, reviewer_id);
CREATE INDEX idx_reviews_reviewer ON transaction_reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON transaction_reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON transaction_reviews(rating);
CREATE INDEX idx_reviews_created_at ON transaction_reviews(created_at DESC);

-- 7. Challenge
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  topic VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  rules TEXT,
  max_entries_per_user INTEGER DEFAULT 3,
  prize_description TEXT,
  winner_badge VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
  entries_count INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_challenge_status CHECK (status IN ('upcoming', 'active', 'ended', 'archived')),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_end_date ON challenges(end_date DESC);
CREATE INDEX idx_challenges_created_at ON challenges(created_at DESC);

-- 8. Challenge 참여
CREATE TABLE challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL,
  author_id UUID NOT NULL,
  description TEXT,
  rank INTEGER,
  is_winner BOOLEAN DEFAULT false,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, artwork_id)
);

CREATE INDEX idx_challenge_entries_challenge ON challenge_entries(challenge_id);
CREATE INDEX idx_challenge_entries_artwork ON challenge_entries(artwork_id);
CREATE INDEX idx_challenge_entries_author ON challenge_entries(author_id);
CREATE INDEX idx_challenge_entries_votes ON challenge_entries(votes_count DESC);

-- 9. 작가 통계
CREATE TABLE artist_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  bookmarks_received INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, date)
);

CREATE INDEX idx_analytics_user ON artist_analytics(user_id);
CREATE INDEX idx_analytics_date ON artist_analytics(date DESC);
CREATE INDEX idx_analytics_period ON artist_analytics(period);

-- 10. 조회 기록
CREATE TABLE artwork_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL,
  viewer_id UUID,
  session_id VARCHAR(255),
  referrer VARCHAR(500),
  device_type VARCHAR(50),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artwork_views_artwork ON artwork_views(artwork_id);
CREATE INDEX idx_artwork_views_viewer ON artwork_views(viewer_id);
CREATE INDEX idx_artwork_views_viewed_at ON artwork_views(viewed_at DESC);

-- ============================================
-- 외래 키 추가 (안전하게)
-- ============================================

DO $$
BEGIN
  -- shipping_addresses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE shipping_addresses ADD CONSTRAINT shipping_addresses_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- artwork_shipping_settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artworks') THEN
    ALTER TABLE artwork_shipping_settings ADD CONSTRAINT artwork_shipping_settings_artwork_id_fkey 
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
  END IF;
  
  -- transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artworks') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_artwork_id_fkey 
      FOREIGN KEY (artwork_id) REFERENCES artworks(id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_buyer_id_fkey 
      FOREIGN KEY (buyer_id) REFERENCES profiles(id);
    ALTER TABLE transactions ADD CONSTRAINT transactions_seller_id_fkey 
      FOREIGN KEY (seller_id) REFERENCES profiles(id);
  END IF;
  
  -- transaction_history
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE transaction_history ADD CONSTRAINT transaction_history_changed_by_fkey 
      FOREIGN KEY (changed_by) REFERENCES profiles(id);
  END IF;
  
  -- payouts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE payouts ADD CONSTRAINT payouts_seller_id_fkey 
      FOREIGN KEY (seller_id) REFERENCES profiles(id);
  END IF;
  
  -- transaction_reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE transaction_reviews ADD CONSTRAINT transaction_reviews_reviewer_id_fkey 
      FOREIGN KEY (reviewer_id) REFERENCES profiles(id);
    ALTER TABLE transaction_reviews ADD CONSTRAINT transaction_reviews_reviewee_id_fkey 
      FOREIGN KEY (reviewee_id) REFERENCES profiles(id);
  END IF;
  
  -- challenges
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE challenges ADD CONSTRAINT challenges_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
  
  -- challenge_entries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artworks') THEN
    ALTER TABLE challenge_entries ADD CONSTRAINT challenge_entries_artwork_id_fkey 
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE challenge_entries ADD CONSTRAINT challenge_entries_author_id_fkey 
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- artist_analytics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE artist_analytics ADD CONSTRAINT artist_analytics_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- artwork_views
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artworks') THEN
    ALTER TABLE artwork_views ADD CONSTRAINT artwork_views_artwork_id_fkey 
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE artwork_views ADD CONSTRAINT artwork_views_viewer_id_fkey 
      FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- profiles 테이블에 컬럼 추가
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3,2) DEFAULT 0.00;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_reviews_count INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buyer_rating DECIMAL(3,2) DEFAULT 0.00;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buyer_reviews_count INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_revenue INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipping_addresses_select ON shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY shipping_addresses_insert ON shipping_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY shipping_addresses_update ON shipping_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY shipping_addresses_delete ON shipping_addresses FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_select ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY transactions_update ON transactions FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

ALTER TABLE transaction_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_select ON transaction_reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON transaction_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY reviews_update ON transaction_reviews FOR UPDATE USING (auth.uid() = reviewer_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenges_select ON challenges FOR SELECT USING (true);

ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenge_entries_select ON challenge_entries FOR SELECT USING (true);
CREATE POLICY challenge_entries_insert ON challenge_entries FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY challenge_entries_delete ON challenge_entries FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE artist_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_select ON artist_analytics FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE artwork_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY artwork_views_insert ON artwork_views FOR INSERT WITH CHECK (true);

-- ============================================
-- 완료! 🎉
-- ============================================

SELECT 
  '✅ 설치 완료!' as status,
  '5%' as platform_fee,
  COUNT(*) || '개 테이블 생성' as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'shipping_addresses',
  'artwork_shipping_settings', 
  'transactions',
  'transaction_history',
  'payouts',
  'transaction_reviews',
  'challenges',
  'challenge_entries',
  'artist_analytics',
  'artwork_views'
);

