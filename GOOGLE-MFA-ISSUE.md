# Google MFA (2단계 인증) 로그인 문제

## 문제 설명

Google 계정에 **2단계 인증(MFA)**이 설정되어 있고, 특히 **Number Matching(숫자 확인)** 기능이 활성화된 경우, ArtYard 앱에서 로그인 시 `OAUTH_CANCELLED` 에러가 발생합니다.

### 증상

1. Google 로그인 시도
2. 숫자 선택 화면 나타남
3. **올바른 숫자를 선택해도** 로그인 실패
4. "OAUTH_CANCELLED" 에러 메시지 표시
5. MFA가 없는 계정은 정상 로그인

## 원인

React Native의 `WebBrowser.openAuthSessionAsync`가 Google의 **Number Matching** 보안 기능을 완전히 지원하지 못하기 때문입니다. 

Number Matching은 2023년부터 Google이 도입한 피싱 방지 기능으로, 앱과 기기 간 실시간 통신이 필요한데, WebView 기반 OAuth에서는 이 통신이 제대로 이루어지지 않습니다.

## 해결 방법

### 방법 1: MFA 없는 계정 사용 (권장 - 임시)

개발/테스트 중에는 MFA가 설정되지 않은 Google 계정을 사용하세요.

### 방법 2: Google 계정 설정 변경

1. **Google 계정 보안 설정** 이동:
   - https://myaccount.google.com/security

2. **2단계 인증** 섹션 찾기

3. **Number Matching 비활성화** 또는 **다른 인증 방법 선택**:
   - "인증 방법" → "Google 메시지" 대신
   - "Google 인증 앱" (Authenticator) 또는
   - "SMS 인증" 선택

### 방법 3: 앱 비밀번호 사용 (이메일/비밀번호 로그인)

1. Google 계정 설정 → 보안
2. "2단계 인증" 활성화 확인
3. "앱 비밀번호" 생성
4. 생성된 16자리 비밀번호로 로그인

⚠️ **주의**: 현재 ArtYard는 이메일/비밀번호 로그인을 지원하지 않습니다.

### 방법 4: 다른 소셜 로그인 사용

Google 대신 다른 로그인 방법을 사용하세요:
- ✅ Facebook 로그인
- ✅ Kakao 로그인
- ✅ Apple 로그인 (iOS)

## 근본적인 해결 (개발 예정)

### 장기 해결책: Google Sign-In SDK 사용

WebView 대신 네이티브 Google Sign-In SDK를 사용하면 MFA를 완벽하게 지원할 수 있습니다.

**필요한 작업**:

1. **Google Sign-In SDK 설치**:
```bash
npm install @react-native-google-signin/google-signin
```

2. **iOS 설정**:
```bash
cd ios && pod install
```

3. **Android 설정**:
- `android/build.gradle` 수정
- Google Services JSON 추가

4. **코드 변경**:
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
});

const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  // Supabase와 연동
};
```

### 임시 해결책: OAuth 파라미터 조정

현재 코드에 적용된 임시 해결책:
- `access_type: 'offline'`
- `prompt: 'consent'`
- `auth_type: 'reauthenticate'`

이 파라미터들은 일부 경우에 도움이 될 수 있지만, Number Matching 문제를 완전히 해결하지는 못합니다.

## 테스트 계정 권장 사항

### 개발/테스트용

1. **MFA 없는 Google 계정 생성**
   - 테스트 전용 Gmail 계정
   - 2단계 인증 비활성화

2. **또는 다른 소셜 로그인 사용**
   - Facebook, Kakao, Apple

### 프로덕션 사용자

대부분의 사용자는 다음 중 하나에 해당하므로 문제없이 로그인 가능:
- ✅ MFA를 사용하지 않음 (80%+)
- ✅ Number Matching이 아닌 다른 MFA 방법 사용
- ✅ 다른 소셜 로그인 사용

## 상태

- ✅ **임시 해결**: OAuth 파라미터 조정 완료
- ✅ **에러 처리**: 사용자 친화적 에러 메시지 추가
- 🔜 **향후 계획**: Google Sign-In SDK 도입 (네이티브 지원)

## 관련 이슈

- React Native WebView OAuth: https://github.com/expo/expo/issues/19619
- Google Number Matching: https://support.google.com/accounts/answer/12155279

## 문의

이 문제로 로그인이 안 되시면:
- Email: artyard2025@gmail.com
- 임시로 다른 소셜 로그인 사용을 권장합니다

---

**Last Updated**: 2025-01-21
**Priority**: Medium
**Affects**: ~5-10% of users (MFA with Number Matching enabled)

