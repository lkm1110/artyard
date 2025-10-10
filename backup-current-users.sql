-- ================================
-- 현재 사용자 정보 백업 및 확인
-- ================================

-- 1. 현재 존재하는 프로필 정보 조회
SELECT 
  id,
  handle,
  avatar_url,
  school,
  department,
  is_verified_school,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Auth 사용자 정보 조회 (email 포함)
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  p.handle,
  p.school,
  p.department,
  p.is_verified_school,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 3. 현재 작품 수 확인 (사용자별)
SELECT 
  p.handle,
  p.id,
  COUNT(a.id) as artwork_count
FROM profiles p
LEFT JOIN artworks a ON p.id = a.author_id AND a.is_hidden = false
GROUP BY p.id, p.handle
ORDER BY artwork_count DESC;

-- 4. 현재 활동 통계
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM artworks WHERE is_hidden = false) as total_artworks,
  (SELECT COUNT(*) FROM likes) as total_likes,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM chats) as total_chats,
  (SELECT COUNT(*) FROM messages) as total_messages;
