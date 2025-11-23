-- ============================================================
-- ArtYard Database Optimization - High Priority
-- ============================================================
-- 즉시 적용해야 할 중요한 최적화 사항들
-- 실행 시간: 약 5-10분 (데이터 양에 따라 다름)
-- ============================================================

-- ============================================================
-- 1. 인덱스 추가 (성능 개선)
-- ============================================================

-- artworks 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_author_id ON artworks(author_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_sale_status_available ON artworks(sale_status) WHERE sale_status = 'available';
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artworks_sold_at ON artworks(sold_at) WHERE sold_at IS NOT NULL;

-- challenge_entries 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge_id ON challenge_entries(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_author_id ON challenge_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_artwork_id ON challenge_entries(artwork_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_final_rank ON challenge_entries(final_rank) WHERE final_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenge_entries_is_winner ON challenge_entries(challenge_id, is_winner) WHERE is_winner = true;

-- challenge_votes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge_id ON challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_voter_id ON challenge_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_entry_id ON challenge_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_unique ON challenge_votes(challenge_id, voter_id);

-- challenges 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges(start_date DESC);

-- likes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_likes_artwork_id ON likes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- follows 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);

-- comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_artwork_id ON comments(artwork_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- notifications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- transactions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_artwork_id ON transactions(artwork_id);

-- messages 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(sender_id, is_read) WHERE is_read = false;

-- reports 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_status_pending ON reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);

-- user_bans 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_expires_at ON user_bans(expires_at) WHERE expires_at IS NOT NULL;

-- auction_items 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auction_items_auction_id ON auction_items(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_artist_id ON auction_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_is_sold ON auction_items(is_sold);

-- auction_bids 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_item_id ON auction_bids(auction_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_status ON auction_bids(status);


-- ============================================================
-- 2. user_bans UNIQUE 제약 수정
-- ============================================================

-- 기존 UNIQUE 제약 제거
DO $$ 
BEGIN
  ALTER TABLE user_bans DROP CONSTRAINT IF EXISTS user_bans_user_id_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- active ban만 unique하도록 변경
DROP INDEX IF EXISTS idx_user_bans_active_user;
CREATE UNIQUE INDEX idx_user_bans_active_user 
ON user_bans(user_id) 
WHERE (expires_at IS NULL OR expires_at > NOW());


-- ============================================================
-- 3. notifications type CHECK 제약 업데이트
-- ============================================================

-- 기존 CHECK 제약 제거
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 새로운 CHECK 제약 추가 ('system' 타입 포함)
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'new_artwork', 
  'new_follower', 
  'like', 
  'comment', 
  'purchase', 
  'payout', 
  'auction_outbid', 
  'auction_won', 
  'challenge_win', 
  'shipping_started', 
  'shipping_delivered',
  'system'
));


-- ============================================================
-- 4. 중복 location 컬럼 제거 (artworks 테이블)
-- ============================================================

-- location_latitude, location_longitude 제거 (latitude, longitude가 이미 존재)
ALTER TABLE artworks DROP COLUMN IF EXISTS location_latitude;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_longitude;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_district;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_street;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_name;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_accuracy;
ALTER TABLE artworks DROP COLUMN IF EXISTS location_timestamp;

-- 필요한 컬럼만 유지:
-- latitude, longitude, location_country, location_state, location_city, location_full


-- ============================================================
-- 5. JSONB 인덱스 추가
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs 
ON profiles USING GIN (notification_preferences);

CREATE INDEX IF NOT EXISTS idx_artwork_analytics_color_palette 
ON artwork_analytics USING GIN (color_palette) 
WHERE color_palette IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_material 
ON user_preferences USING GIN (material_preferences) 
WHERE material_preferences IS NOT NULL;


-- ============================================================
-- 완료 메시지
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ High Priority 최적화 완료!';
  RAISE NOTICE '📊 인덱스 생성: 40개+';
  RAISE NOTICE '🔧 제약 조건 수정: 2개';
  RAISE NOTICE '🗑️ 불필요한 컬럼 제거: 7개';
END $$;

