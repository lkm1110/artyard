# 🔔 Artyard 알림 시스템 완벽 가이드

## 📋 알림이 발생하는 모든 조건

---

## 🎨 현재 구현된 알림 (자동 발생)

### **1. 새 작품 업로드 알림** 🖼️

**조건:**
- 내가 **팔로우한 아티스트**가 새 작품을 업로드할 때

**트리거:**
```sql
-- artworks 테이블에 INSERT 될 때 자동 실행
CREATE TRIGGER trigger_notify_followers_new_artwork
    AFTER INSERT ON artworks
    FOR EACH ROW
    EXECUTE FUNCTION notify_followers_new_artwork();
```

**발생 로직:**
```sql
-- 작품을 올린 아티스트의 모든 팔로워에게 알림 생성
INSERT INTO notifications (user_id, type, title, message, data)
SELECT 
    f.follower_id,                    -- 팔로워에게
    'new_artwork',                     -- 타입: 새 작품
    'New artwork from ' || p.handle,   -- 제목
    p.handle || ' has posted a new artwork: ' || NEW.title,  -- 메시지
    jsonb_build_object(
        'artwork_id', NEW.id,
        'artist_id', NEW.author_id,
        'artist_handle', p.handle
    )
FROM follows f
JOIN profiles p ON p.id = NEW.author_id
WHERE f.following_id = NEW.author_id;  -- 해당 아티스트를 팔로우하는 사람들
```

**예시:**
```
┌─────────────────────────────────────┐
│ 🔔 New artwork from @artist123      │
│ artist123 has posted a new artwork: │
│ "Sunset Over the Ocean"             │
│                                      │
│ 클릭 시: 작품 상세 화면으로 이동    │
└─────────────────────────────────────┘
```

---

### **2. 새 팔로워 알림** 👥

**조건:**
- 누군가 나를 **팔로우**할 때

**트리거:**
```sql
-- follows 테이블에 INSERT 될 때 자동 실행
CREATE TRIGGER trigger_notify_new_follower
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_follower();
```

**발생 로직:**
```sql
-- 팔로우 당한 사람에게 알림 생성
INSERT INTO notifications (user_id, type, title, message, data)
SELECT 
    NEW.following_id,                   -- 팔로우 당한 사람에게
    'new_follower',                      -- 타입: 새 팔로워
    'New follower',                      -- 제목
    p.handle || ' started following you', -- 메시지
    jsonb_build_object(
        'follower_id', NEW.follower_id,
        'follower_handle', p.handle
    )
FROM profiles p
WHERE p.id = NEW.follower_id;           -- 팔로우한 사람 정보
```

**예시:**
```
┌─────────────────────────────────────┐
│ 🔔 New follower                      │
│ john_doe started following you      │
│                                      │
│ 클릭 시: 팔로워의 프로필로 이동     │
└─────────────────────────────────────┘
```

---

### **3. 정산 완료 알림** 💰

**조건:**
- 작품이 판매되고 **정산이 완료**될 때 (판매자에게)

**트리거:**
```sql
-- 수동으로 process_pending_payouts() 함수 실행 시
-- 또는 자동 정산 프로세스 실행 시
```

**발생 로직:**
```sql
-- 판매자에게 정산 완료 알림
INSERT INTO notifications (user_id, type, title, message, link)
VALUES (
    seller_id,                                      -- 판매자에게
    'payout',                                       -- 타입: 정산
    'Payment Released! 💰',                        -- 제목
    'Your earnings have been released. Amount: $' || seller_amount,  -- 메시지
    '/sales/' || transaction_id                    -- 링크
);
```

**예시:**
```
┌─────────────────────────────────────┐
│ 🔔 Payment Released! 💰             │
│ Your earnings have been released.   │
│ Amount: $1,500                       │
│                                      │
│ 클릭 시: 판매 내역으로 이동          │
└─────────────────────────────────────┘
```

---

## 🚧 구현 가능한 알림 (현재 미구현)

### **4. 좋아요 알림** ❤️

**조건:**
- 누군가 내 작품을 **좋아요**할 때

**구현 필요:**
```sql
-- 좋아요 알림 함수
CREATE OR REPLACE FUNCTION notify_artwork_like()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        a.author_id,                     -- 작품 작가에게
        'like',                           -- 타입: 좋아요
        'Someone liked your artwork',     -- 제목
        p.handle || ' liked "' || a.title || '"',  -- 메시지
        jsonb_build_object(
            'artwork_id', NEW.artwork_id,
            'liker_id', NEW.user_id,
            'liker_handle', p.handle
        )
    FROM artworks a
    JOIN profiles p ON p.id = NEW.user_id
    WHERE a.id = NEW.artwork_id
      AND a.author_id != NEW.user_id;  -- 자기 작품 좋아요는 알림 없음
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER trigger_notify_artwork_like
    AFTER INSERT ON artwork_likes
    FOR EACH ROW
    EXECUTE FUNCTION notify_artwork_like();
```

