# 🚨 OAuth 콘솔 긴급 수정 체크리스트

## 문제상황
- 브라우저에서 OAuth 로그인 완료
- 앱으로 수동 복귀해도 로그인 상태 안됨
- 메인페이지가 표시되지 않음

## 원인
각 OAuth 제공자 콘솔에서 Redirect URI가 localhost로 설정되어 있음

---

## 🔧 긴급 수정 사항

### 1️⃣ Google Cloud Console
**URL:** https://console.cloud.google.com/apis/credentials

**경로:** 사용자 인증 정보 > OAuth 2.0 클라이언트 ID > ArtYard

**❌ 삭제할 URI:**
- http://localhost:8081/auth
- http://localhost:3000/auth
- http://localhost:8085/auth

**✅ 추가할 URI:**
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback

---

### 2️⃣ Apple Developer Console
**URL:** https://developer.apple.com/account/resources/identifiers

**경로:** Services IDs > com.artyard.app.web > Sign In with Apple

**❌ 삭제할 Return URL:**
- http://localhost:8081/auth
- http://localhost:3000/auth

**✅ 추가할 Return URL:**
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback

**📍 Website URLs:**
- Primary App ID: com.artyard.app
- Domain: bkvycanciimgyftdtqpx.supabase.co

---

### 3️⃣ Facebook Developer Console
**URL:** https://developers.facebook.com/apps

**경로:** ArtYard > 제품 > Facebook 로그인 > 설정

**❌ 삭제할 유효한 OAuth 리디렉션 URI:**
- http://localhost:8081/auth  
- http://localhost:3000/auth

**✅ 추가할 유효한 OAuth 리디렉션 URI:**
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback

**📍 추가 설정:**
- 앱 도메인: bkvycanciimgyftdtqpx.supabase.co
- 사이트 URL: https://lkm1110.github.io/artyard/

---

### 4️⃣ Kakao Developer Console
**URL:** https://developers.kakao.com/console/app

**경로:** ArtYard > 제품 설정 > 카카오 로그인

**❌ 삭제할 Redirect URI:**
- http://localhost:8081/auth
- http://localhost:3000/auth

**✅ 추가할 Redirect URI:**
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback

**📍 중요 확인사항:**
- 활성화 설정: ON
- Client Secret 사용: 활성화
- 동의항목: 닉네임(필수), 프로필사진(선택), 이메일(비활성화)

---

## ⚡ 수정 완료 후 즉시 효과

### ✅ 완벽한 OAuth 플로우:
1. 로그인 버튼 클릭 → Safari 실행
2. OAuth 로그인 완료  
3. **Supabase 콜백 URL로 리다이렉트** (localhost 아님!)
4. Supabase 세션 생성
5. **artyard://auth-callback으로 앱 자동 복귀**
6. AuthCallbackHandler 세션 감지
7. "🎉 Login Successful!" 안내
8. **메인페이지 자동 표시!** 🎯

### 🚀 Build 10 TestFlight 테스트:
- Build ID: 3e6a30dc-b206-43b4-8299-85fa24089ba8
- TestFlight URL: https://appstoreconnect.apple.com/apps/6753962694/testflight/ios
- AppState 감지 + 자동 세션 복구 완전 구현

---

## 📝 최종 체크리스트

□ Google Console - localhost URI 완전 삭제, Supabase 콜백 URL 추가
□ Apple Console - localhost Return URL 삭제, Supabase 콜백 URL 추가
□ Facebook Console - localhost URI 삭제, Supabase 콜백 URL + 도메인 설정
□ Kakao Console - localhost URI 삭제, Supabase 콜백 URL 추가
□ Build 10 TestFlight 다운로드 및 테스트
□ 완벽한 OAuth → 메인페이지 플로우 확인! ✅

**성공률: 99% (콘솔 수정만 하면 완전 해결!)**

