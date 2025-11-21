-- ===================================
-- Challenge 시스템 업데이트
-- 투표 시스템, 티어 제한, 경매 기능
-- ===================================

-- 1. challenges 테이블 업데이트
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS tier_requirement TEXT DEFAULT 'all' 
  CHECK (tier_requirement IN ('all', 'new', 'trusted', 'verified', 'pro')),
ADD COLUMN IF NOT EXISTS voting_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voting_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS voting_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_auction_eligible BOOLEAN DEFAULT false, -- 경매 대상 여부
ADD COLUMN IF NOT EXISTS max_entries_per_user INTEGER DEFAULT 1; -- 작가당 최대 참가 작품 수

-- 2. challenge_votes 테이블 생성 (1인 1표)
CREATE TABLE IF NOT EXISTS challenge_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 1인 1표 제약
  UNIQUE(challenge_id, voter_id)
);

-- 3. challenge_entries 테이블 업데이트
ALTER TABLE challenge_entries 
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_top_10 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS final_rank INTEGER;

-- 작가당 1작품 제약 추가
ALTER TABLE challenge_entries 
DROP CONSTRAINT IF EXISTS challenge_entries_unique_author;

ALTER TABLE challenge_entries
ADD CONSTRAINT challenge_entries_unique_author UNIQUE(challenge_id, author_id);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_challenges_tier ON challenges(tier_requirement);
CREATE INDEX IF NOT EXISTS idx_challenges_status_tier ON challenges(status, tier_requirement);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge ON challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_entry ON challenge_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_voter ON challenge_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_votes ON challenge_entries(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_top10 ON challenge_entries(is_top_10) WHERE is_top_10 = true;

-- 5. 투표 카운트 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_entry_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenge_entries
    SET votes_count = votes_count + 1
    WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenge_entries
    SET votes_count = votes_count - 1
    WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_votes_count_trigger ON challenge_votes;
CREATE TRIGGER update_votes_count_trigger
AFTER INSERT OR DELETE ON challenge_votes
FOR EACH ROW
EXECUTE FUNCTION update_entry_votes_count();

-- 6. Top 10 자동 선정 함수
CREATE OR REPLACE FUNCTION select_top_10_entries(p_challenge_id UUID)
RETURNS TABLE(entry_id UUID, rank INTEGER, votes INTEGER) AS $$
BEGIN
  -- 기존 Top 10 초기화
  UPDATE challenge_entries
  SET is_top_10 = false, final_rank = NULL
  WHERE challenge_id = p_challenge_id;
  
  -- 새로운 Top 10 선정
  UPDATE challenge_entries ce
  SET 
    is_top_10 = true,
    final_rank = ranked.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY votes_count DESC, created_at ASC) as rank
    FROM challenge_entries
    WHERE challenge_id = p_challenge_id
    LIMIT 10
  ) ranked
  WHERE ce.id = ranked.id;
  
  -- 결과 반환
  RETURN QUERY
  SELECT 
    ce.id as entry_id,
    ce.final_rank as rank,
    ce.votes_count as votes
  FROM challenge_entries ce
  WHERE ce.challenge_id = p_challenge_id
    AND ce.is_top_10 = true
  ORDER BY ce.final_rank ASC;
END;
$$ LANGUAGE plpgsql;

-- 7. 우승자 선정 함수
CREATE OR REPLACE FUNCTION announce_challenge_winner(p_challenge_id UUID)
RETURNS TABLE(winner_id UUID, winner_name TEXT, votes INTEGER) AS $$
BEGIN
  -- Top 10 먼저 선정
  PERFORM select_top_10_entries(p_challenge_id);
  
  -- 1등만 우승자로 표시
  UPDATE challenge_entries
  SET is_winner = true
  WHERE challenge_id = p_challenge_id
    AND final_rank = 1;
  
  -- 챌린지 상태 변경
  UPDATE challenges
  SET status = 'ended'
  WHERE id = p_challenge_id;
  
  -- 우승자 정보 반환
  RETURN QUERY
  SELECT 
    ce.author_id as winner_id,
    p.handle as winner_name,
    ce.votes_count as votes
  FROM challenge_entries ce
  JOIN profiles p ON p.id = ce.author_id
  WHERE ce.challenge_id = p_challenge_id
    AND ce.is_winner = true;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS 정책
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

