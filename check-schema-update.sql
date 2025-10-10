-- ================================
-- 스키마 업데이트 확인 스크립트
-- ================================

-- 1. artworks 테이블에 price 컬럼이 추가되었는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'artworks' 
  AND column_name IN ('price_band', 'price')
ORDER BY column_name;

-- 2. Storage 버킷 확인
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'artworks';

-- 3. 필요한 함수들이 생성되었는지 확인
SELECT proname as function_name, pronargs as arg_count
FROM pg_proc 
WHERE proname IN (
  'increment_likes_count',
  'decrement_likes_count', 
  'increment_comments_count',
  'decrement_comments_count',
  'update_chat_timestamp',
  'get_app_stats',
  'check_rls_status'
)
ORDER BY proname;

-- 4. 트리거 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_chat_timestamp_trigger';

-- 5. 인덱스 확인 (주요 인덱스들)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE indexname IN (
  'idx_artworks_author_id',
  'idx_artworks_created_at', 
  'idx_likes_user_artwork',
  'idx_comments_artwork',
  'idx_messages_chat_created'
)
ORDER BY tablename, indexname;

-- 6. 앱 통계 확인 (새로운 함수 테스트)
SELECT * FROM get_app_stats();

-- 7. RLS 상태 확인
SELECT * FROM check_rls_status();

-- 완료 메시지
DO $$
DECLARE
  price_col_exists boolean;
  bucket_exists boolean;
  func_count integer;
BEGIN
  -- price 컬럼 존재 확인
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artworks' AND column_name = 'price'
  ) INTO price_col_exists;
  
  -- Storage 버킷 존재 확인  
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'artworks'
  ) INTO bucket_exists;
  
  -- 함수 개수 확인
  SELECT COUNT(*) FROM pg_proc 
  WHERE proname IN (
    'increment_likes_count', 'decrement_likes_count',
    'increment_comments_count', 'decrement_comments_count',
    'get_app_stats', 'check_rls_status'
  ) INTO func_count;
  
  RAISE NOTICE '=================================';
  RAISE NOTICE '📋 스키마 업데이트 확인 결과:';
  RAISE NOTICE '💰 Price 컬럼: %', CASE WHEN price_col_exists THEN '✅ 존재' ELSE '❌ 없음' END;
  RAISE NOTICE '📦 Storage 버킷: %', CASE WHEN bucket_exists THEN '✅ 존재' ELSE '❌ 없음' END;
  RAISE NOTICE '🔧 필수 함수들: %/6 생성됨', func_count;
  RAISE NOTICE '=================================';
  
  IF price_col_exists AND bucket_exists AND func_count >= 6 THEN
    RAISE NOTICE '🎉 스키마 업데이트 성공!';
    RAISE NOTICE '➡️  다음 단계: 03-dcl-security.sql 실행';
  ELSE
    RAISE NOTICE '⚠️  일부 업데이트가 누락되었습니다';
    RAISE NOTICE '🔄 update-schema-only.sql을 다시 실행해보세요';
  END IF;
END $$;
