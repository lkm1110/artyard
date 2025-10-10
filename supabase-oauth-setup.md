# Supabase OAuth 설정 가이드

## Apple Sign-In 설정

1. **Supabase Dashboard 접속**
   - 프로젝트 → Authentication → Providers

2. **Apple 활성화**
   ```
   Enable Sign in with Apple: ON
   
   Client ID: com.artyard.app.web (Service ID)
   Team ID: [Apple Developer에서 받은 Team ID]
   Key ID: [Apple Developer에서 받은 Key ID]
   Private Key: [다운로드한 .p8 파일 내용]
   ```

3. **Redirect URLs 추가**
   ```
   Site URL: http://172.30.1.66:8085
   
   Redirect URLs:
   - http://localhost:8085/auth/callback
   - http://172.30.1.66:8085/auth/callback
   - https://artyard.ai/auth/callback
   - artyard://auth
   ```

## Facebook Login 설정

1. **Facebook 활성화**
   ```
   Enable Sign in with Facebook: ON
   
   App ID: 822804507070963
   App Secret: [Facebook Developer에서 확인]
   ```

2. **Redirect URLs 동일하게 설정**

## 테스트 방법

### 모바일 (실제 OAuth)
```bash
# Expo Go 앱에서 테스트
npx expo start --lan --port 8085
```

### 웹 (실제 OAuth)
```bash
# 브라우저에서 테스트
npx expo start --web --port 8085
```

## 주의사항

1. **Apple Private Key (.p8 파일)**
   - 한 번만 다운로드 가능
   - 안전한 곳에 보관
   - 절대 Git에 커밋하지 말 것

2. **Facebook App Secret**
   - Facebook Developer Console에서 확인
   - 환경 변수로 관리

3. **프로덕션 배포 시**
   - 도메인을 실제 도메인으로 변경
   - HTTPS 필수
   - 환경 변수 보안 관리
