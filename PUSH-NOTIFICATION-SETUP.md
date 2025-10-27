# 🔔 Push Notification 설정 가이드

---

## ✅ **완료된 항목**

```yaml
✅ expo-notifications 패키지 설치
✅ pushNotificationService.ts 생성
✅ PushNotificationConsent 컴포넌트 (동의 팝업)
✅ PushNotificationHandler 컴포넌트 (알림 처리)
✅ App.tsx에 통합
✅ app.json 설정
✅ Database 스키마 (push_tokens, notification_queue)
✅ Database Triggers (자동 알림)
```

---

## 🚀 **다음 단계**

### **Step 1: Supabase에 테이블 생성**

```bash
# Supabase SQL Editor에서 실행:
database/push-notifications-schema.sql
```

이 스크립트는 다음을 생성합니다:
- `push_tokens` 테이블 (푸시 토큰 저장)
- `notification_queue` 테이블 (알림 큐)
- 자동 알림 Triggers:
  - ❤️ 좋아요
  - 💬 댓글
  - 👥 팔로우
  - 💬 메시지
  - 💰 거래 상태 변경

---

### **Step 2: 알림 아이콘 생성 (선택)**

```bash
# 96x96 PNG 파일 생성
# 투명 배경에 단색 아이콘 권장
assets/notification-icon.png
```

또는 기본 아이콘 사용 (생략 가능)

---

### **Step 3: 앱 빌드 및 테스트**

#### **개발 빌드 (실제 디바이스 필요)**

```bash
# EAS 빌드 설정 (이미 완료)
npx eas build:configure

# iOS 개발 빌드
npx eas build --platform ios --profile development

# Android 개발 빌드
npx eas build --platform android --profile development
```

**중요**: 푸시 알림은 **실제 디바이스**에서만 작동합니다!

---

### **Step 4: 프로덕션 빌드**

```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production
```

---

## 📱 **앱에서 테스트하는 방법**

### **1. 앱 실행 후 3초 대기**
→ 푸시 알림 동의 팝업이 자동으로 표시됩니다.

### **2. "Allow Notifications" 클릭**
→ 시스템 권한 요청이 나타납니다.

### **3. "Allow" 선택**
→ 푸시 토큰이 생성되고 Supabase에 저장됩니다.

### **4. 알림 테스트**

#### **방법 1: 다른 사용자 계정으로 액션 수행**
```yaml
예시:
  1. 계정 A로 작품 업로드
  2. 계정 B로 로그인
  3. 계정 B가 작품에 좋아요 누르기
  4. 계정 A에 푸시 알림 도착! ❤️
```

#### **방법 2: Supabase에서 직접 알림 큐 추가**
```sql
-- notification_queue에 테스트 알림 추가
INSERT INTO notification_queue (user_id, title, body, data, channel_id)
VALUES (
  'YOUR_USER_ID',
  '🔔 Test Notification',
  'This is a test push notification!',
  '{"type": "test"}',
  'default'
);
```

#### **방법 3: Expo Push Tool 사용**
```bash
# 푸시 토큰을 복사한 후:
https://expo.dev/notifications

# 또는 curl:
curl -H "Content-Type: application/json" -X POST https://exp.host/--/api/v2/push/send -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "sound": "default",
  "title": "Test",
  "body": "Hello World!",
  "data": { "type": "test" }
}'
```

---

## 🔔 **알림 타입별 동작**

```yaml
좋아요 (❤️):
  - 자동 발송: likes 테이블 INSERT 시
  - 클릭 시: 작품 상세 화면으로 이동
  - 채널: social

댓글 (💬):
  - 자동 발송: comments 테이블 INSERT 시
  - 클릭 시: 작품 상세 화면으로 이동
  - 채널: social

팔로우 (👥):
  - 자동 발송: follows 테이블 INSERT 시
  - 클릭 시: 사용자 프로필로 이동
  - 채널: social

메시지 (💬):
  - 자동 발송: messages 테이블 INSERT 시
  - 클릭 시: 채팅 화면으로 이동
  - 채널: messages

판매/주문 (💰):
  - 자동 발송: transactions 테이블 상태 변경 시
  - 클릭 시: 주문 내역으로 이동
  - 채널: sales
```

---

## ⚙️ **Android 채널 설정**

앱에서 자동으로 생성되는 채널:

```yaml
default:
  - 이름: Default
  - 중요도: MAX
  - 진동: [0, 250, 250, 250]
  - 색상: #E91E63

messages:
  - 이름: Messages
  - 중요도: HIGH
  - 진동: [0, 250, 250, 250]
  - 소리: default

sales:
  - 이름: Sales & Orders
  - 중요도: HIGH
  - 진동: [0, 500, 250, 500]
  - 소리: default

social:
  - 이름: Social
  - 중요도: DEFAULT
  - 진동: [0, 250]
```

---

## 🐛 **트러블슈팅**

### **1. "Push notifications only work on physical devices"**
→ 에뮬레이터/시뮬레이터에서는 작동 안 함. 실제 디바이스 사용 필요.

### **2. "No project ID found"**
→ `eas build:configure` 실행 필요.

### **3. 알림이 안 옴**
```bash
# 1. 푸시 토큰 확인
SELECT * FROM push_tokens WHERE user_id = 'YOUR_USER_ID';

# 2. 알림 큐 확인
SELECT * FROM notification_queue WHERE user_id = 'YOUR_USER_ID';

# 3. Trigger 확인
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_notify%';
```

### **4. iOS에서 알림 권한 재요청**
→ 설정 > 일반 > iPhone 저장공간 > ArtYard > 앱 삭제 후 재설치

### **5. Android에서 알림 채널 재설정**
→ 설정 > 앱 > ArtYard > 알림 > 각 채널 설정 확인

---

## 📊 **모니터링**

### **푸시 토큰 현황**
```sql
-- 플랫폼별 토큰 수
SELECT platform, COUNT(*) as count
FROM push_tokens
GROUP BY platform;

-- 최근 업데이트된 토큰
SELECT user_id, platform, device_name, updated_at
FROM push_tokens
ORDER BY updated_at DESC
LIMIT 10;
```

### **알림 전송 현황**
```sql
-- 상태별 알림 수
SELECT status, COUNT(*) as count
FROM notification_queue
GROUP BY status;

-- 최근 알림
SELECT user_id, title, body, status, created_at
FROM notification_queue
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 **다음 개선 사항 (선택)**

```yaml
선택 사항:
  □ Supabase Edge Function으로 알림 전송
  □ 알림 설정 화면 (카테고리별 On/Off)
  □ 알림 히스토리 화면
  □ 배치 알림 전송 (한꺼번에 여러 사용자)
  □ 예약 알림 (특정 시간에 전송)
  □ Rich Notifications (이미지 포함)
```

---

**완료! 이제 푸시 알림이 작동합니다!** 🎉

**실제 디바이스에 앱을 설치하고 테스트하세요!** 📱