---

### **5. 댓글 알림** 💬

**조건:**
- 누군가 내 작품에 **댓글**을 달 때

**구현 필요:**
```sql
-- 댓글 알림 함수
CREATE OR REPLACE FUNCTION notify_artwork_comment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        a.author_id,                      -- 작품 작가에게
        'comment',                         -- 타입: 댓글
        'New comment on your artwork',     -- 제목
        p.handle || ' commented on "' || a.title || '"',  -- 메시지
        jsonb_build_object(
            'artwork_id', NEW.artwork_id,
            'comment_id', NEW.id,
            'commenter_id', NEW.user_id,
            'commenter_handle', p.handle
        )
    FROM artworks a
    JOIN profiles p ON p.id = NEW.user_id
    WHERE a.id = NEW.artwork_id
      AND a.author_id != NEW.user_id;  -- 자기 작품 댓글은 알림 없음
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER trigger_notify_artwork_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_artwork_comment();
```

---

### **6. 구매 알림** 💳

**조건:**
- 내 작품이 **구매**될 때 (판매자에게)

**구현 필요:**
```sql
-- 구매 알림 함수
CREATE OR REPLACE FUNCTION notify_artwork_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- 판매자에게만 알림 (구매자는 이메일로)
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        NEW.seller_id,                     -- 판매자에게
        'purchase',                         -- 타입: 구매
        'Your artwork was sold! 🎉',       -- 제목
        'Someone purchased your artwork for $' || NEW.amount,  -- 메시지
        jsonb_build_object(
            'transaction_id', NEW.id,
            'artwork_id', NEW.artwork_id,
            'buyer_id', NEW.buyer_id,
            'amount', NEW.amount
        )
    WHERE NEW.status = 'paid';  -- 결제 완료 시에만
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER trigger_notify_artwork_purchase
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.status = 'paid')
    EXECUTE FUNCTION notify_artwork_purchase();
```

---

### **7. 챌린지 알림** 🏆

**조건:**
- 참여한 챌린지의 **우승자가 발표**될 때
- 내가 **우승**했을 때
- 새로운 챌린지가 **시작**될 때

