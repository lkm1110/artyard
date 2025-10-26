-- ===================================
-- lavlna280@gmail.com을 어드민으로 설정
-- ===================================

-- 1. 어드민 스키마가 설치되지 않았다면 먼저 설치
-- (admin-schema-safe.sql 먼저 실행해야 함)

-- 2. lavlna280@gmail.com 계정을 어드민으로 설정
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'lavlna280@gmail.com'
);

-- 3. 확인
SELECT 
  p.id,
  p.handle,
  au.email,
  p.is_admin
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'lavlna280@gmail.com';

-- 결과가 is_admin = true로 표시되면 성공!

