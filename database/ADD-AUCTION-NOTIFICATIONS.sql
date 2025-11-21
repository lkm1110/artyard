-- ============================================
-- 경매 알림 시스템 추가
-- ============================================

-- 1. 경매 입찰 알림 함수 (누군가 더 높은 입찰을 했을 때)
CREATE OR REPLACE FUNCTION notify_auction_outbid()
RETURNS TRIGGER AS $$
DECLARE
  prev_bidder_id UUID;
  auction_title TEXT;
  new_bid_amount DECIMAL;
BEGIN
  -- 이전 최고 입찰자 찾기
  SELECT highest_bidder_id INTO prev_bidder_id
  FROM auction_items
  WHERE id = NEW.auction_item_id;
  
  -- 경매 제목 가져오기
  SELECT 
    COALESCE(a.title, 'Auction Item') INTO auction_title
  FROM auction_items ai
  LEFT JOIN artworks a ON a.id = ai.artwork_id
  WHERE ai.id = NEW.auction_item_id;
  
  -- 입찰 금액
  new_bid_amount := NEW.bid_amount;
  
  -- 이전 최고 입찰자가 있고, 새 입찰자와 다르면 알림 생성
  IF prev_bidder_id IS NOT NULL AND prev_bidder_id != NEW.bidder_id THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      prev_bidder_id,                                    -- 이전 최고 입찰자
      'auction_outbid',                                  -- 타입
      'You have been outbid! 🔨',                       -- 제목
      'Someone placed a higher bid ($' || new_bid_amount || ') on "' || auction_title || '"',  -- 메시지
      jsonb_build_object(
        'auction_item_id', NEW.auction_item_id,
        'new_bid_amount', new_bid_amount,
        'auction_title', auction_title
      )
    );
    
    RAISE NOTICE '📨 Outbid notification sent to user %', prev_bidder_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 경매 입찰 알림 트리거
DROP TRIGGER IF EXISTS trigger_notify_auction_outbid ON auction_bids;
CREATE TRIGGER trigger_notify_auction_outbid
    AFTER INSERT ON auction_bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_auction_outbid();

-- 3. 경매 낙찰 알림 함수 (경매 종료 시)
CREATE OR REPLACE FUNCTION notify_auction_won()
RETURNS TRIGGER AS $$
DECLARE
  auction_title TEXT;
  auction_rec RECORD;
BEGIN
  -- 경매가 종료되고 최고 입찰자가 있을 때만 실행
  IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
    
    -- 종료된 경매의 모든 아이템 조회
    FOR auction_rec IN
      SELECT 
        ai.id as item_id,
        ai.highest_bidder_id,
        ai.current_price,
        COALESCE(a.title, 'Artwork') as title,
        ca.title as auction_title
      FROM auction_items ai
      LEFT JOIN artworks a ON a.id = ai.artwork_id
      LEFT JOIN challenge_auctions ca ON ca.id = ai.auction_id
      WHERE ai.auction_id = NEW.id
        AND ai.highest_bidder_id IS NOT NULL
        AND ai.is_sold = false
    LOOP
      -- 각 아이템의 최고 입찰자에게 낙찰 알림
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        auction_rec.highest_bidder_id,                   -- 최고 입찰자
        'auction_won',                                    -- 타입
        'You won the auction! 🎉',                       -- 제목
        'Congratulations! You won "' || auction_rec.title || '" for $' || auction_rec.current_price || '. Please proceed with payment.',  -- 메시지
        jsonb_build_object(
          'auction_id', NEW.id,
          'auction_item_id', auction_rec.item_id,
          'auction_title', auction_rec.auction_title,
          'artwork_title', auction_rec.title,
          'final_price', auction_rec.current_price
        )
      );
      
      RAISE NOTICE '🏆 Auction won notification sent to user % for item %', 
        auction_rec.highest_bidder_id, auction_rec.item_id;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 경매 낙찰 알림 트리거
DROP TRIGGER IF EXISTS trigger_notify_auction_won ON challenge_auctions;
CREATE TRIGGER trigger_notify_auction_won
    AFTER UPDATE ON challenge_auctions
    FOR EACH ROW
    WHEN (NEW.status = 'ended' AND OLD.status != 'ended')
    EXECUTE FUNCTION notify_auction_won();

-- 5. 경매 타입을 notifications CHECK 제약 조건에 추가
-- 기존 제약 조건 삭제
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 새 제약 조건 추가 (경매 타입 포함)
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'new_artwork',       -- 새 작품 업로드
    'new_follower',      -- 새 팔로워
    'like',              -- 좋아요
    'comment',           -- 댓글
    'purchase',          -- 구매
    'payout',            -- 정산 완료
    'auction_outbid',    -- 경매 입찰 초과
    'auction_won',       -- 경매 낙찰
    'challenge_win',     -- 챌린지 우승
    'shipping_started',  -- 배송 시작
    'shipping_delivered' -- 배송 완료
  ));

-- 6. 테스트용 함수 (선택사항)
CREATE OR REPLACE FUNCTION test_auction_notifications()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT;
BEGIN
  -- 트리거 존재 확인
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_notify_auction_outbid'
  ) AND EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_notify_auction_won'
  ) THEN
    test_result := '✅ 경매 알림 트리거가 성공적으로 생성되었습니다!';
  ELSE
    test_result := '❌ 경매 알림 트리거 생성에 문제가 있습니다.';
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- 테스트 실행
SELECT test_auction_notifications();

-- ============================================
-- 사용 예시
-- ============================================

/*
-- 입찰 초과 알림 테스트:
1. 사용자 A가 경매 아이템에 $100 입찰
2. 사용자 B가 같은 아이템에 $150 입찰
   → 사용자 A에게 "You have been outbid!" 알림 자동 생성

-- 경매 낙찰 알림 테스트:
1. Admin이 경매 종료 (status = 'ended')
   → 각 아이템의 최고 입찰자에게 "You won the auction!" 알림 자동 생성

-- 알림 확인:
SELECT * FROM notifications 
WHERE type IN ('auction_outbid', 'auction_won')
ORDER BY created_at DESC;
*/

-- 설치 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 경매 알림 시스템이 성공적으로 설치되었습니다!';
  RAISE NOTICE '📨 입찰 초과 알림: auction_outbid';
  RAISE NOTICE '🏆 경매 낙찰 알림: auction_won';
END $$;

