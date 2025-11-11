# 🔔 Expo Push Notification 설치 가이드

원격 푸시 알람 기능이 구현되었습니다! 이 가이드를 따라 설정하세요.

---

## 📋 구현된 기능

✅ **자동 푸시 알람:**
- 💬 **채팅 메시지**: 새 메시지를 받으면 알람
- 💭 **댓글**: 내 작품에 댓글이 달리면 알람
- 💰 **구매**: 내 작품이 판매되면 알람  
- ⭐ **리뷰**: 리뷰를 받으면 알람

✅ **Deep Linking:**
- 알람을 탭하면 해당 화면으로 자동 이동

✅ **비용:**
- **$0/월** (완전 무료!)

---

## 🚀 설치 단계

### **Step 1: Database 마이그레이션 실행**

Supabase SQL Editor에서 다음 파일들을 순서대로 실행하세요:

```sql
-- 1. Push Token 컬럼 추가
-- 파일: database/add-expo-push-token.sql
```

```sql
-- 2. Push Notification Triggers 생성 (댓글, 구매, 리뷰)
-- 파일: database/create-push-notification-triggers-fixed.sql
```

```sql
-- 3. Chat Message Trigger 생성
-- 파일: database/add-chat-push-notification-trigger-fixed.sql
```

**실행 방법:**
1. Supabase Dashboard → SQL Editor
2. 각 파일 내용 복사 → 붙여넣기 → Run

**✅ 완료!** 
- 더 이상 Database Config 설정 필요 없음
- Supabase URL과 Service Role Key가 Trigger Function에 포함되어 있음

---

### **Step 2: Supabase Edge Function 배포**

터미널에서 실행:

```bash
# ⚠️ Windows 사용자는 'supabase' 대신 'npx supabase' 사용!

# Supabase 로그인
npx supabase login

# Edge Function 배포
npx supabase functions deploy send-push-notification

# 환경 변수 확인 (자동으로 설정되어 있어야 함)
npx supabase secrets list
```

**참고:**
- Windows: `npx supabase` 사용 (설치 불필요)
- Mac/Linux: `brew install supabase/tap/supabase` 후 `supabase` 사용

**필요한 환경 변수:**
- `SUPABASE_URL`: 자동 설정됨
- `SUPABASE_SERVICE_ROLE_KEY`: 자동 설정됨

---

### **Step 3: 앱 빌드 및 테스트**

```bash
# 개발 빌드 생성 (Expo Go에서는 푸시 알람 작동 안 함!)
eas build --profile development --platform android
# 또는 iOS:
eas build --profile development --platform ios

# 프로덕션 빌드
eas build --profile production --platform all
```

**중요:**
- ✅ Development Build 필요
- ✅ 실제 디바이스 필요 (시뮬레이터 X)
- ❌ Expo Go에서는 작동 안 함

---

## 📱 테스트 방법

### **1. 앱 설치 및 로그인**
- Development Build 설치
- 로그인 → Push Token 자동 등록됨

### **2. 로그 확인**
```
✅ Push Token generated: ExponentPushToken[...]
✅ Push token saved to profiles table
```

### **3. 알람 테스트**

**방법 A: 실제 사용**
- 다른 계정에서 댓글 작성
- 다른 계정에서 작품 구매
- 다른 계정에서 채팅 메시지 전송

**방법 B: SQL에서 직접 테스트**
```sql
-- 댓글 추가 (자동으로 알람 전송됨)
INSERT INTO comments (artwork_id, author_id, content)
VALUES ('작품ID', '댓글작성자ID', 'Test comment');

-- 채팅 메시지 추가 (자동으로 알람 전송됨)
INSERT INTO messages (chat_id, sender_id, content)
VALUES ('채팅방ID', '발신자ID', 'Test message');
```

**방법 C: Edge Function 직접 호출**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "수신자_USER_ID",
    "title": "Test Notification",
    "body": "This is a test message",
    "data": {
      "type": "comment",
      "artworkId": "some-artwork-id"
    }
  }'
