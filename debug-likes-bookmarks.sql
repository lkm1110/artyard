-- 좋아요/북마크 기능 디버깅

-- 1. likes 테이블 RLS 정책 확인
SELECT 
  'likes 테이블 RLS 정책' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as action,
  qual as condition
FROM pg_policies 
WHERE tablename = 'likes' 
AND schemaname = 'public';

-- 2. bookmarks 테이블 RLS 정책 확인
SELECT 
  'bookmarks 테이블 RLS 정책' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as action,
  qual as condition
FROM pg_policies 
WHERE tablename = 'bookmarks' 
AND schemaname = 'public';

-- 3. RPC 함수들 존재 확인
SELECT 
  'RPC 함수 존재 확인' as check_type,
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('increment_likes_count', 'decrement_likes_count')
AND routine_schema = 'public';

-- 4. 현재 artworks 테이블에서 작품들과 author 정보 확인
SELECT 
  'artworks 테이블 상태' as check_type,
  id,
  title,
  author_id,
  likes_count,
  comments_count,
  created_at
FROM artworks 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. 현재 likes 테이블 상태 확인
SELECT 
  'likes 테이블 상태' as check_type,
  COUNT(*) as total_likes
FROM likes;

-- 6. 현재 bookmarks 테이블 상태 확인  
SELECT 
  'bookmarks 테이블 상태' as check_type,
  COUNT(*) as total_bookmarks
FROM bookmarks;

-- 7. 최근 업로드된 작품의 author 정보 확인
SELECT 
  'author 정보 확인' as check_type,
  a.id as artwork_id,
  a.title,
  a.author_id,
  p.handle as author_handle,
  p.school as author_school
FROM artworks a
LEFT JOIN profiles p ON a.author_id = p.id
ORDER BY a.created_at DESC 
LIMIT 3;

RAISE NOTICE '=== 좋아요/북마크 기능 디버깅 완료 ===';
