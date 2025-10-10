-- ================================
-- ArtYard Initial Data (DML)
-- Data Manipulation Language
-- ================================

-- ⚠️  주의: 이 파일은 개발/테스트 목적으로만 사용하세요
-- 프로덕션에서는 실제 사용자 데이터만 사용합니다

-- ================================
-- 실제 사용자 프로필 데이터 (백업용)
-- ⚠️ 초기화 시에만 실행, 일반적으로는 OAuth가 자동 생성
-- ================================

-- 🚨 주의: 실제 사용자 데이터는 backup-current-users.sql을 먼저 실행하여 확인하세요!
-- 현재 시스템에 존재하는 실제 사용자들의 정보를 여기에 추가하세요

-- 예시: 기존 OAuth 사용자들 (실제 데이터로 교체 필요)
/*
-- Google OAuth 사용자 예시
INSERT INTO profiles (id, handle, avatar_url, school, department, is_verified_school, created_at) 
VALUES 
  ('user-id-from-google-oauth', 'gmail_user', 'https://avatar-url', 'University Name', 'Department', false, '2024-12-01 10:00:00+00'),
  ('user-id-from-naver-oauth', 'naver_collector', null, 'College Name', 'Art Department', false, '2024-12-01 11:00:00+00'),
  ('user-id-from-kakao-oauth', 'kakao_artist', null, 'Art School', 'Fine Arts', false, '2024-12-01 12:00:00+00')
ON CONFLICT (id) DO NOTHING;
*/

-- 📋 실제 데이터 추가 방법:
-- 1. backup-current-users.sql 실행하여 현재 사용자 확인
-- 2. 위 주석을 해제하고 실제 ID, handle, school 등으로 교체
-- 3. 이 DML 파일 실행하여 데이터 복원

-- ================================
-- 샘플 챌린지 데이터
-- ================================

INSERT INTO challenges (title, description, start_date, end_date, is_active) 
VALUES 
  ('Winter Art Challenge 2025', 'Create artwork inspired by winter themes', '2025-01-01 00:00:00+00', '2025-01-31 23:59:59+00', true),
  ('Abstract Expression Month', 'Explore abstract art techniques and styles', '2025-02-01 00:00:00+00', '2025-02-28 23:59:59+00', true)
ON CONFLICT DO NOTHING;

-- ================================
-- 샘플 광고 슬롯 데이터
-- ================================

INSERT INTO ad_slots (title, image_url, link_url, position, is_active) 
VALUES 
  ('Art Supplies Sale', 'https://example.com/ad1.jpg', 'https://artstore.com/sale', 'feed_top', true),
  ('Online Art Course', 'https://example.com/ad2.jpg', 'https://artcourse.com', 'feed_middle', true),
  ('Gallery Exhibition', 'https://example.com/ad3.jpg', 'https://gallery.com/exhibition', 'feed_bottom', false)
ON CONFLICT DO NOTHING;

-- ================================
-- 데이터 정리 함수들
-- ================================

-- 개발 환경 초기화 함수 (필요시 사용)
CREATE OR REPLACE FUNCTION reset_dev_data()
RETURNS void AS $$
BEGIN
  -- 조심스럽게 테스트 데이터만 삭제
  DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats);
  DELETE FROM chats;
  DELETE FROM challenge_entries;
  DELETE FROM reports;
  DELETE FROM comments WHERE artwork_id IN (SELECT id FROM artworks);
  DELETE FROM likes WHERE artwork_id IN (SELECT id FROM artworks);  
  DELETE FROM bookmarks WHERE artwork_id IN (SELECT id FROM artworks);
  DELETE FROM artworks;
  
  -- 카운터 초기화는 자동으로 됨 (DELETE CASCADE)
  
  RAISE NOTICE '🧹 개발 환경 데이터가 초기화되었습니다';
  RAISE NOTICE '⚠️  프로필(profiles) 테이블은 유지됩니다 (OAuth 데이터)';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 통계 조회 함수
CREATE OR REPLACE FUNCTION get_app_stats()
RETURNS TABLE(
  total_users bigint,
  total_artworks bigint, 
  total_likes bigint,
  total_comments bigint,
  active_chats bigint
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    (SELECT count(*) FROM profiles) as total_users,
    (SELECT count(*) FROM artworks WHERE is_hidden = false) as total_artworks,
    (SELECT count(*) FROM likes) as total_likes,
    (SELECT count(*) FROM comments) as total_comments,
    (SELECT count(DISTINCT chat_id) FROM messages WHERE created_at > now() - interval '30 days') as active_chats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ DML 초기 데이터 설정이 완료되었습니다!';
  RAISE NOTICE '🎯 챌린지: 2개 샘플 챌린지 생성';
  RAISE NOTICE '📢 광고: 3개 샘플 광고 슬롯 생성';
  RAISE NOTICE '🔧 유틸리티: reset_dev_data(), get_app_stats() 함수 생성';
  RAISE NOTICE '📊 통계 확인: SELECT * FROM get_app_stats();';
END $$;