-- 투표 조회: 모두 가능
CREATE POLICY challenge_votes_select_all ON challenge_votes
  FOR SELECT USING (true);

-- 투표: 로그인 사용자만
CREATE POLICY challenge_votes_insert_own ON challenge_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- 투표 취소: 본인만
CREATE POLICY challenge_votes_delete_own ON challenge_votes
  FOR DELETE USING (auth.uid() = voter_id);

-- 9. 경매 시스템 테이블 (분기별 우승작 경매)
CREATE TABLE IF NOT EXISTS challenge_auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  
  -- 경매 기간 (분기별)
  quarter TEXT NOT NULL, -- '2025-Q1'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 상태
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'completed')),
  
  -- 통계
  artworks_count INTEGER DEFAULT 0,
  total_bids INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- 수수료 (10%)
  platform_commission_rate DECIMAL(5,4) DEFAULT 0.10,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES challenge_auctions(id) ON DELETE CASCADE,
  challenge_entry_id UUID NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 입찰 정보
  starting_price DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  reserve_price DECIMAL(10,2), -- 최소 낙찰가 (선택)
  current_price DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  buyout_price DECIMAL(10,2), -- 즉시 구매가 (선택)
  
  -- 최고 입찰자
  highest_bidder_id UUID REFERENCES profiles(id),
  highest_bid_amount DECIMAL(10,2),
  highest_bid_at TIMESTAMP WITH TIME ZONE,
  
  -- 낙찰 정보
  is_sold BOOLEAN DEFAULT false,
  sold_price DECIMAL(10,2),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_id UUID REFERENCES profiles(id),
  
  -- 통계
  bids_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_id, challenge_entry_id)
);

-- 입찰 내역 테이블
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 입찰 금액
  bid_amount DECIMAL(10,2) NOT NULL,
  
  -- 입찰 타입
  bid_type TEXT DEFAULT 'normal' CHECK (bid_type IN ('normal', 'auto', 'buyout')),
  
  -- 자동 입찰 설정
  max_auto_bid DECIMAL(10,2), -- 자동 입찰 최대 금액
  
  -- 상태
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'outbid', 'won', 'lost')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경매 관심 목록
CREATE TABLE IF NOT EXISTS auction_watchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_item_id, user_id)
);

