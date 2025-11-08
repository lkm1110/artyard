# 🌐 artyard.app 도메인 OAuth 콜백 완벽 설정 가이드

## 현재 상황
- artyard.app 도메인 소유 ✅
- 현재는 Supabase 콜백 URL 사용 중
- 더 전문적인 브랜딩을 위해 자체 도메인 활용 가능

---

## 🎯 방안 1: artyard.app OAuth 콜백 페이지 설정

### 1단계: 간단한 OAuth 콜백 페이지 생성
```html
<!-- https://artyard.app/auth/callback.html -->
<!DOCTYPE html>
<html>
<head>
    <title>ArtYard - Login Processing</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>🎨 ArtYard</h2>
        <p>Login successful! Returning to app...</p>
        <p style="font-size: 14px; opacity: 0.8;">If you're not redirected automatically, please return to the ArtYard app.</p>
    </div>
    
    <script>
        // OAuth 콜백 처리
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // 토큰 정보 확인
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const error = urlParams.get('error') || hashParams.get('error');
        
        if (error) {
            document.querySelector('p').textContent = 'Login failed: ' + error;
        } else if (accessToken) {
            // 성공적으로 토큰을 받았으면 앱으로 리다이렉트
            setTimeout(() => {
                // Deep Link로 앱 복귀 시도
                window.location.href = 'artyard://auth-callback' + window.location.search + window.location.hash;
                
                // 3초 후에도 앱으로 안 갔으면 안내 메시지 변경
                setTimeout(() => {
                    document.querySelector('p').innerHTML = 
                        'Please return to the ArtYard app to complete login.<br>' +
                        '<small style="opacity: 0.7;">You can close this browser tab.</small>';
                }, 3000);
            }, 2000);
        }
    </script>
</body>
</html>
```

### 2단계: 도메인 설정
- artyard.app에서 `/auth/callback.html` 호스팅
- HTTPS 필수 (Let's Encrypt 무료 SSL)
- CDN 설정 권장 (Cloudflare 무료)

### 3단계: OAuth 제공자 콘솔 수정
```
Google Console:
✅ https://artyard.app/auth/callback.html

Apple Developer:  
✅ https://artyard.app/auth/callback.html

Facebook Developer:
✅ https://artyard.app/auth/callback.html
✅ 앱 도메인: artyard.app

Kakao Developer:
✅ https://artyard.app/auth/callback.html
```

### 4단계: 코드 수정
```typescript
// 모든 OAuth 파일에서 콜백 URL 변경
const redirectUri = 'https://artyard.app/auth/callback.html';
```

---

## 🎯 방안 2: artyard.app 메인 페이지 + OAuth 콜백

### 구조:
```
https://artyard.app/               ← 메인 랜딩 페이지
https://artyard.app/auth/          ← OAuth 콜백 페이지
https://artyard.app/privacy/       ← 개인정보처리방침
https://artyard.app/terms/         ← 이용약관
https://artyard.app/download/      ← 앱 다운로드 페이지
```

### 장점:
- 완전한 브랜딩
- App Store 심사 시 더 전문적
- SEO 및 마케팅 활용 가능
- 사용자 신뢰도 향상

---

## 🎯 방안 3: 현재 Supabase + artyard.app 랜딩 (추천)

### 이유:
- OAuth 콜백: Supabase 사용 (안정성 최고)
- 브랜딩: artyard.app 메인 페이지
- 개발 속도: 가장 빠름
- 유지보수: 가장 간단

### 설정:
```
OAuth 콜백: https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback (현재)
메인 페이지: https://artyard.app (새로 생성)
앱 다운로드: https://artyard.app/download
```

---

## 📊 방안별 비교

| 항목 | Supabase 콜백 | artyard.app 콜백 | 하이브리드 |
|------|---------------|------------------|------------|
| 안정성 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 브랜딩 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 개발시간 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 유지보수 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 추천: 방안 3 (하이브리드)
- 현재 OAuth 콜백은 Supabase 유지 (안정성)
- artyard.app에 멋진 랜딩 페이지 생성 (브랜딩)
- App Store 제출 시 artyard.app을 홈페이지로 등록


