-- Fix artyard2025@gmail.com account handle
-- 닉네임을 artist89로 변경

-- 1. 현재 상태 확인
SELECT 
  p.id,
  u.email,
  p.handle as current_handle,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'artyard2025@gmail.com';

-- 2. handle을 artist89로 변경
UPDATE profiles
SET handle = 'artist89'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'artyard2025@gmail.com'
);

-- 3. 변경 확인
SELECT 
  p.id,
  u.email,
  p.handle as updated_handle,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'artyard2025@gmail.com';

-- 4. artist89 handle이 다른 계정에 사용 중인지 확인
SELECT 
  p.id,
  u.email,
  p.handle
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.handle = 'artist89';

