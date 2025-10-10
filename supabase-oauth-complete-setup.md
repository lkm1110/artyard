# Supabase OAuth 완전 설정 가이드

## 🔍 1단계: Supabase 콜백 URL 확인

### Supabase Dashboard에서 확인
```
Dashboard → Authentication → Settings → Site URL
콜백 URL: https://[your-project-id].supabase.co/auth/v1/callback
```

## 🍎 2단계: Apple Developer 설정

### Service ID Configure
```
Domains and Subdomains:
[your-project-id].supabase.co
localhost

Return URLs:
https://[your-project-id].supabase.co/auth/v1/callback
http://localhost:8085/auth/callback
```

### Supabase Apple 설정
```
Authentication → Providers → Apple

Enable: ON
Client ID: com.artyard.app
Team ID: 9T69A85KY2
Key ID: 482NBGZKV9
Private Key: [이미 받은 P8 키 내용]
```

## 📘 3단계: Facebook Developer 설정

### Facebook Console
```
앱 도메인:
[your-project-id].supabase.co
localhost
artyard.app

OAuth 리디렉션 URI:
https://[your-project-id].supabase.co/auth/v1/callback
http://localhost:8085/auth/callback
https://artyard.app/auth/callback
```

### Facebook App Secret 확인 필요
```
Facebook Developer Console → 설정 → 기본 설정 → 앱 시크릿 [보기]
```

### Supabase Facebook 설정
```
Authentication → Providers → Facebook

Enable: ON
App ID: 822804507070963
App Secret: [Facebook에서 확인한 시크릿]
```

## 🔵 4단계: Google OAuth 설정

### Google Cloud Console
```
승인된 도메인:
[your-project-id].supabase.co
localhost
artyard.app

리디렉션 URI:
https://[your-project-id].supabase.co/auth/v1/callback
http://localhost:8085/auth/callback
https://artyard.app/auth/callback
```

### Supabase Google 설정
```
Authentication → Providers → Google

Enable: ON
Client ID: [Google 클라이언트 ID]
Client Secret: [Google 클라이언트 시크릿]
```

## 🟢 5단계: Naver (커스텀 유지)

### Naver Developers
```
서비스 URL:
https://[your-project-id].supabase.co
http://localhost:8085
https://artyard.app

Callback URL:
https://[your-project-id].supabase.co/auth/v1/callback
http://localhost:8085/auth/callback
https://artyard.app/auth/callback
```

## 🟡 6단계: Kakao (커스텀 유지)

### Kakao Developers
```
사이트 도메인:
https://[your-project-id].supabase.co
http://localhost:8085
https://artyard.app

Redirect URI:
https://[your-project-id].supabase.co/auth/v1/callback
http://localhost:8085/auth/callback
https://artyard.app/auth/callback
```

## 🚀 7단계: 코드 업데이트

### LoginScreen에서 Supabase OAuth 사용
```typescript
// Apple, Facebook, Google은 Supabase OAuth 사용
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple', // 또는 'facebook', 'google'
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// Naver, Kakao는 기존 커스텀 구현 유지
```

## 📋 필요한 정보 수집

### 즉시 확인 필요:
1. **Supabase Project ID**: Dashboard URL에서 확인
2. **Facebook App Secret**: Facebook Console에서 확인
3. **Google Client ID/Secret**: Google Console에서 확인

### 설정 순서:
1. Supabase 콜백 URL 확인
2. 각 OAuth 서비스에 Supabase URL 추가
3. Supabase에 각 서비스 키값 설정
4. 코드에서 Supabase OAuth 사용
