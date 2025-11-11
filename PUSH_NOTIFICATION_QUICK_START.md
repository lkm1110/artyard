# 🚀 푸시 알람 5분 설치 가이드

원격 푸시 알람을 빠르게 설정하세요!

---

## ⚡ 빠른 설치 (5단계)

### **1️⃣ Database 마이그레이션 (1분)**

Supabase Dashboard → SQL Editor → 다음 3개 파일 실행:

```sql
-- ✅ Step 1
-- 파일: database/add-expo-push-token.sql
```

```sql
-- ✅ Step 2  
-- 파일: database/create-push-notification-triggers-fixed.sql
```

```sql
-- ✅ Step 3
-- 파일: database/add-chat-push-notification-trigger-fixed.sql
```

**✅ Database Config 설정 필요 없음!**
- Supabase URL과 Service Role Key가 이미 포함되어 있음

---

### **2️⃣ Edge Function 배포 (1분)**

터미널에서 (Windows는 `npx supabase` 사용):

```bash
# Windows
npx supabase login
npx supabase functions deploy send-push-notification

# Mac/Linux (Homebrew 설치 필요)
supabase login
supabase functions deploy send-push-notification
```

---

### **3️⃣ 앱 빌드 (5~10분)**

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

**중요:** Expo Go는 안 됨! Development Build 필요!

---

### **4️⃣ 테스트 (1분)**

1. 앱 설치 및 로그인
2. 다른 계정에서 댓글 작성
3. 푸시 알람 확인! 🎉

---

## ✅ 구현된 알람

| 이벤트 | 알람 제목 | 화면 이동 |
|--------|----------|----------|
| 💬 **채팅** | "New message from @user" | → Chat Screen |
| 💭 **댓글** | "New Comment" | → Artwork Detail |
| 💰 **구매** | "🎉 Artwork Sold!" | → Artwork Detail |
| ⭐ **리뷰** | "New Review" | → Artist Dashboard |

---

## 🔍 테스트 확인

### Push Token 확인:
```sql
SELECT handle, expo_push_token FROM profiles WHERE expo_push_token IS NOT NULL;
```

### 앱 로그 확인:
```
✅ Push Token generated: ExponentPushToken[...]
✅ Push token saved to profiles table
```

---

## ❌ 문제 해결

**알람이 안 와요?**

1. **Push Token 확인**
   - 앱 로그에 `Push Token generated` 있는지 확인

2. **Edge Function 확인**
   ```bash
   # Windows
   npx supabase functions logs send-push-notification
   
   # Mac/Linux
   supabase functions logs send-push-notification
   ```

3. **Trigger 확인**
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```
   - 4개의 trigger가 보여야 함

4. **Trigger Function 확인**
   ```sql
   SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE 'notify_%_push';
   ```
   - 4개의 함수가 보여야 함

---

## 💰 비용

- **$0/월** (완전 무료!)
- 월 500,000 알람까지 무료
- 초과해도 $25/월

---

## 📝 상세 가이드

더 자세한 정보는 `EXPO_PUSH_NOTIFICATION_SETUP.md` 참고!

---

**완료! 🎉 이제 사용자들이 실시간 알람을 받을 수 있습니다!**

