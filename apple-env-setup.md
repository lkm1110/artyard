# Apple OAuth 환경 변수 설정

## .env 파일에 추가할 내용

```bash
# Apple OAuth (완전한 정보)
EXPO_PUBLIC_APPLE_TEAM_ID=9T69A85KY2
EXPO_PUBLIC_APPLE_CLIENT_ID=com.artyard.app.web
EXPO_PUBLIC_APPLE_KEY_ID=482NBGZKV9
```

## Supabase 설정

Supabase Dashboard → Authentication → Providers → Apple:

```
Enable Sign in with Apple: ON

Client ID: com.artyard.app.web
Team ID: 9T69A85KY2
Key ID: 482NBGZKV9

Private Key:
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEd/TPoB4MPQ3Z2pW
msdh37ibz7+NJ9UDSgyTw0sPs/6gCgYIKoZIzj0DAQehRANCAARlqehQ07VTxrAh
zJx7BHbFRDF72OujpwdpInWDHr2jKImaZ51UIHgDO3hgoNiTmUggk4GMD05MS1zm
hFDU2sbq
-----END PRIVATE KEY-----
```

## Service ID 올바른 설정 방법

### 1단계: 도메인 설정
```
Domains and Subdomains:
localhost
```

### 2단계: Return URLs 설정
```
Return URLs:
http://localhost:8085/auth/callback
http://127.0.0.1:8085/auth/callback
```

### 3단계: 프로덕션 추가 (나중에)
```
도메인 소유권 확인 후:
artyard.ai

Return URL 추가:
https://artyard.ai/auth/callback
```

## 주의사항

1. **Private Key 보안**: 절대 Git에 커밋하지 말 것
2. **도메인 소유권**: 실제 도메인은 소유권 확인 필요
3. **개발 환경**: localhost만으로도 개발/테스트 가능