```

---

## 🔍 트러블슈팅

### **알람이 안 와요!**

**1. Push Token 확인**
```sql
SELECT id, handle, expo_push_token 
FROM profiles 
WHERE expo_push_token IS NOT NULL;
```
- Push Token이 `ExponentPushToken[...]` 형식이어야 함

**2. Edge Function 로그 확인**
```bash
# Windows
npx supabase functions logs send-push-notification

# Mac/Linux
supabase functions logs send-push-notification
```

**3. Trigger 확인**
```sql
-- Trigger가 활성화되어 있는지 확인
SELECT * FROM pg_trigger 
WHERE tgname IN (
  'on_comment_created',
  'on_purchase_completed', 
  'on_review_created',
  'on_chat_message_created'
);
```

**4. Trigger Function 확인**
```sql
-- Trigger Function이 올바르게 생성되었는지 확인
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'notify_%_push';
```
- 4개의 함수가 보여야 함:
  - `notify_comment_push`
  - `notify_purchase_push`
  - `notify_review_push`
  - `notify_chat_message_push`

---

### **일부 알람만 와요!**

특정 이벤트의 Trigger를 확인하세요:
```sql
-- 예: 댓글 Trigger 재생성
DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_push();
```

---

### **"Invalid push token" 에러**

앱을 재시작하여 새 Push Token을 받으세요:
1. 앱 완전 종료
2. 재시작
3. 로그인
4. Push Token이 자동으로 업데이트됨

---

## 📊 알람 통계 확인

```sql
-- Push Token을 가진 사용자 수
SELECT COUNT(*) 
FROM profiles 
WHERE expo_push_token IS NOT NULL;

-- 최근 댓글 수 (알람이 전송되었을 이벤트)
SELECT COUNT(*) 
FROM comments 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 최근 채팅 메시지 수
SELECT COUNT(*) 
FROM messages 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## 🎯 추가 기능 (선택사항)

### **좋아요/북마크/팔로우 알람 추가**

현재는 구현되지 않았지만, 필요하면 비슷한 방식으로 추가 가능합니다:

```sql
-- 예: 좋아요 알람
CREATE OR REPLACE FUNCTION notify_like_push()
RETURNS TRIGGER AS $$
-- ... (댓글 트리거와 비슷한 구조)
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_created
  AFTER INSERT ON artwork_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_like_push();
```

**주의:** 좋아요는 빈도가 높아 알람 폭탄이 될 수 있으므로 신중하게 결정하세요!

---

## 💰 비용

- **Expo Push Notifications**: $0 (무료)
- **Supabase Edge Functions**: $0 (Free Tier: 월 500,000 호출)
- **Database Triggers**: $0 (무료)

**예상 사용량:**
- 일 평균 알람 100개 = 월 3,000번 호출
- Free Tier 충분! ✅

---

## ✅ 완료 체크리스트

- [ ] Database 마이그레이션 3개 실행
- [ ] Edge Function 배포
- [ ] Database Config 설정 (URL, Service Role Key)
- [ ] Development Build 생성
- [ ] 실제 디바이스에 설치
- [ ] 로그인하여 Push Token 확인
- [ ] 알람 테스트 (댓글, 채팅, 구매)
- [ ] Deep Linking 테스트 (알람 탭 → 화면 이동)

---

## 📞 문제가 있나요?

1. **Supabase Dashboard → Functions → Logs** 확인
2. **앱 로그** 확인: `✅ Push token saved to profiles table`
3. **Database Triggers** 확인: `SELECT * FROM pg_trigger;`

모든 것이 제대로 작동하면:
- 💬 채팅 → 즉시 알람
- 💭 댓글 → 즉시 알람  
- 💰 구매 → 즉시 알람
- ⭐ 리뷰 → 즉시 알람

**원격 푸시 알람 구현 완료!** 🎉

