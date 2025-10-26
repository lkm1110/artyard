# 🎯 최종 테스트 가이드 - iOS 로그인 문제 해결

## ✅ 완료된 수정 사항

### 1. Deep Link 처리 개선
- ✅ PKCE Flow 지원 추가 (`code` → 토큰 교환)
- ✅ 직접 토큰 처리 지원 (`access_token` + `refresh_token`)
- ✅ 에러 핸들링 강화

### 2. 디버깅 시스템 추가
- ✅ 화면에 로그 표시하는 `DebugLogger` 컴포넌트 추가
- ✅ 실제 기기에서 로그 확인 가능
- ✅ OAuth 전 과정 추적 가능

### 3. 빌드 시스템 설정
- ✅ `eas.json` iOS 프로덕션 설정 추가
- ✅ 빌드 스크립트 생성 (`build-ios.ps1`, `build-ios.sh`)

## 🚀 즉시 테스트 (로컬 개발 환경)

### 1. 앱 재시작
```bash
npx expo start --clear
```

### 2. iOS에서 앱 열기
- QR 코드 스캔 또는
- Expo Go 앱에서 프로젝트 선택

### 3. 디버그 로그 활성화
- 앱 화면 우측 하단의 **"🐛 디버그"** 버튼 클릭
- 디버그 창이 열림

### 4. 로그인 테스트
1. Google/Apple/Facebook/Kakao 로그인 버튼 클릭
2. Safari에서 로그인 완료
3. 앱으로 자동 전환되는지 확인
4. 디버그 로그에서 다음 확인:

#### ✅ 성공 케이스:
```
🔗 Deep Link 수신: artyard://auth-callback?code=...
🔄 OAuth 콜백 감지!
🔑 Authorization Code 감지!
✅ 로그인 성공!
👤 user@example.com
🔐 google
```

#### ❌ 실패 케이스 1: 토큰/Code 없음
```
🔗 Deep Link 수신: artyard://auth-callback
🔄 OAuth 콜백 감지!
⚠️ 토큰/Code 없음
파라미터: {}
```
**해결**: Supabase Redirect URLs 설정 재확인

#### ❌ 실패 케이스 2: Code 교환 실패
```
🔗 Deep Link 수신: artyard://auth-callback?code=...
🔄 OAuth 콜백 감지!
🔑 Authorization Code 감지!
❌ Code 교환 실패: Invalid code
```
**해결**: Supabase PKCE 설정 확인

## 📱 TestFlight 빌드 및 테스트

로컬 테스트에서 문제가 해결되었다면, TestFlight으로 실제 빌드를 테스트하세요.

### 1. 프로덕션 빌드 시작
```powershell
.\build-ios.ps1
```

또는 직접:
```bash
npx eas build --platform ios --profile production
```

### 2. 빌드 완료 대기
- 예상 시간: **15-20분**
- 빌드 상태 확인: https://expo.dev/accounts/lavlna280/projects/artyard/builds

### 3. TestFlight에서 설치
1. App Store Connect 접속: https://appstoreconnect.apple.com/
2. "나의 앱" → "ArtYard" → "TestFlight"
3. 새 빌드가 나타날 때까지 대기 (5-10분)
4. iPhone에서 TestFlight 앱 열기
5. ArtYard 업데이트 설치

### 4. 실제 기기에서 테스트
1. TestFlight에서 ArtYard 실행
2. **"🐛 디버그"** 버튼 클릭 (우측 하단)
3. 로그인 시도
4. 디버그 로그 확인

## 🔍 디버그 로그 사용법

### 로그 창 열기/닫기
- **열기**: 우측 하단 "🐛 디버그" 버튼 클릭
- **닫기**: 로그 창 상단 "닫기" 버튼 클릭
- **지우기**: 로그 창 상단 "지우기" 버튼 클릭

### 로그 색상 의미
- **흰색**: 일반 정보 (info)
- **초록색**: 성공 메시지 (success)
- **빨간색**: 에러 메시지 (error)
- **주황색**: 경고 메시지 (warning)

