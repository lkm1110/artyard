-- Check lavlna280@gmail.com account details
-- 계정 정보 확인

-- 1. Auth 사용자 확인
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'lavlna280@gmail.com';

-- 2. Profile 정보 확인
SELECT 
  id,
  handle,
  avatar_url,
  school,
  department,
  bio,
  is_admin,
  created_at
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'lavlna280@gmail.com'
);

-- 3. 해당 계정의 모든 작품 확인
SELECT 
  id,
  title,
  price,
  status,
  created_at
FROM artworks
WHERE artist_id IN (
  SELECT id FROM auth.users WHERE email = 'lavlna280@gmail.com'
)
ORDER BY created_at DESC;

-- 4. 전체 작품 개수 확인 (RLS 무시)
SELECT COUNT(*) as total_artworks
FROM artworks
WHERE status = 'approved';

-- 5. lavlna280 계정으로 업로드된 작품 개수
SELECT COUNT(*) as user_artworks
FROM artworks
WHERE artist_id IN (
  SELECT id FROM auth.users WHERE email = 'lavlna280@gmail.com'
);

