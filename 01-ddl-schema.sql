-- ================================
-- ArtYard Database Schema (DDL)
-- Data Definition Language
-- ================================

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  avatar_url text,
  school text,
  department text,
  is_verified_school boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. 작품 테이블
CREATE TABLE IF NOT EXISTS artworks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  material text NOT NULL,
  size text,
  year integer,
  edition text,
  price text, -- price_band에서 price로 변경
  images text[] NOT NULL DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. 좋아요 테이블
CREATE TABLE IF NOT EXISTS likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

-- 5. 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL, -- content가 아닌 body 사용
  created_at timestamptz DEFAULT now()
);

-- 6. 북마크 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

-- 7. 채팅 테이블
CREATE TABLE IF NOT EXISTS chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  a uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- user1_id 대신 a 사용
  b uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- user2_id 대신 b 사용
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chats_users_different CHECK (a != b),
  UNIQUE(a, b)
);

-- 8. 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL, -- content가 아닌 body 사용
  created_at timestamptz DEFAULT now()
);

-- 9. 챌린지 테이블
CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 10. 챌린지 참여 테이블
CREATE TABLE IF NOT EXISTS challenge_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- 11. 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 12. 광고 슬롯 테이블
CREATE TABLE IF NOT EXISTS ad_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  position text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ================================
-- 데이터베이스 함수들
-- ================================

-- 좋아요 수 증가/감소 함수
CREATE OR REPLACE FUNCTION increment_likes_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET likes_count = likes_count + 1
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 수 증가/감소 함수
CREATE OR REPLACE FUNCTION increment_comments_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET comments_count = comments_count + 1
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count(artwork_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artworks
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 채팅 업데이트 시간 갱신 함수
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 삽입 시 채팅 시간 업데이트 트리거
DROP TRIGGER IF EXISTS update_chat_timestamp_trigger ON messages;
CREATE TRIGGER update_chat_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- ================================
-- 인덱스 생성 (성능 최적화)
-- ================================

-- 작품 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_author_id ON artworks(author_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_material ON artworks(material);

-- 좋아요/북마크 인덱스
CREATE INDEX IF NOT EXISTS idx_likes_user_artwork ON likes(user_id, artwork_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_artwork ON bookmarks(user_id, artwork_id);

-- 댓글 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_artwork ON comments(artwork_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_users ON chats(a, b);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ DDL 스키마 생성이 완료되었습니다!';
  RAISE NOTICE '📋 테이블: profiles, artworks, likes, comments, bookmarks, chats, messages, etc.';
  RAISE NOTICE '🔧 함수: likes/comments 카운터, 채팅 타임스탬프 업데이트';
  RAISE NOTICE '⚡ 인덱스: 성능 최적화용 인덱스 생성 완료';
  RAISE NOTICE '📦 Storage: artworks 버킷 생성 완료';
END $$;
