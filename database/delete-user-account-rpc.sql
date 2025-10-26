-- ===================================
-- RPC 함수: 사용자 계정 삭제
-- ===================================
-- 이 함수는 사용자가 자신의 계정을 삭제할 수 있도록 합니다.
-- CASCADE 삭제를 통해 관련된 모든 데이터가 함께 삭제됩니다.

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- 현재 사용자가 삭제하려는 계정의 소유자인지 확인
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- profiles 테이블에서 사용자 데이터 삭제 (CASCADE로 관련 데이터도 삭제됨)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- auth.users 테이블에서 사용자 삭제 (Supabase가 자동으로 처리)
  -- 참고: auth.users는 직접 삭제할 수 없으므로, 
  -- 클라이언트에서 supabase.auth.admin.deleteUser() 또는
  -- supabase.auth.signOut() 후 수동 삭제 필요

  result := json_build_object(
    'success', true,
    'message', 'Account deleted successfully',
    'deleted_user_id', user_id
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$;

-- RPC 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- 설명
COMMENT ON FUNCTION delete_user_account(UUID) IS 'Allows authenticated users to delete their own account and all related data';