**구현 필요:**
```sql
-- 챌린지 우승자 알림 함수
CREATE OR REPLACE FUNCTION notify_challenge_winner()
RETURNS TRIGGER AS $$
BEGIN
    -- 우승자에게 알림
    IF NEW.is_winner = true AND (OLD.is_winner IS NULL OR OLD.is_winner = false) THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT 
            ce.user_id,                     -- 우승자에게
            'challenge_win',                -- 타입: 챌린지 우승
            'You won the challenge! 🏆',   -- 제목
            'Congratulations! You won "' || c.title || '"',  -- 메시지
            jsonb_build_object(
                'challenge_id', c.id,
                'challenge_title', c.title,
                'entry_id', NEW.id
            )
        FROM challenge_entries ce
        JOIN challenges c ON c.id = ce.challenge_id
        WHERE ce.id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **8. 경매 알림** 🔨

**조건:**
- 내가 입찰한 경매에서 **더 높은 입찰**이 들어왔을 때
- 내가 입찰한 경매가 **종료**될 때
- 내가 **최고 입찰자**로 낙찰되었을 때

**구현 필요:**
```sql
-- 경매 입찰 알림 함수
CREATE OR REPLACE FUNCTION notify_auction_outbid()
RETURNS TRIGGER AS $$
BEGIN
    -- 이전 최고 입찰자에게 알림
    IF OLD.highest_bidder_id IS NOT NULL AND NEW.highest_bidder_id != OLD.highest_bidder_id THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            OLD.highest_bidder_id,                    -- 이전 최고 입찰자
            'auction_outbid',                         -- 타입: 입찰 초과됨
            'You have been outbid! 🔨',              -- 제목
            'Someone placed a higher bid on the auction',  -- 메시지
            jsonb_build_object(
                'auction_item_id', NEW.id,
                'new_highest_bid', NEW.current_price
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 경매 종료 알림 함수
CREATE OR REPLACE FUNCTION notify_auction_end()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ended' AND OLD.status = 'active' THEN
        -- 최고 입찰자에게 낙찰 알림
        IF NEW.highest_bidder_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                NEW.highest_bidder_id,                -- 낙찰자
                'auction_won',                         -- 타입: 경매 낙찰
                'You won the auction! 🎉',            -- 제목
                'Congratulations! Please proceed with payment',  -- 메시지
                jsonb_build_object(
                    'auction_item_id', NEW.id,
                    'final_price', NEW.current_price
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **9. 배송 알림** 📦

**조건:**
- 주문한 작품이 **배송 시작**될 때
- 작품이 **배송 완료**될 때

**구현 필요:**
```sql
-- 배송 상태 알림 함수
CREATE OR REPLACE FUNCTION notify_shipping_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 배송 시작 알림
    IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.buyer_id,                              -- 구매자
            'shipping_started',                        -- 타입: 배송 시작
            'Your order has been shipped! 📦',        -- 제목
            'Track your package: ' || NEW.tracking_number,  -- 메시지
            jsonb_build_object(
                'transaction_id', NEW.id,
                'tracking_number', NEW.tracking_number,
                'carrier', NEW.carrier
            )
        );
    END IF;
    
    -- 배송 완료 알림
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.buyer_id,                              -- 구매자
            'shipping_delivered',                      -- 타입: 배송 완료
            'Your order has been delivered! ✅',      -- 제목
            'Please confirm receipt of your artwork',  -- 메시지
            jsonb_build_object(
                'transaction_id', NEW.id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 알림 타입 정리

### **현재 구현됨** ✅
| 타입 | 조건 | 대상 | 자동/수동 |
|------|------|------|-----------|
| `new_artwork` | 팔로우한 작가가 작품 업로드 | 팔로워들 | 자동 |
| `new_follower` | 누군가 나를 팔로우 | 팔로우 당한 사람 | 자동 |
| `payout` | 정산 완료 | 판매자 | 자동 |

### **구현 가능** 🚧
| 타입 | 조건 | 대상 | 우선순위 |
|------|------|------|----------|
| `like` | 작품 좋아요 | 작품 작가 | ⭐⭐⭐ 높음 |
| `comment` | 작품 댓글 | 작품 작가 | ⭐⭐⭐ 높음 |
| `purchase` | 작품 구매 | 판매자 | ⭐⭐⭐ 높음 |
| `challenge_win` | 챌린지 우승 | 우승자 | ⭐⭐ 중간 |
| `challenge_end` | 챌린지 종료 | 참가자들 | ⭐⭐ 중간 |
| `auction_outbid` | 내 입찰이 초과됨 | 이전 최고 입찰자 | ⭐⭐⭐ 높음 |
| `auction_won` | 경매 낙찰 | 최고 입찰자 | ⭐⭐⭐ 높음 |
| `shipping_started` | 배송 시작 | 구매자 | ⭐⭐ 중간 |
| `shipping_delivered` | 배송 완료 | 구매자 | ⭐⭐ 중간 |

---

## 🔧 알림 시스템 아키텍처

### **1. 데이터베이스 트리거 방식** ⚡
```
작품 업로드
    ↓
INSERT INTO artworks
    ↓
TRIGGER: notify_followers_new_artwork()
    ↓
INSERT INTO notifications (팔로워들에게)
    ↓
사용자 알림 화면에 표시
```

**장점:**
- ✅ 자동 실행
- ✅ 빠른 응답
- ✅ 일관성 보장

---

### **2. 알림 조회 흐름**
```
사용자 로그인
    ↓
NotificationsScreen 열기
    ↓
getNotifications() 호출
    ↓
SELECT * FROM notifications 
WHERE user_id = current_user
ORDER BY created_at DESC
    ↓
알림 목록 표시
```

---

### **3. 알림 읽음 처리**
```
사용자가 알림 클릭
    ↓
markNotificationAsRead(notification_id)
    ↓
UPDATE notifications 
SET is_read = true
WHERE id = notification_id
    ↓
해당 화면으로 네비게이션
```

---

## 🎯 알림 우선순위

### **즉시 구현 권장** 🚨
1. **경매 입찰 초과 알림** (`auction_outbid`) - 사용자 경험 중요
2. **경매 낙찰 알림** (`auction_won`) - 결제 유도
3. **작품 구매 알림** (`purchase`) - 판매자 만족도
4. **좋아요 알림** (`like`) - 사용자 참여 유도
5. **댓글 알림** (`comment`) - 커뮤니티 활성화

### **추후 구현 가능** ⏰
6. 챌린지 알림 (`challenge_win`, `challenge_end`)
7. 배송 알림 (`shipping_started`, `shipping_delivered`)

---

## 📱 Push 알림 (선택 사항)

현재는 **인앱 알림**만 구현되어 있습니다. Push 알림을 추가하려면:

### **Expo Notifications 통합**
```typescript
import * as Notifications from 'expo-notifications';

// Push 토큰 등록
const token = await Notifications.getExpoPushTokenAsync();

// 알림 발생 시 Push 전송
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  body: JSON.stringify({
    to: userPushToken,
    title: notification.title,
    body: notification.message,
    data: notification.data,
  }),
});
```

---

## 🎉 요약

### **현재 작동 중인 알림:**
1. ✅ 새 작품 업로드 (팔로워에게)
2. ✅ 새 팔로워
3. ✅ 정산 완료

### **추가하면 좋은 알림:**
1. 🚧 경매 입찰 초과 / 낙찰
2. 🚧 작품 구매
3. 🚧 좋아요 / 댓글
4. 🚧 챌린지 결과
5. 🚧 배송 상태

모든 알림은 **데이터베이스 트리거**로 자동 생성되며, 사용자는 **NotificationsScreen**에서 확인할 수 있습니다! 🔔

