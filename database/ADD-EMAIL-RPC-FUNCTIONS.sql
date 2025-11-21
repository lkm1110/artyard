-- =====================================================
-- RPC Functions for Admin Management with Real Email
-- =====================================================
-- 실제 이메일 주소를 auth.users에서 가져오는 함수들

-- 1. 관리자 목록 가져오기 (실제 이메일 포함)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id UUID,
  handle TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  is_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.handle::TEXT,
    COALESCE(au.email::TEXT, (p.handle || '@artyard.com')::TEXT) as email,
    p.created_at,
    p.is_admin
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.is_admin = true
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. 사용자 검색 (실제 이메일 포함)
CREATE OR REPLACE FUNCTION search_users_with_email(search_term TEXT)
RETURNS TABLE (
  id UUID,
  handle TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  is_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.handle::TEXT,
    COALESCE(au.email::TEXT, (p.handle || '@artyard.com')::TEXT) as email,
    p.created_at,
    COALESCE(p.is_admin, false) as is_admin
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.handle ILIKE '%' || search_term || '%'
  ORDER BY p.created_at DESC
  LIMIT 50;
END;
$$;

-- 권한 부여 (인증된 사용자만 실행 가능)
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_with_email(TEXT) TO authenticated;

-- =====================================================
-- 사용 방법
-- =====================================================

-- 1. 관리자 목록 조회:
-- SELECT * FROM get_admin_users();

-- 2. 사용자 검색:
-- SELECT * FROM search_users_with_email('kangmin');

-- =====================================================
-- 테스트
-- =====================================================

-- 관리자 목록 확인
SELECT * FROM get_admin_users();

-- 사용자 검색 테스트
SELECT * FROM search_users_with_email('art');

-- 결과 확인:
-- - email 컬럼에 실제 gmail 주소가 표시되어야 함
-- - handle이 'artyard2025'인 경우 artyard2025@gmail.com으로 표시
-- - handle이 'artist89'인 경우 실제 등록된 이메일 표시

