-- ============================================
-- CHECK ARTWORKS COUNT
-- ============================================
-- 실제로 작품이 데이터베이스에 있는지 확인

-- 1. 전체 작품 개수
SELECT 
  COUNT(*) as total_artworks,
  COUNT(CASE WHEN is_hidden = false THEN 1 END) as visible_artworks,
  COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_artworks
FROM artworks;

-- 2. 최근 작품 5개 확인
SELECT 
  id,
  title,
  price,
  author_id,
  is_hidden,
  created_at
FROM artworks
ORDER BY created_at DESC
LIMIT 5;

-- 3. 작성자별 작품 수
SELECT 
  author_id,
  COUNT(*) as artwork_count,
  MIN(created_at) as first_artwork,
  MAX(created_at) as last_artwork
FROM artworks
GROUP BY author_id
ORDER BY artwork_count DESC
LIMIT 10;

-- 4. RLS 상태 확인
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS 활성화 (문제!)'
    ELSE '✅ RLS 비활성화 (정상)'
  END as rls_status
FROM pg_tables
WHERE tablename = 'artworks';

