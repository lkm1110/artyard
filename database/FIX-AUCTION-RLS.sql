-- ===================================
-- Auction Management RLS 정책 추가
-- Admin이 경매를 생성/수정/삭제할 수 있도록
-- ===================================

-- 1. 기존 정책 확인
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('challenge_auctions', 'auction_items')
ORDER BY tablename, policyname;

-- 2. Admin 체크 함수 (이미 있을 수도 있음)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. challenge_auctions INSERT 정책 추가
DROP POLICY IF EXISTS auctions_insert_admin ON challenge_auctions;
CREATE POLICY auctions_insert_admin ON challenge_auctions
  FOR INSERT WITH CHECK (is_admin());

-- 4. challenge_auctions UPDATE 정책 추가
DROP POLICY IF EXISTS auctions_update_admin ON challenge_auctions;
CREATE POLICY auctions_update_admin ON challenge_auctions
  FOR UPDATE USING (is_admin());

-- 5. challenge_auctions DELETE 정책 추가
DROP POLICY IF EXISTS auctions_delete_admin ON challenge_auctions;
CREATE POLICY auctions_delete_admin ON challenge_auctions
  FOR DELETE USING (is_admin());

-- 6. auction_items INSERT 정책 추가
DROP POLICY IF EXISTS auction_items_insert_admin ON auction_items;
CREATE POLICY auction_items_insert_admin ON auction_items
  FOR INSERT WITH CHECK (is_admin());

-- 7. auction_items UPDATE 정책 추가
DROP POLICY IF EXISTS auction_items_update_admin ON auction_items;
CREATE POLICY auction_items_update_admin ON auction_items
  FOR UPDATE USING (is_admin());

-- 8. auction_items DELETE 정책 추가
DROP POLICY IF EXISTS auction_items_delete_admin ON auction_items;
CREATE POLICY auction_items_delete_admin ON auction_items
  FOR DELETE USING (is_admin());

-- 9. 확인
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('challenge_auctions', 'auction_items')
ORDER BY tablename, policyname;

-- ===================================
-- 완료!
-- ===================================
-- Admin이 이제 경매를 생성/수정/삭제할 수 있습니다!

