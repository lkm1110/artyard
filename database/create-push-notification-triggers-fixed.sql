/**
 * Database Triggers for Push Notifications (Fixed Version)
 * Automatically sends push notifications for:
 * 1. New comments on artworks
 * 2. Purchases (artwork sold)
 * 3. New reviews
 * 
 * 🔧 This version includes hardcoded Supabase credentials to avoid permission errors
 */

-- ================================================================
-- 1. Comment Notification Trigger
-- ================================================================

CREATE OR REPLACE FUNCTION notify_comment_push()
RETURNS TRIGGER AS $$
DECLARE
  artwork_owner_id UUID;
  artwork_title TEXT;
  commenter_handle TEXT;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL and Service Role Key
  function_url := 'https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/send-push-notification';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE4NDkwOSwiZXhwIjoyMDc0NzYwOTA5fQ.Cgt7C2ZQ80cDGMieRoSQD8biIVBVW_tTPBAN4BHGgI0';

  -- 작품 소유자 및 제목 조회
  SELECT owner_id, title INTO artwork_owner_id, artwork_title
  FROM artworks
  WHERE id = NEW.artwork_id;

  -- 자기 자신의 댓글은 알람 안 보냄
  IF NEW.author_id = artwork_owner_id THEN
    RETURN NEW;
  END IF;

  -- 댓글 작성자 handle 조회
  SELECT handle INTO commenter_handle
  FROM profiles
  WHERE id = NEW.author_id;

  -- Edge Function 호출 (비동기)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'userId', artwork_owner_id,
      'title', 'New Comment',
      'body', '@' || commenter_handle || ' commented on "' || artwork_title || '"',
      'data', jsonb_build_object(
        'type', 'comment',
        'artworkId', NEW.artwork_id,
        'commentId', NEW.id
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 나도 댓글은 정상 저장
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성
DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_push();

COMMENT ON FUNCTION notify_comment_push() IS 'Send push notification when someone comments on an artwork';


-- ================================================================
-- 2. Purchase Notification Trigger
-- ================================================================

CREATE OR REPLACE FUNCTION notify_purchase_push()
RETURNS TRIGGER AS $$
DECLARE
  artwork_owner_id UUID;
  artwork_title TEXT;
  buyer_handle TEXT;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL and Service Role Key
  function_url := 'https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/send-push-notification';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE4NDkwOSwiZXhwIjoyMDc0NzYwOTA5fQ.Cgt7C2ZQ80cDGMieRoSQD8biIVBVW_tTPBAN4BHGgI0';

  -- 구매 완료 상태일 때만 (paid)
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- 작품 소유자 및 제목 조회
    SELECT owner_id, title INTO artwork_owner_id, artwork_title
    FROM artworks
    WHERE id = NEW.artwork_id;

    -- 구매자 handle 조회
    SELECT handle INTO buyer_handle
    FROM profiles
    WHERE id = NEW.buyer_id;

    -- Edge Function 호출 (비동기)
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'userId', artwork_owner_id,
        'title', '🎉 Artwork Sold!',
        'body', 'Your artwork "' || artwork_title || '" was purchased by @' || buyer_handle,
        'data', jsonb_build_object(
          'type', 'purchase',
          'artworkId', NEW.artwork_id,
          'transactionId', NEW.id
        )
      )
    );

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 나도 거래는 정상 처리
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성
DROP TRIGGER IF EXISTS on_purchase_completed ON transactions;
CREATE TRIGGER on_purchase_completed
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_purchase_push();

COMMENT ON FUNCTION notify_purchase_push() IS 'Send push notification when artwork is purchased';


-- ================================================================
-- 3. Review Notification Trigger
-- ================================================================

CREATE OR REPLACE FUNCTION notify_review_push()
RETURNS TRIGGER AS $$
DECLARE
  reviewed_user_handle TEXT;
  reviewer_handle TEXT;
  rating_stars TEXT;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL and Service Role Key
  function_url := 'https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/send-push-notification';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE4NDkwOSwiZXhwIjoyMDc0NzYwOTA5fQ.Cgt7C2ZQ80cDGMieRoSQD8biIVBVW_tTPBAN4BHGgI0';

  -- 자기 자신의 리뷰는 알람 안 보냄
  IF NEW.reviewer_id = NEW.reviewed_id THEN
    RETURN NEW;
  END IF;

  -- 리뷰 대상자 handle 조회
  SELECT handle INTO reviewed_user_handle
  FROM profiles
  WHERE id = NEW.reviewed_id;

  -- 리뷰 작성자 handle 조회
  SELECT handle INTO reviewer_handle
  FROM profiles
  WHERE id = NEW.reviewer_id;

  -- 별점 표시
  rating_stars := repeat('⭐', NEW.rating);

  -- Edge Function 호출 (비동기)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'userId', NEW.reviewed_id,
      'title', 'New Review',
      'body', '@' || reviewer_handle || ' left you a review ' || rating_stars,
      'data', jsonb_build_object(
        'type', 'review',
        'reviewId', NEW.id
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 나도 리뷰는 정상 저장
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_review_push();

COMMENT ON FUNCTION notify_review_push() IS 'Send push notification when user receives a review';


-- ================================================================
-- Success Message
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Push notification triggers created successfully!';
  RAISE NOTICE '   - notify_comment_push()';
  RAISE NOTICE '   - notify_purchase_push()';
  RAISE NOTICE '   - notify_review_push()';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Push notifications will be sent for:';
  RAISE NOTICE '   💭 Comments on artworks';
  RAISE NOTICE '   💰 Artwork purchases';
  RAISE NOTICE '   ⭐ User reviews';
END $$;

