-- ============================================
-- FIX ADMIN UPDATE RLS POLICY
-- ============================================
-- 관리자가 다른 사용자를 관리자로 지정/해제할 수 있도록 RLS 정책 추가

-- 1. 기존 profiles UPDATE 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND cmd = 'UPDATE';

-- 2. 관리자가 is_admin 컬럼을 업데이트할 수 있는 정책 추가
DO $$ 
BEGIN
    -- 기존 정책이 있으면 삭제
    DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
    DROP POLICY IF EXISTS "Admin can manage admin status" ON profiles;
    
    -- 새 정책 생성: 관리자는 모든 프로필 업데이트 가능
    CREATE POLICY "Admin can manage admin status" 
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- 현재 사용자가 관리자이거나, 자신의 프로필을 업데이트하는 경우
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
        OR id = auth.uid()
    )
    WITH CHECK (
        -- 현재 사용자가 관리자이거나, 자신의 프로필을 업데이트하는 경우
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
        OR id = auth.uid()
    );
    
    RAISE NOTICE '✅ Admin update policy created successfully';
END $$;

-- 3. 정책 확인
SELECT 
    policyname,
    permissive,
    cmd,
    'Policy created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND policyname = 'Admin can manage admin status';

-- 4. 테스트 쿼리 (선택사항)
-- 현재 관리자 계정 확인
SELECT 
    id,
    handle,
    is_admin,
    created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;

-- 5. 완료 메시지
DO $$ 
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ RLS 정책 수정 완료!';
    RAISE NOTICE '이제 관리자가 다른 사용자를 관리자로 지정할 수 있습니다.';
    RAISE NOTICE '===========================================';
END $$;

