-- Restore Test Data for Chat Testing
-- This will create valid test transactions for chat functionality

-- 1. Find valid artworks and users
SELECT 
  a.id as artwork_id,
  a.title,
  a.author_id as seller_id,
  p.handle as seller_handle
FROM artworks a
JOIN profiles p ON a.author_id = p.id
WHERE a.sale_status = 'sold'
LIMIT 5;

-- 2. Find your user ID (buyer)
SELECT id, handle, email
FROM profiles
WHERE email LIKE '%@gmail.com'  -- Your email
LIMIT 1;

-- 3. Manually create a test transaction with valid seller_id
-- REPLACE THESE VALUES with actual IDs from step 1 and 2:

INSERT INTO transactions (
  id,
  artwork_id,
  buyer_id,
  seller_id,
  amount,
  platform_fee,
  seller_amount,
  status,
  buyer_name,
  buyer_phone,
  buyer_address,
  payment_method,
  stripe_payment_intent_id,
  paid_at,
  created_at
) VALUES (
  gen_random_uuid(),
  '[ARTWORK_ID_FROM_STEP_1]',  -- Replace with actual artwork ID
  '[YOUR_USER_ID_FROM_STEP_2]',  -- Replace with your user ID
  '[SELLER_ID_FROM_STEP_1]',     -- Replace with seller ID
  100,  -- $100
  10,   -- 10% fee
  90,   -- 90% to seller
  'paid',
  'Test Buyer',
  '010-1234-5678',
  'Test Address',
  '2checkout',
  '2CO-TEST-12345',
  NOW(),
  NOW()
)
RETURNING id, buyer_id, seller_id;

-- 4. Verify the transaction has valid seller
SELECT 
  t.id,
  t.status,
  t.buyer_id,
  t.seller_id,
  buyer.handle as buyer_handle,
  seller.handle as seller_handle,
  a.title as artwork_title
FROM transactions t
LEFT JOIN profiles buyer ON t.buyer_id = buyer.id
LEFT JOIN profiles seller ON t.seller_id = seller.id
LEFT JOIN artworks a ON t.artwork_id = a.id
ORDER BY t.created_at DESC
LIMIT 5;

-- 5. Clean up garbage transactions (transactions with invalid seller_id)
-- First, check for invalid transactions
SELECT 
  t.id,
  t.seller_id,
  t.status,
  seller.id as seller_exists
FROM transactions t
LEFT JOIN profiles seller ON t.seller_id = seller.id
WHERE seller.id IS NULL;

-- If you see invalid transactions, delete them:
-- DELETE FROM transactions
-- WHERE seller_id NOT IN (SELECT id FROM profiles);

