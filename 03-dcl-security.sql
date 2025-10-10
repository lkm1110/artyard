-- ================================
-- ArtYard Security Policies (DCL)  
-- Data Control Language
-- ================================

-- ================================
-- RLS 활성화
-- ================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ================================
-- 기존 정책 삭제 (안전한 재생성)
-- ================================

-- Profiles 정책 삭제
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Artworks 정책 삭제
DROP POLICY IF EXISTS "Anyone can read artworks" ON artworks;
DROP POLICY IF EXISTS "Users can create artworks" ON artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON artworks;

-- Likes 정책 삭제
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

-- Comments 정책 삭제
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Bookmarks 정책 삭제
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;

-- Chats 정책 삭제
DROP POLICY IF EXISTS "Users can read their own chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;

-- Messages 정책 삭제
DROP POLICY IF EXISTS "Users can read their chat messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

-- Challenge Entries 정책 삭제
DROP POLICY IF EXISTS "Anyone can view challenge entries" ON challenge_entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON challenge_entries;

-- Reports 정책 삭제
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- Storage 정책 삭제
DROP POLICY IF EXISTS "Anyone can view artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artwork images" ON storage.objects;

-- ================================
-- 새로운 RLS 정책 생성
-- ================================

-- 1. PROFILES 테이블 정책
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. ARTWORKS 테이블 정책
CREATE POLICY "Anyone can read artworks"
ON artworks FOR SELECT
TO authenticated
USING (is_hidden = false);

CREATE POLICY "Users can create artworks"
ON artworks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own artworks"
ON artworks FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 3. LIKES 테이블 정책
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own likes"
ON likes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. COMMENTS 테이블 정책
CREATE POLICY "Anyone can read comments"
ON comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 5. BOOKMARKS 테이블 정책
CREATE POLICY "Users can view their own bookmarks"
ON bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks"
ON bookmarks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. CHATS 테이블 정책
CREATE POLICY "Users can read their own chats"
ON chats FOR SELECT
TO authenticated
USING (auth.uid() = a OR auth.uid() = b);

CREATE POLICY "Users can create chats"
ON chats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = a OR auth.uid() = b);

-- 7. MESSAGES 테이블 정책
CREATE POLICY "Users can read their chat messages"
ON messages FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = a OR auth.uid() = b
  )
);

CREATE POLICY "Users can send messages to their chats"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = a OR auth.uid() = b
  )
);

-- 8. CHALLENGE_ENTRIES 테이블 정책
CREATE POLICY "Anyone can view challenge entries"
ON challenge_entries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own entries"
ON challenge_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 9. REPORTS 테이블 정책
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- ================================
-- Storage 정책 (artworks 버킷)
-- ================================

CREATE POLICY "Anyone can view artwork images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'artworks');

CREATE POLICY "Users can upload artwork images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own artwork images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own artwork images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================
-- 권한 확인 함수들
-- ================================

-- RLS 정책 상태 확인
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    COALESCE(p.policy_count, 0) as policy_count
  FROM pg_tables t
  LEFT JOIN (
    SELECT 
      tablename,
      count(*) as policy_count
    FROM pg_policies 
    GROUP BY tablename
  ) p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage 정책 확인
CREATE OR REPLACE FUNCTION check_storage_policies()
RETURNS TABLE(
  policy_name text,
  bucket_id text,
  roles text[]
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    policyname::text as policy_name,
    COALESCE(bucket_id, 'N/A')::text as bucket_id,
    roles::text[]
  FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects'
  ORDER BY policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ DCL 보안 정책 설정이 완료되었습니다!';
  RAISE NOTICE '🔒 RLS: 모든 테이블에 행 수준 보안 활성화';
  RAISE NOTICE '👥 프로필: 공개 읽기, 본인만 수정';
  RAISE NOTICE '🎨 작품: 모든 사용자 읽기, 작성자만 수정'; 
  RAISE NOTICE '💬 댓글: 모든 사용자 읽기, 작성자만 수정/삭제';
  RAISE NOTICE '📱 채팅: 참여자만 읽기/쓰기';
  RAISE NOTICE '📦 Storage: artworks 버킷 정책 적용';
  RAISE NOTICE '🔍 확인: SELECT * FROM check_rls_status();';
  RAISE NOTICE '📂 Storage: SELECT * FROM check_storage_policies();';
END $$;
