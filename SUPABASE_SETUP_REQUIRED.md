# 🚨 긴급: Supabase 설정 필요!

## Facebook 로그인이 작동하지 않는 이유

**"AuthSession failed: dismiss"** 에러가 발생하는 이유:

1. ❌ 이전 코드: `WebBrowser.openAuthSessionAsync`에 `https://` URL 전달
   - 브라우저가 `https://` URL로는 앱으로 돌아올 수 없음
   - 브라우저가 자동으로 닫힘 (dismiss)

2. ✅ 수정된 코드: `WebBrowser.openAuthSessionAsync`에 `exp://` URL 전달
   - 브라우저가 `exp://` URL을 감지하여 앱으로 돌아옴
   - **BUT**: Supabase Redirect URLs에 `exp://` URL이 없으면 여전히 실패!

---

## ⚡ 필수 설정: Supabase Redirect URLs

### 1단계: Supabase Dashboard 접속
https://supabase.com/dashboard

### 2단계: 프로젝트 선택
`bkvycanciimgyftdtqpx` 프로젝트 선택

### 3단계: Authentication → URL Configuration

#### 현재 Metro Bundler IP 확인
터미널에서 다음과 같은 로그 찾기:
```
Metro waiting on exp://172.30.1.54:8085
```

#### Redirect URLs에 추가

**정확한 IP로 추가**:
```
exp://172.30.1.54:8085/--/auth-callback
```

**또는 개발용 와일드카드** (권장):
```
exp://*:8085/--/auth-callback
```

> ⚠️ **보안 주의**: 프로덕션에서는 와일드카드 제거하고 정확한 URL만 사용!

#### Site URL도 설정
```
exp://172.30.1.54:8085
```

---

## ✅ Facebook Developer Console은 이미 설정됨

스크린샷을 보니 이미 올바르게 설정되어 있습니다:

- ✅ **OAuth 리디렉션 URI**: `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback`
- ✅ **앱 도메인**: `bkvycanciimgyftdtqpx.supabase.co` (필요시 추가)

> 📝 **참고**: Facebook은 `exp://` URL을 직접 지원하지 않으므로, Supabase callback URL을 통해 우회합니다.

---

## 🔄 올바른 OAuth 흐름

```
1. 사용자가 "Facebook 로그인" 클릭

2. 브라우저 열림 → Facebook 로그인

3. Facebook → Supabase callback
   (https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback)

4. Supabase → 앱으로 redirect
   (exp://172.30.1.54:8085/--/auth-callback)
   ↑ 이 단계에서 Supabase Redirect URLs 설정 필요!

5. WebBrowser가 exp:// URL 감지 → 앱으로 돌아옴

6. 앱에서 로그인 완료! ✅
```

---

## 🧪 테스트 순서

### 1. Supabase Redirect URLs 설정
```
exp://*:8085/--/auth-callback
```
또는
```
exp://YOUR_CURRENT_IP:8085/--/auth-callback
```

### 2. 앱 Reload
Expo Go에서 **r + r** (두 번 누르기)

### 3. Facebook 로그인 테스트
1. "Continue with Facebook" 버튼 클릭
2. 브라우저에서 Facebook 로그인
3. 권한 승인
4. **자동으로 앱으로 돌아옴** ✅
5. 로그인 완료!

---

## 🐛 여전히 "dismiss" 에러가 나온다면?

### 체크리스트:
- [ ] Supabase Redirect URLs에 `exp://` URL 추가했나요?
- [ ] 현재 Metro Bundler IP와 일치하나요?
- [ ] 앱을 reload 했나요? (r + r)
- [ ] Facebook Developer Console에 Supabase callback URL이 있나요?

### 로그 확인:
다음 로그가 나와야 합니다:
```
✅ Facebook OAuth 성공! Callback URL: exp://...
🔑 Authorization code 받음: ...
🎉 [Facebook] 로그인 성공!
```

**"dismiss" 로그가 나온다면**:
- Supabase Redirect URLs 설정을 다시 확인
- IP 주소가 정확한지 확인
- 와일드카드 사용 권장: `exp://*:8085/--/auth-callback`

---

## 🎉 모든 설정 완료 후

1. **Supabase Redirect URLs 설정 완료** ✅
2. **앱 Reload (r + r)** ✅
3. **Facebook 로그인 테스트** ✅

이제 Facebook 로그인이 정상적으로 작동할 것입니다! 🚀

