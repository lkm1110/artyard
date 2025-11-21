# 🔨 경매 알림 시스템 설치 가이드

## 📋 개요

경매 시스템에 자동 알림 기능을 추가합니다!

---

## 🔔 추가되는 알림

### **1. 입찰 초과 알림** (`auction_outbid`)

**조건:**
- 내가 최고 입찰자였는데
- 누군가 더 높은 금액으로 입찰했을 때

**예시:**
```
┌─────────────────────────────────────┐
│ 🔔 You have been outbid! 🔨         │
│ Someone placed a higher bid ($150)  │
│ on "Sunset Over the Ocean"          │
│                                      │
│ 클릭 시: 경매 상세 화면으로 이동    │
└─────────────────────────────────────┘
```

**시나리오:**
```
1. 사용자 A가 작품에 $100 입찰 (최고 입찰자)
2. 사용자 B가 같은 작품에 $150 입찰
   → 사용자 A에게 자동 알림 생성!
3. 사용자 A가 알림 확인
4. 사용자 A가 $200으로 재입찰 가능
```

---

### **2. 경매 낙찰 알림** (`auction_won`)

**조건:**
- 경매가 종료되고
- 내가 최고 입찰자로 낙찰되었을 때

**예시:**
```
┌─────────────────────────────────────┐
│ 🔔 You won the auction! 🎉          │
│ Congratulations! You won "Sunset    │
│ Over the Ocean" for $1,500.         │
│ Please proceed with payment.        │
│                                      │
│ 클릭 시: 결제 화면으로 이동          │
└─────────────────────────────────────┘
```

**시나리오:**
```
1. 경매 진행 중 (여러 사용자 입찰)
2. Admin이 경매 종료 버튼 클릭
   → challenge_auctions.status = 'ended'
3. 각 작품의 최고 입찰자에게 자동 알림 생성!
4. 낙찰자가 알림 확인
5. 결제하기 버튼 클릭 → 결제 진행
```

---

## 🚀 설치 방법

### **Step 1: SQL 파일 실행**

Supabase SQL Editor에서 실행:

```sql
-- database/ADD-AUCTION-NOTIFICATIONS.sql 파일 전체 복사해서 실행
```

**또는 파일 직접 실행:**
```bash
psql -U postgres -d artyard -f database/ADD-AUCTION-NOTIFICATIONS.sql
```

---

### **Step 2: 설치 확인**

SQL Editor에서 실행:

```sql
-- 트리거 확인
SELECT test_auction_notifications();

-- 결과: ✅ 경매 알림 트리거가 성공적으로 생성되었습니다!
```

**또는 수동 확인:**
```sql
-- 트리거 목록 확인
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname LIKE '%auction%'
ORDER BY tgname;

-- 기대 결과:
-- trigger_notify_auction_outbid | auction_bids
-- trigger_notify_auction_won    | challenge_auctions
```

---

## 🔧 작동 원리

### **1. 입찰 초과 알림 흐름**

```
사용자 B가 더 높은 금액 입찰
    ↓
INSERT INTO auction_bids
    ↓
TRIGGER: notify_auction_outbid()
    ↓
이전 최고 입찰자 조회 (auction_items.highest_bidder_id)
    ↓
이전 최고 입찰자 ≠ 새 입찰자?
    ↓ YES
INSERT INTO notifications
  (user_id = 이전 최고 입찰자,
   type = 'auction_outbid',
   message = '누군가 더 높은 입찰을 했습니다!')
```

**코드:**
```sql
CREATE TRIGGER trigger_notify_auction_outbid
    AFTER INSERT ON auction_bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_auction_outbid();
```

---

### **2. 경매 낙찰 알림 흐름**

```
Admin이 경매 종료 버튼 클릭
    ↓
UPDATE challenge_auctions 
SET status = 'ended'
    ↓
TRIGGER: notify_auction_won()
    ↓
해당 경매의 모든 auction_items 조회
    ↓
각 아이템의 highest_bidder_id가 있으면
    ↓
각 최고 입찰자에게 알림 생성
    ↓
INSERT INTO notifications
  (user_id = 최고 입찰자,
   type = 'auction_won',
   message = '축하합니다! 낙찰되었습니다!')
```

