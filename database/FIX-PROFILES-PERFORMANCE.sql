-- ===================================
-- profiles 테이블 성능 최적화 (긴급)
-- ===================================
-- 30초 타임아웃 문제 해결

-- 1. 통계 정보 갱신 (매우 중요!)
ANALYZE profiles;

-- 2. Dead tuples 제거
VACUUM ANALYZE profiles;

-- 3. 필요한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- 4. 외래 키를 참조하는 테이블의 인덱스 확인 및 생성
-- (이미 있을 수 있지만 확실하게)
CREATE INDEX IF NOT EXISTS idx_artworks_author_id ON artworks(author_id);
CREATE INDEX IF NOT EXISTS idx_artworks_buyer_id ON artworks(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_a ON chats(a);
CREATE INDEX IF NOT EXISTS idx_chats_b ON chats(b);

-- 5. 복합 인덱스 (자주 함께 사용되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_artworks_author_created ON artworks(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_status ON transactions(seller_id, status);

-- 6. 부분 인덱스 (조건부 인덱스로 크기 축소)
CREATE INDEX IF NOT EXISTS idx_artworks_available ON artworks(id) 
WHERE sale_status = 'available' AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- 7. 통계 목표치 조정 (더 정확한 쿼리 플랜)
ALTER TABLE profiles SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE profiles SET (autovacuum_vacuum_scale_factor = 0.1);

-- 8. 최종 ANALYZE
ANALYZE profiles;
ANALYZE artworks;
ANALYZE transactions;
ANALYZE notifications;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 성능 최적화 완료 ===';
  RAISE NOTICE '✅ 통계 정보 갱신';
  RAISE NOTICE '✅ Dead tuples 제거';
  RAISE NOTICE '✅ 필수 인덱스 추가';
  RAISE NOTICE '✅ 외래 키 인덱스 추가';
  RAISE NOTICE '✅ 복합/부분 인덱스 추가';
  RAISE NOTICE '';
  RAISE NOTICE '⏱️  프로필 조회 속도: 30초 → 0.1초 예상';
  RAISE NOTICE '🔄 앱을 재시작하고 테스트하세요!';
  RAISE NOTICE '';
END $$;

