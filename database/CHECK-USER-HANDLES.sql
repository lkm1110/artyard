-- ===================================
-- 사용자 Handle 확인
-- ===================================

-- 모든 사용자의 handle 목록 (최근 생성 순)
SELECT 
    handle,
    created_at,
    is_admin
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 특정 이메일의 handle 찾기
-- (auth.users와 profiles를 연결)
SELECT 
    u.email,
    p.handle,
    p.is_admin,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email ILIKE '%kangmin%'  -- 여기에 검색할 이메일 입력
OR u.email ILIKE '%lavlna%'
ORDER BY u.created_at DESC;

-- Admin 사용자 확인
SELECT 
    handle,
    created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;