### 스크린샷 촬영
문제가 발생하면 디버그 로그 화면을 스크린샷으로 저장하세요.

## 📋 체크리스트

### Supabase 설정 확인
- [ ] Site URL: `https://lkm1110.github.io/artyard`
- [ ] Redirect URLs에 `artyard://auth-callback` 추가됨
- [ ] Redirect URLs에 `artyard://**` 추가됨
- [ ] "Save changes" 버튼 클릭함

### 앱 설정 확인
- [ ] `app.json`의 `scheme`: `artyard`
- [ ] iOS `CFBundleURLSchemes`: `["artyard"]`

### 테스트 단계
- [ ] 로컬 개발 환경에서 테스트 완료
- [ ] 디버그 로그에서 "✅ 로그인 성공!" 확인
- [ ] TestFlight 빌드 생성
- [ ] TestFlight에서 실제 기기 테스트

## 🐛 문제 해결

### 1. "토큰/Code 없음" 에러

**원인**: Supabase에서 deep link로 토큰을 전달하지 않음

**해결**:
1. Supabase 대시보드에서 Redirect URLs 재확인
2. `artyard://auth-callback`이 정확히 추가되었는지 확인
3. "Save changes" 버튼을 눌렀는지 확인
4. 5분 정도 기다린 후 재시도

### 2. "Code 교환 실패" 에러

**원인**: PKCE code verifier 불일치

**해결**:
1. 앱 완전 종료 후 재시작
2. Supabase에서 PKCE flow가 활성화되어 있는지 확인
3. `src/services/supabase.ts`의 `flowType: 'pkce'` 확인

### 3. 앱으로 돌아오지 않음

**원인**: Deep link 설정 문제

**해결**:
1. `app.json`에서 `scheme: "artyard"` 확인
2. iOS에서 앱 완전 삭제 후 재설치
3. TestFlight 빌드로 테스트 (개발 빌드는 deep link 제한적)

### 4. 디버그 로그가 안 보임

**원인**: 컴포넌트가 렌더링되지 않음

**해결**:
1. 앱 재시작
2. `App.tsx`에 `<DebugLogger />` 추가 확인
3. 화면을 스크롤해서 버튼 찾기

## 📊 예상 결과

### 성공 시나리오
```
사용자 액션           →  로그 메시지
───────────────────────────────────────────
1. 로그인 버튼 클릭    →  (Safari 열림)
2. OAuth 로그인 완료   →  🔗 Deep Link 수신
3. 앱으로 전환        →  🔄 OAuth 콜백 감지
4. Code 확인         →  🔑 Authorization Code 감지
5. 토큰 교환         →  (진행 중...)
6. 세션 생성         →  ✅ 로그인 성공!
7. 홈 화면 이동       →  (앱 사용 가능)
```

### 예상 소요 시간
- Deep Link 수신: **즉시**
- Code 교환: **1-2초**
- 세션 생성: **1초 이내**
- 전체 프로세스: **3-5초**

## 🎉 성공 확인

다음 조건이 모두 충족되면 문제가 해결된 것입니다:

- ✅ Safari에서 로그인 후 앱으로 자동 전환
- ✅ 디버그 로그에 "✅ 로그인 성공!" 표시
- ✅ 사용자 이메일/Provider 정보 표시
- ✅ 홈 화면으로 자동 이동
- ✅ 로그아웃 후 재로그인 시에도 동일하게 작동

## 📞 추가 지원

문제가 계속되면 다음 정보와 함께 문의:
1. 디버그 로그 스크린샷
2. Supabase Redirect URLs 설정 스크린샷
3. 사용한 OAuth 제공자 (Google/Apple/Facebook/Kakao)
4. 테스트 환경 (개발/TestFlight)

---

**시작**: 로컬에서 디버그 로그를 활성화하고 로그인 테스트를 시작하세요! 🚀

