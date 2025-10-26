-- ArtYard Storage Bucket 설정 및 권한 부여

-- 1. artworks bucket 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- 2. artworks bucket을 public으로 설정
UPDATE storage.buckets 
SET public = true 
WHERE id = 'artworks';

-- 3. Storage Objects 정책 삭제 (기존 정책이 있을 경우)
DROP POLICY IF EXISTS "Anyone can view artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artwork images" ON storage.objects;

-- 4. Storage Objects 정책 생성
-- 누구나 public 이미지 조회 가능
CREATE POLICY "Anyone can view artwork images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'artworks');

-- 로그인한 사용자는 artworks 버켓에 업로드 가능
CREATE POLICY "Users can upload artwork images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'artworks' 
    AND auth.role() = 'authenticated'
  );

-- 사용자는 자신이 업로드한 이미지만 업데이트 가능
CREATE POLICY "Users can update their own artwork images" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'artworks' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 사용자는 자신이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own artwork images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'artworks' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. 확인용 쿼리
SELECT 
  'Storage Bucket Status' as check_type,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'artworks';

SELECT 
  'Storage Policies Status' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "artworks" 설정 완료!';
  RAISE NOTICE '✅ Public access 활성화됨';
  RAISE NOTICE '✅ RLS 정책 4개 생성/업데이트됨';
  RAISE NOTICE '✅ 이제 이미지 업로드가 가능합니다!';
END $$;
