# 🔧 iOS 로그인 리디렉션 문제 해결 가이드

## 🎯 문제
iOS에서 OAuth 로그인 후 localhost로 리디렉션되고 앱으로 돌아오지 않음

## ✅ 해결 방법

### 1단계: Supabase 대시보드 설정 (필수)

1. **Supabase 대시보드 접속**
   ```
   https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/auth/url-configuration
   ```

2. **Redirect URLs 섹션에 다음 URL 추가**
   
   기존 URL들을 유지하고 다음을 **추가**하세요:
   ```
   artyard://auth-callback
   artyard://**
   ```

3. **Site URL 확인**
   
   Site URL이 다음 중 하나로 설정되어 있는지 확인:
   ```
   https://lkm1110.github.io/artyard
   ```

### 2단계: 각 OAuth 제공자 설정 확인

#### Google Cloud Console
```
https://console.cloud.google.com/
승인된 리디렉션 URI에 추가:
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

#### Apple Developer Console
```
https://developer.apple.com/account/resources/identifiers/
Service ID → Return URLs에 추가:
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

#### Facebook Developer Console
```
https://developers.facebook.com/apps/
OAuth 리디렉션 URI에 추가:
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

#### Kakao Developers
```
https://developers.kakao.com/
Redirect URI에 추가:
- https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

### 3단계: 앱 재시작 및 테스트

1. **완전히 앱 종료**
   - iOS에서 앱을 완전히 종료 (백그라운드에서도 제거)

2. **앱 재시작**
   ```bash
   npx expo start --clear
   ```

3. **테스트 절차**
   - 로그인 버튼 클릭
   - Safari에서 OAuth 완료
   - 자동으로 ArtYard 앱으로 돌아오는지 확인

## 🔍 문제 해결 팁

### 여전히 localhost로 리디렉션되는 경우

1. **Supabase 설정 저장 확인**
   - Redirect URLs를 추가한 후 반드시 "Save" 버튼 클릭
   - 브라우저 캐시 클리어

2. **Deep Link 테스트**
   
   터미널에서 다음 명령어로 deep link가 작동하는지 테스트:
   ```bash
   # iOS 시뮬레이터
   xcrun simctl openurl booted "artyard://auth-callback?test=true"
   
   # 실제 기기 (Mac에 연결된 경우)
   xcrun devicectl device open url "artyard://auth-callback?test=true"
   ```

3. **콘솔 로그 확인**
   
   앱이 실행 중일 때 Xcode에서 콘솔 로그를 확인하세요:
   ```
   "Deep Link URL:" 메시지가 나타나는지 확인
   "로그인 성공" 메시지가 나타나는지 확인
   ```

### 앱이 Safari에서 돌아오지만 로그인이 안되는 경우

1. **세션 확인**
   - 앱이 포그라운드로 돌아온 후 2-3초 대기
   - AuthCallbackHandler가 세션을 확인하는 시간 필요

2. **URL에 토큰이 포함되어 있는지 확인**
   - Deep link URL에 `access_token` 파라미터가 있어야 함
   - 없다면 Supabase OAuth 설정 재확인 필요

## 📋 체크리스트

- [ ] Supabase Redirect URLs에 `artyard://auth-callback` 추가
- [ ] Supabase Redirect URLs에 `artyard://**` 추가
- [ ] Google OAuth 리디렉션 URI 확인
- [ ] Apple OAuth 리디렉션 URI 확인
- [ ] Facebook OAuth 리디렉션 URI 확인
- [ ] Kakao OAuth 리디렉션 URI 확인
- [ ] 앱 완전 종료 후 재시작
- [ ] iOS에서 로그인 테스트

## 🎯 예상 동작

1. 로그인 버튼 클릭
2. Safari가 열림
3. OAuth 제공자 로그인 페이지 표시
4. 로그인 완료
5. **자동으로 ArtYard 앱으로 돌아옴** ← 이게 작동해야 함!
6. 1-2초 후 로그인 상태 확인
7. 홈 화면으로 이동

## ⚠️ 주의사항

- Supabase 대시보드에서 설정 변경 후 반드시 **Save** 클릭
- 변경 사항 적용에 1-2분 소요될 수 있음
- 앱을 **완전히 종료**하고 재시작해야 deep link 설정이 반영됨

