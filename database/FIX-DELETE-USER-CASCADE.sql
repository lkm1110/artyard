-- ===================================
-- 계정 삭제 RPC 함수 수정
-- Foreign Key constraint 해결
-- ===================================

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS delete_user_account(UUID);

-- 2. 개선된 RPC 함수 생성 (관련 데이터 순차 삭제)
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  deleted_artworks_count INTEGER;
  deleted_comments_count INTEGER;
BEGIN
  -- 현재 사용자가 삭제하려는 계정의 소유자인지 확인
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- 1. 관련 데이터 삭제 (Foreign Key 순서 고려)
  
  -- bookmarks 삭제
  DELETE FROM bookmarks WHERE user_id = user_id;
  
  -- likes 삭제
  DELETE FROM likes WHERE user_id = user_id;
  
  -- comments 삭제
  SELECT COUNT(*) INTO deleted_comments_count FROM comments WHERE author_id = user_id;
  DELETE FROM comments WHERE author_id = user_id;
  
  -- artworks 삭제
  SELECT COUNT(*) INTO deleted_artworks_count FROM artworks WHERE author_id = user_id;
  DELETE FROM artworks WHERE author_id = user_id;
  
  -- follows 삭제
  DELETE FROM follows WHERE follower_id = user_id OR following_id = user_id;
  
  -- notifications 삭제
  DELETE FROM notifications WHERE user_id = user_id;
  
  -- messages 삭제
  DELETE FROM messages WHERE sender_id = user_id;
  
  -- chats 삭제
  DELETE FROM chats WHERE a = user_id OR b = user_id;
  
  -- reports 삭제
  DELETE FROM reports WHERE reporter_id = user_id OR reported_id = user_id;
  
  -- transactions 삭제 (buyer, seller)
  DELETE FROM transactions WHERE buyer_id = user_id OR seller_id = user_id;
  
  -- user_bans 삭제
  DELETE FROM user_bans WHERE user_id = user_id OR banned_by = user_id;
  
  -- admin_actions 삭제
  DELETE FROM admin_actions WHERE admin_id = user_id;
  
  -- 2. 마지막으로 profiles 삭제
  DELETE FROM public.profiles WHERE id = user_id;

  result := json_build_object(
    'success', true,
    'message', 'Account deleted successfully',
    'deleted_user_id', user_id,
    'deleted_artworks', deleted_artworks_count,
    'deleted_comments', deleted_comments_count
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$;

-- 3. 실행 권한 부여
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- 4. 함수 설명
COMMENT ON FUNCTION delete_user_account(UUID) IS 'Allows authenticated users to delete their own account and all related data (CASCADE)';