-- 10. 경매 인덱스
CREATE INDEX IF NOT EXISTS idx_auctions_status ON challenge_auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_quarter ON challenge_auctions(quarter);
CREATE INDEX IF NOT EXISTS idx_auction_items_auction ON auction_items(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_status ON auction_items(is_sold);
CREATE INDEX IF NOT EXISTS idx_auction_bids_item ON auction_bids(auction_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_watchers_item ON auction_watchers(auction_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_watchers_user ON auction_watchers(user_id);

-- 11. 입찰 시 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_auction_highest_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- auction_items 업데이트
  UPDATE auction_items
  SET 
    current_price = NEW.bid_amount,
    highest_bidder_id = NEW.bidder_id,
    highest_bid_amount = NEW.bid_amount,
    highest_bid_at = NEW.created_at,
    bids_count = bids_count + 1,
    updated_at = NOW()
  WHERE id = NEW.auction_item_id;
  
  -- 이전 입찰자들 상태 업데이트
  UPDATE auction_bids
  SET status = 'outbid'
  WHERE auction_item_id = NEW.auction_item_id
    AND bidder_id != NEW.bidder_id
    AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_auction_bid_trigger ON auction_bids;
CREATE TRIGGER update_auction_bid_trigger
AFTER INSERT ON auction_bids
FOR EACH ROW
EXECUTE FUNCTION update_auction_highest_bid();

-- 12. 경매 종료 및 낙찰 함수
CREATE OR REPLACE FUNCTION finalize_auction_item(p_auction_item_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_item auction_items%ROWTYPE;
  v_platform_fee DECIMAL(10,2);
  v_artist_amount DECIMAL(10,2);
BEGIN
  -- 경매 아이템 조회
  SELECT * INTO v_item
  FROM auction_items
  WHERE id = p_auction_item_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Auction item not found';
    RETURN;
  END IF;
  
  -- 입찰이 없으면 유찰
  IF v_item.highest_bidder_id IS NULL THEN
    UPDATE auction_items
    SET 
      is_sold = false,
      updated_at = NOW()
    WHERE id = p_auction_item_id;
    
    RETURN QUERY SELECT true, 'No bids - item not sold';
    RETURN;
  END IF;
  
  -- Reserve price 체크
  IF v_item.reserve_price IS NOT NULL AND v_item.highest_bid_amount < v_item.reserve_price THEN
    UPDATE auction_items
    SET 
      is_sold = false,
      updated_at = NOW()
    WHERE id = p_auction_item_id;
    
    RETURN QUERY SELECT true, 'Reserve price not met - item not sold';
    RETURN;
  END IF;
  
  -- 낙찰 처리
  v_platform_fee := v_item.highest_bid_amount * 0.10; -- 10% 수수료
  v_artist_amount := v_item.highest_bid_amount - v_platform_fee;
  
  UPDATE auction_items
  SET 
    is_sold = true,
    sold_price = highest_bid_amount,
    sold_at = NOW(),
    buyer_id = highest_bidder_id,
    updated_at = NOW()
  WHERE id = p_auction_item_id;
  
  -- 최고 입찰자 상태 업데이트
  UPDATE auction_bids
  SET status = 'won'
  WHERE auction_item_id = p_auction_item_id
    AND bidder_id = v_item.highest_bidder_id;
  
  -- 나머지 입찰자들 상태 업데이트
  UPDATE auction_bids
  SET status = 'lost'
  WHERE auction_item_id = p_auction_item_id
    AND bidder_id != v_item.highest_bidder_id;
  
  RETURN QUERY SELECT 
    true, 
    format('Item sold for $%s (Artist: $%s, Platform: $%s)', 
      v_item.highest_bid_amount, v_artist_amount, v_platform_fee);
END;
$$ LANGUAGE plpgsql;

-- 13. 경매 RLS 정책
ALTER TABLE challenge_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_watchers ENABLE ROW LEVEL SECURITY;

-- 경매 조회: 모두 가능
CREATE POLICY auctions_select_all ON challenge_auctions
  FOR SELECT USING (true);

CREATE POLICY auction_items_select_all ON auction_items
  FOR SELECT USING (true);

-- 입찰 조회: 모두 가능
CREATE POLICY auction_bids_select_all ON auction_bids
  FOR SELECT USING (true);

-- 입찰: 로그인 사용자만
CREATE POLICY auction_bids_insert_own ON auction_bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- 관심 목록: 본인만
CREATE POLICY auction_watchers_select_own ON auction_watchers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY auction_watchers_insert_own ON auction_watchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY auction_watchers_delete_own ON auction_watchers
  FOR DELETE USING (auth.uid() = user_id);

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Challenge 시스템 업데이트 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '투표 시스템 (1인 1표) 준비됨';
  RAISE NOTICE '작가당 1작품 제한 추가됨';
  RAISE NOTICE 'Top 10 자동 선정 기능 추가됨';
  RAISE NOTICE '우승자 발표 시스템 완료';
  RAISE NOTICE '경매 시스템 완료 (10%% 수수료)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - challenge_votes (투표)';
  RAISE NOTICE '  - challenge_auctions (경매)';
  RAISE NOTICE '  - auction_items (경매 아이템)';
  RAISE NOTICE '  - auction_bids (입찰 내역)';
  RAISE NOTICE '  - auction_watchers (관심 목록)';
  RAISE NOTICE '========================================';
END $$;