**코드:**
```sql
CREATE TRIGGER trigger_notify_auction_won
    AFTER UPDATE ON challenge_auctions
    FOR EACH ROW
    WHEN (NEW.status = 'ended' AND OLD.status != 'ended')
    EXECUTE FUNCTION notify_auction_won();
```

---

## 📱 앱에서 알림 처리

### **NotificationsScreen.tsx 수정**

이미 구현되어 있습니다! 하지만 경매 알림 타입을 처리하도록 추가:

```typescript
const handleNotificationPress = async (notification: Notification) => {
  // 알림 읽음 처리
  if (!notification.is_read) {
    await markNotificationAsRead(notification.id);
  }

  // 알림 타입에 따라 네비게이션
  switch (notification.type) {
    case 'auction_outbid':
    case 'auction_won':
      if (notification.data?.auction_item_id) {
        // 경매 상세 화면으로 이동
        const auctionId = notification.data.auction_id;
        navigation.navigate('AuctionDetail', { auctionId });
      }
      break;
    
    case 'new_artwork':
      // ... 기존 코드
      break;
    
    // ... 기타 타입들
  }
};
```

---

## 🧪 테스트 방법

### **1. 입찰 초과 알림 테스트**

```sql
-- Step 1: 사용자 A가 입찰 (가정: user_a_id, item_id 있음)
INSERT INTO auction_bids (auction_item_id, bidder_id, bid_amount, bid_type)
VALUES (
  'item-uuid-here',     -- 경매 아이템 ID
  'user-a-uuid-here',   -- 사용자 A
  100,                   -- $100
  'normal'
);

-- auction_items 업데이트 (최고 입찰자 설정)
UPDATE auction_items
SET 
  highest_bidder_id = 'user-a-uuid-here',
  current_price = 100,
  bids_count = bids_count + 1
WHERE id = 'item-uuid-here';

-- Step 2: 사용자 B가 더 높은 금액으로 입찰
INSERT INTO auction_bids (auction_item_id, bidder_id, bid_amount, bid_type)
VALUES (
  'item-uuid-here',     -- 같은 아이템
  'user-b-uuid-here',   -- 사용자 B
  150,                   -- $150 (더 높음!)
  'normal'
);

-- Step 3: 알림 확인
SELECT * FROM notifications
WHERE user_id = 'user-a-uuid-here'  -- 사용자 A 확인
  AND type = 'auction_outbid'
ORDER BY created_at DESC
LIMIT 1;

-- 기대 결과:
-- type: auction_outbid
-- title: You have been outbid! 🔨
-- message: Someone placed a higher bid ($150) on "..."
-- is_read: false
```

---

### **2. 경매 낙찰 알림 테스트**

```sql
-- Step 1: 경매 종료 (Admin 화면에서 버튼 클릭 또는 SQL)
UPDATE challenge_auctions
SET status = 'ended'
WHERE id = 'auction-uuid-here';

-- Step 2: 알림 확인 (모든 최고 입찰자)
SELECT 
  n.*,
  ai.highest_bidder_id,
  ai.current_price
FROM notifications n
JOIN auction_items ai ON ai.highest_bidder_id = n.user_id
WHERE n.type = 'auction_won'
  AND ai.auction_id = 'auction-uuid-here'
ORDER BY n.created_at DESC;

-- 기대 결과:
-- type: auction_won
-- title: You won the auction! 🎉
-- message: Congratulations! You won "..." for $1500. Please proceed with payment.
-- is_read: false
```

---

## 📊 알림 데이터 구조

