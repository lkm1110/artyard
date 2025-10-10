-- ================================
-- ArtYard Database Reset Script
-- ⚠️ 주의: 모든 데이터가 삭제됩니다!
-- ================================

-- 1. 모든 RLS 정책 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 모든 테이블의 RLS 정책 삭제
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'policy_name', r.tablename);
    END LOOP;
    
    RAISE NOTICE '✅ 모든 RLS 정책 삭제 완료';
END $$;

-- 2. 트리거 삭제
DROP TRIGGER IF EXISTS update_chat_timestamp_trigger ON messages;

-- 3. 함수 삭제
DROP FUNCTION IF EXISTS increment_likes_count(UUID);
DROP FUNCTION IF EXISTS decrement_likes_count(UUID);  
DROP FUNCTION IF EXISTS increment_comments_count(UUID);
DROP FUNCTION IF EXISTS decrement_comments_count(UUID);
DROP FUNCTION IF EXISTS update_chat_timestamp();
DROP FUNCTION IF EXISTS reset_dev_data();
DROP FUNCTION IF EXISTS get_app_stats();
DROP FUNCTION IF EXISTS check_rls_status();
DROP FUNCTION IF EXISTS check_storage_policies();

-- 4. 테이블 삭제 (외래키 순서 고려)
DROP TABLE IF EXISTS challenge_entries CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS ad_slots CASCADE;

-- 5. Storage 정책 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
    
    RAISE NOTICE '✅ Storage 정책 삭제 완료';
END $$;

-- 6. Storage 버킷 삭제
DELETE FROM storage.objects WHERE bucket_id = 'artworks';
DELETE FROM storage.buckets WHERE id = 'artworks';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '🧹 데이터베이스 초기화 완료!';
    RAISE NOTICE '📋 모든 테이블, 함수, 정책이 삭제되었습니다';
    RAISE NOTICE '🚀 이제 01-ddl-schema.sql을 실행하세요';
END $$;
