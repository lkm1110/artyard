# OAuth 로그인 설정 가이드

## 🚨 중요: Supabase Redirect URI 설정

브라우저 로그인이 작동하지 않는 이유는 **Supabase에서 Redirect URI를 허용하지 않았기 때문**입니다.

### 1. Supabase 대시보드 설정

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. **프로젝트 선택**: `bkvycanciimgyftdtqpx`
3. **Authentication** → **URL Configuration** 이동
4. **Redirect URLs**에 다음 URL 추가:

#### Expo Go 개발 환경 (필수)
```
exp://172.30.1.54:8085/--/auth-callback
exp://172.30.1.32:8085/--/auth-callback
```

> ⚠️ **IP 주소 변경 시**: 터미널의 Metro Bundler 로그에서 `Metro waiting on exp://YOUR_IP:8085` 확인 후 추가

#### 프로덕션 환경
```
artyard://auth-callback
```

### 2. 와일드카드 설정 (개발 편의성)

개발 중 IP가 자주 변경된다면:
```
exp://*:8085/--/auth-callback
```

> ⚠️ **보안 주의**: 프로덕션에서는 절대 와일드카드 사용 금지!

### 3. Site URL 설정

**Site URL** (Authentication → Settings):
```
exp://172.30.1.54:8085
```

---

## ✅ 수정된 사항

### 1. Facebook OAuth 수정
- ❌ 이전: `Linking.openURL()` 사용 (콜백 처리 안됨)
- ✅ 수정: `WebBrowser.openAuthSessionAsync()` 사용 (Google/Apple과 동일)

### 2. expo-notifications 경고 제거
- ❌ 이전: Expo Go에서 경고 메시지 표시
- ✅ 수정: Expo Go 환경에서 알림 기능 자동 비활성화

```typescript
// App.tsx
const isExpoGo = Constants.appOwnership === 'expo';
{!isExpoGo && <PushNotificationConsent />}

// PushNotificationHandler.tsx
if (isExpoGo) {
  console.log('⚠️ Notification listeners not available in Expo Go');
  return;
}
```

---

## 🔍 OAuth 로그인 테스트 방법

### 1. Google 로그인
```typescript
1. "Continue with Google" 버튼 클릭
2. 브라우저에서 Google 계정 선택
3. 권한 승인
4. 자동으로 앱으로 돌아옴 ✅
5. 로그인 완료!
```

### 2. Facebook 로그인
```typescript
1. "Continue with Facebook" 버튼 클릭
2. 브라우저에서 Facebook 로그인
3. 권한 승인
4. 자동으로 앱으로 돌아옴 ✅
5. 로그인 완료!
```

### 3. Apple 로그인
```typescript
1. "Continue with Apple" 버튼 클릭
2. 브라우저에서 Apple ID 로그인
3. 권한 승인
4. 자동으로 앱으로 돌아옴 ✅
5. 로그인 완료!
```

---

## 🐛 문제 해결

### "브라우저에서 로그인 후 앱으로 돌아오지 않아요"

**원인**: Supabase Redirect URI 미설정

**해결**:
1. Supabase 대시보드에서 Redirect URLs 확인
2. 현재 IP 주소 추가
3. 앱 재시작 (r + r)

### "Authorization code has already been used" 에러

**원인**: 같은 code를 두 번 사용함

**해결**:
- `AuthCallbackHandler.simple.tsx`가 비활성화되어 있는지 확인
- `nativeOAuth.ts`만 콜백 처리하도록 유지

### "expo-notifications 경고가 계속 나와요"

**원인**: Expo Go SDK 53+에서 푸시 알림 미지원

**해결**:
- 이미 수정 완료! ✅
- Expo Go에서는 자동으로 비활성화됨
- 개발 빌드를 사용하면 푸시 알림 사용 가능

---

## 📱 개발 빌드 vs Expo Go

### Expo Go (현재 사용중)
- ✅ 빠른 개발
- ✅ QR 코드로 즉시 테스트
- ❌ 푸시 알림 미지원 (SDK 53+)
- ❌ 일부 네이티브 모듈 제한

### 개발 빌드 (권장)
```bash
# EAS Build로 개발 빌드 생성
npx eas build --profile development --platform android

# 빌드된 APK 다운로드 및 설치
# 푸시 알림 등 모든 기능 사용 가능!
```

---

## 🎉 완료!

이제 다음 명령어로 앱을 reload하세요:
```
r + r (앱에서 Reload)
```

OAuth 로그인이 정상적으로 작동할 것입니다! 🚀