### **입찰 초과 알림 데이터:**
```json
{
  "id": "notification-uuid",
  "user_id": "user-a-uuid",
  "type": "auction_outbid",
  "title": "You have been outbid! 🔨",
  "message": "Someone placed a higher bid ($150) on \"Sunset Over the Ocean\"",
  "data": {
    "auction_item_id": "item-uuid",
    "new_bid_amount": 150,
    "auction_title": "Sunset Over the Ocean"
  },
  "is_read": false,
  "created_at": "2025-11-19T12:34:56Z"
}
```

---

### **경매 낙찰 알림 데이터:**
```json
{
  "id": "notification-uuid",
  "user_id": "winner-uuid",
  "type": "auction_won",
  "title": "You won the auction! 🎉",
  "message": "Congratulations! You won \"Sunset Over the Ocean\" for $1,500. Please proceed with payment.",
  "data": {
    "auction_id": "auction-uuid",
    "auction_item_id": "item-uuid",
    "auction_title": "Q1 2026 Top Artworks Auction",
    "artwork_title": "Sunset Over the Ocean",
    "final_price": 1500
  },
  "is_read": false,
  "created_at": "2025-11-19T15:00:00Z"
}
```

---

## 🎯 사용자 경험 개선

### **Before (알림 없음):**
```
사용자 A: "내가 최고 입찰자인지 모르겠어..."
사용자 A: "경매 끝났는지 어떻게 알지?"
사용자 A: "내가 이겼는지 확인하러 계속 들어와야 해..."
```

### **After (알림 있음):**
```
🔔 You have been outbid!
   → 사용자 A: "오! 누군가 더 높은 입찰을 했구나. 다시 입찰해야겠다!"

🔔 You won the auction!
   → 사용자 A: "와! 낙찰되었다! 바로 결제하러 가자!"
```

**결과:**
- ✅ 사용자 참여도 증가
- ✅ 재입찰 가능성 증가
- ✅ 결제 전환율 증가
- ✅ 사용자 만족도 증가

---

## 🔍 문제 해결

### **알림이 생성되지 않을 때:**

1. **트리거 확인:**
```sql
SELECT * FROM pg_trigger 
WHERE tgname IN ('trigger_notify_auction_outbid', 'trigger_notify_auction_won');
```

2. **함수 확인:**
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('notify_auction_outbid', 'notify_auction_won');
```

3. **제약 조건 확인:**
```sql
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'notifications_type_check';
```

4. **로그 확인:**
```sql
-- Supabase Dashboard → Database → Logs
```

---

### **Common Issues:**

**Issue 1: 입찰 초과 알림이 중복 생성**
```
원인: auction_items의 highest_bidder_id가 제때 업데이트되지 않음
해결: auction_bids INSERT 후 즉시 auction_items 업데이트
```

**Issue 2: 경매 낙찰 알림이 안 옴**
```
원인: challenge_auctions.status가 'ended'로 변경되지 않음
해결: Admin 화면에서 "End Auction" 버튼 클릭 확인
```

---

## 📋 체크리스트

### **설치 확인:**
- [ ] SQL 파일 실행 완료
- [ ] `test_auction_notifications()` 통과
- [ ] 트리거 2개 생성 확인
- [ ] 함수 2개 생성 확인
- [ ] notifications 테이블 제약 조건 업데이트

### **테스트 확인:**
- [ ] 입찰 초과 알림 생성 확인
- [ ] 경매 낙찰 알림 생성 확인
- [ ] 앱에서 알림 표시 확인
- [ ] 알림 클릭 시 네비게이션 확인

### **운영 확인:**
- [ ] 실제 경매에서 알림 정상 작동
- [ ] 성능 이슈 없음
- [ ] 중복 알림 없음

---

## 🎉 완료!

### **이제 가능한 것:**
1. ✅ 입찰 초과 시 자동 알림
2. ✅ 경매 낙찰 시 자동 알림
3. ✅ 실시간 알림으로 사용자 참여 유도
4. ✅ 결제 전환율 증가

### **다음 단계:**
1. 🔔 Push 알림 추가 (선택사항)
2. 📧 이메일 알림 추가 (선택사항)
3. 📊 알림 통계 대시보드

**경매 알림 시스템이 완성되었습니다!** 🔨🎉

