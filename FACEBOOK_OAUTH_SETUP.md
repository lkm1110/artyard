# Facebook OAuth 설정 가이드

## 🚨 Facebook 로그인이 작동하지 않는 이유

1. **Supabase Redirect URLs**에 `exp://` URL이 등록되지 않음
2. Facebook Developer Console 설정 확인 필요

---

## ⚡ 1단계: Supabase 대시보드 설정 (가장 중요!)

### 1. Supabase 대시보드 접속
https://supabase.com/dashboard

### 2. 프로젝트 선택
`bkvycanciimgyftdtqpx`

### 3. Authentication → URL Configuration

**Redirect URLs**에 다음 추가:

```
exp://172.30.1.54:8085/--/auth-callback
exp://172.30.1.32:8085/--/auth-callback
```

> 📍 **중요**: 터미널에서 `Metro waiting on exp://YOUR_IP:8085` 확인 후 추가

또는 개발용 와일드카드:
```
exp://*:8085/--/auth-callback
```

**Site URL**도 설정:
```
exp://172.30.1.54:8085
```

---

## 📱 2단계: Facebook Developer Console 설정

### 1. Facebook Developers 접속
https://developers.facebook.com/

### 2. 앱 선택
앱 ID: `8228045070700963` (artyard)

### 3. 설정 → 기본 설정

**앱 도메인**에 추가:
```
bkvycanciimgyftdtqpx.supabase.co
```

### 4. Facebook 로그인 → 설정

**유효한 OAuth 리디렉션 URI**에 추가:

```
https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

> ⚠️ **중요**: Facebook은 `exp://` URL을 직접 지원하지 않습니다!  
> Supabase callback URL만 사용하고, Supabase가 앱으로 redirect합니다.

---

## 🔄 Facebook OAuth 흐름 (수정됨)

```
1. 사용자가 "Facebook 로그인" 클릭
2. 브라우저에서 Facebook 로그인
3. Facebook → Supabase (https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback)
4. Supabase → 앱으로 리디렉션 (exp://YOUR_IP:8085/--/auth-callback)
5. 앱에서 로그인 완료
```

**핵심**: 
- Supabase Redirect URLs에 `exp://` URL 추가 필수!
- Facebook Developer Console에는 `https://` Supabase URL만 추가

---

## ✅ 수정된 코드

Facebook OAuth가 이제 exp:// URL로 올바르게 돌아옵니다:

```typescript
// ❌ 이전: WebBrowser에 https:// URL 전달 (앱으로 돌아올 수 없음!)
const redirectUri = 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback';
WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);

// ✅ 수정: Supabase OAuth에 exp:// URL 전달, WebBrowser에도 exp:// URL 전달
const expRedirectUri = AuthSession.makeRedirectUri({...}); // exp://...
supabase.auth.signInWithOAuth({
  provider: 'facebook',
  options: { redirectTo: expRedirectUri } // exp:// URL!
});
WebBrowser.openAuthSessionAsync(oauthUrl, expRedirectUri); // exp:// URL!
```

**차이점**:
- Supabase는 Facebook에서 받은 콜백을 `exp://` URL로 redirect
- WebBrowser는 `exp://` URL을 감지하여 앱으로 돌아옴

---

## 🧪 테스트 방법

1. **Supabase Redirect URLs 설정** (필수!)
   - `exp://YOUR_IP:8085/--/auth-callback` 추가
   
2. **Facebook Developer Console 설정 확인**
   - OAuth 리디렉션 URI에 `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback` 있는지 확인

3. **앱 reload**
   ```
   r + r
   ```

4. **Facebook 로그인 테스트**
   - Facebook 로그인 클릭
   - 브라우저에서 Facebook 인증
   - 자동으로 앱으로 돌아옴 ✅
   - 로그인 완료!

---

## 🐛 문제 해결

### "로그인 후 다시 로그인 페이지로 돌아와요"

**원인**: Supabase Redirect URLs에 `exp://` URL이 없음

**해결**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 `exp://YOUR_IP:8085/--/auth-callback` 추가
3. 앱 reload

### "Profile fetch timeout (3s)" 에러

**원인**: 네트워크가 느려서 프로필 조회 시간 초과

**해결**:
- ✅ 이미 수정 완료! (3초 → 10초)
- 네트워크 상태 확인

### Facebook Developer Console에서 "Invalid Redirect URI" 에러

**원인**: `exp://` URL을 Facebook에 추가하려고 시도

**해결**:
- Facebook에는 Supabase URL만 추가: `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback`
- `exp://` URL은 Supabase Redirect URLs에만 추가

---

## 🎉 완료!

설정을 완료한 후 앱을 reload하세요:
```
r + r
```

Facebook 로그인이 정상적으로 작동할 것입니다! 🚀
