# artyard.app 도메인 OAuth 설정 가이드

## 🍎 Apple Service ID 임시 해결

### 현재 오류 해결 (개발용)
```
Domains and Subdomains:
localhost

Return URLs:
http://localhost:8085/auth/apple/callback
```

### 프로덕션 준비 (도메인 검증 후)
```
Domains and Subdomains:
localhost
artyard.app

Return URLs:
http://localhost:8085/auth/apple/callback
https://artyard.app/auth/apple/callback
```

## 📱 모든 OAuth 서비스 업데이트

### 1. Google OAuth Console
- **위치**: https://console.developers.google.com
- **설정**: OAuth 2.0 클라이언트 ID
- **추가할 항목**:
  ```
  승인된 도메인: artyard.app
  승인된 리디렉션 URI: https://artyard.app/auth/callback
  ```

### 2. Facebook Developer Console
- **위치**: https://developers.facebook.com/apps
- **설정**: 앱 설정 → 기본 설정
- **추가할 항목**:
  ```
  앱 도메인: artyard.app
  유효한 OAuth 리디렉션 URI: https://artyard.app/auth/callback
  ```

### 3. Naver Developers
- **위치**: https://developers.naver.com/apps
- **설정**: 내 애플리케이션 → API 설정
- **추가할 항목**:
  ```
  서비스 URL: https://artyard.app
  Callback URL: https://artyard.app/auth/callback
  ```

### 4. Kakao Developers
- **위치**: https://developers.kakao.com/console/app
- **설정**: 앱 설정 → 플랫폼 → Web
- **추가할 항목**:
  ```
  사이트 도메인: https://artyard.app
  Redirect URI: https://artyard.app/auth/callback
  ```

## 🔧 Supabase 설정 업데이트

### Authentication → Settings → Site URL
```
현재: http://172.30.1.66:8085
추가: https://artyard.app
```

### Authentication → Settings → Redirect URLs
```
기존 URL들 유지 +
https://artyard.app/auth/callback
```

## 📋 환경 변수 업데이트

### .env 파일에 추가
```bash
# 프로덕션 도메인
EXPO_PUBLIC_PRODUCTION_URL=https://artyard.app

# Apple OAuth (업데이트)
EXPO_PUBLIC_APPLE_CLIENT_ID=artyard.app
```

## ⚠️ 주의사항

1. **도메인 검증**: artyard.app이 실제로 접근 가능해야 함
2. **HTTPS 필수**: 모든 프로덕션 URL은 HTTPS 사용
3. **단계적 적용**: 개발 → 스테이징 → 프로덕션 순서로 적용
4. **테스트**: 각 OAuth 서비스별로 개별 테스트 필요

## 🚀 적용 순서

1. **도메인 DNS 설정 완료**
2. **HTTPS 인증서 설정**
3. **Apple Service ID에 artyard.app 추가**
4. **다른 OAuth 서비스들 순차 업데이트**
5. **Supabase 설정 업데이트**
6. **환경 변수 업데이트**
7. **전체 테스트**
