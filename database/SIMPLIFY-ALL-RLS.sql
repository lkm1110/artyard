-- Simplify and fix all RLS policies for ArtYard
-- 모든 RLS 정책을 간단하고 명확하게 수정

-- ============================================
-- STEP 1: 모든 기존 RLS 정책 제거
-- ============================================

DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- profiles 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on profiles', policy_record.policyname;
    END LOOP;

    -- artworks 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'artworks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON artworks', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on artworks', policy_record.policyname;
    END LOOP;

    -- likes 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'likes' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON likes', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on likes', policy_record.policyname;
    END LOOP;

    -- bookmarks 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'bookmarks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bookmarks', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on bookmarks', policy_record.policyname;
    END LOOP;

    -- follows 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'follows' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON follows', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on follows', policy_record.policyname;
    END LOOP;

    -- comments 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'comments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON comments', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on comments', policy_record.policyname;
    END LOOP;

    -- reviews 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'reviews' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reviews', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on reviews', policy_record.policyname;
    END LOOP;

    -- messages 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on messages', policy_record.policyname;
    END LOOP;

    -- chats 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'chats' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON chats', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on chats', policy_record.policyname;
    END LOOP;

    -- transactions 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'transactions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on transactions', policy_record.policyname;
    END LOOP;

    -- challenges 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'challenges' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON challenges', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on challenges', policy_record.policyname;
    END LOOP;

    -- challenge_entries 정책 제거
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'challenge_entries' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON challenge_entries', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on challenge_entries', policy_record.policyname;
    END LOOP;

    RAISE NOTICE '✅ All existing RLS policies removed';
END $$;

-- ============================================
-- STEP 2: 공개 테이블 - RLS 완전 비활성화
-- ============================================

-- 작품은 공개 (누구나 볼 수 있어야 함)
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;

-- 좋아요는 공개 (누구나 볼 수 있어야 함)
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- 북마크는 공개 (누구나 볼 수 있어야 함)
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- 팔로우는 공개 (누구나 볼 수 있어야 함)
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- 댓글은 공개 (누구나 볼 수 있어야 함)
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 리뷰는 공개 (누구나 볼 수 있어야 함)
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 챌린지는 공개
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- 챌린지 참가는 공개
ALTER TABLE challenge_entries DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: profiles - 간단한 RLS 정책
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 누구나 모든 프로필을 볼 수 있음 (공개)
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
USING (true);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 관리자는 모든 프로필 업데이트 가능 (is_admin 포함)
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 사용자는 자신의 프로필만 삭제 가능
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- ============================================
-- STEP 4: messages & chats - 본인 것만 접근
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 본인이 보낸 메시지 또는 받은 메시지만 조회 가능
CREATE POLICY "messages_select_own"
ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() IN (
    SELECT a FROM chats WHERE id = chat_id
    UNION
    SELECT b FROM chats WHERE id = chat_id
  )
);

-- 본인이 속한 채팅방에만 메시지 생성 가능
CREATE POLICY "messages_insert_own"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT a FROM chats WHERE id = chat_id
    UNION
    SELECT b FROM chats WHERE id = chat_id
  )
);

-- 본인이 보낸 메시지만 업데이트 가능
CREATE POLICY "messages_update_own"
ON messages FOR UPDATE
USING (auth.uid() = sender_id);

-- 본인이 보낸 메시지만 삭제 가능
CREATE POLICY "messages_delete_own"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- Chats 테이블
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 본인이 참여한 채팅만 조회 가능
CREATE POLICY "chats_select_own"
ON chats FOR SELECT
USING (auth.uid() = a OR auth.uid() = b);

-- 본인이 참여자인 채팅만 생성 가능
CREATE POLICY "chats_insert_own"
ON chats FOR INSERT
WITH CHECK (auth.uid() = a OR auth.uid() = b);

-- 본인이 참여한 채팅만 업데이트 가능
CREATE POLICY "chats_update_own"
ON chats FOR UPDATE
USING (auth.uid() = a OR auth.uid() = b);

-- 본인이 참여한 채팅만 삭제 가능
CREATE POLICY "chats_delete_own"
ON chats FOR DELETE
USING (auth.uid() = a OR auth.uid() = b);

-- ============================================
-- STEP 5: transactions - 본인 관련 거래만
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 구매자 또는 판매자만 조회 가능 (+ 관리자)
CREATE POLICY "transactions_select_own_or_admin"
ON transactions FOR SELECT
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 구매자만 거래 생성 가능
CREATE POLICY "transactions_insert_buyer"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- 구매자 또는 판매자만 거래 업데이트 가능
CREATE POLICY "transactions_update_own"
ON transactions FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================
-- STEP 6: 최종 확인
-- ============================================

-- RLS 상태 확인
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS 활성화'
    ELSE '🔓 RLS 비활성화'
  END as status,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE tablename = pg_tables.tablename 
     AND schemaname = 'public'
  ) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'artworks', 'likes', 'bookmarks', 'follows',
    'comments', 'reviews', 'messages', 'chats', 'transactions',
    'challenges', 'challenge_entries'
  )
ORDER BY tablename;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS 정책 간소화 완료!';
  RAISE NOTICE '🔓 공개 테이블: artworks, likes, bookmarks, follows, comments, reviews, challenges';
  RAISE NOTICE '🔒 보호 테이블: profiles (공개 조회 + 본인 수정), messages, chats, transactions';
  RAISE NOTICE '⚠️  앱을 재시작하고 다시 로그인해주세요.';
END $$;

