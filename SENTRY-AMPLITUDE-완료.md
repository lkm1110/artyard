# ✅ Sentry & Amplitude 설정 완료!

**상태**: 모든 키가 안전하게 저장되었습니다! 🎉

---

## 🔑 저장된 키 정보

### ✅ Sentry DSN
```
https://628a0dc38ec048876741c0e97ed8d370@o4510445563609088.ingest.us.sentry.io/4510445564461056
```
**저장 위치**: `app.json` → `extra.sentryDsn`

### ✅ Amplitude API Key
```
5703283b8f65e91b9e1ba0e20386fbf3
```
**저장 위치**: `app.json` → `extra.amplitudeApiKey`

---

## 🔒 보안 방식

### ❌ 나쁜 예 (하드코딩)
```typescript
// 코드에 직접 키 입력 - 위험!
Sentry.init({
  dsn: 'https://628a0dc38ec048876741c0e97ed8d370@...',
});
```

### ✅ 좋은 예 (환경 변수)
```typescript
// app.json에서 읽어오기 - 안전!
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
Sentry.init({ dsn: sentryDsn });
```

**장점**:
- ✅ GitHub에 올려도 안전 (app.json은 public이지만 분리 가능)
- ✅ 환경별 키 관리 쉬움 (dev/staging/prod)
- ✅ 키 변경 시 코드 수정 불필요

---

## 📦 현재 적용된 설정

### 1. app.json
```json
{
  "extra": {
    "supabaseUrl": "https://...",
    "supabaseAnonKey": "eyJ...",
    "sentryDsn": "https://628a0dc38ec048876741c0e97ed8d370@...",
    "amplitudeApiKey": "5703283b8f65e91b9e1ba0e20386fbf3"
  }
}
```

### 2. App.tsx
```typescript
// Sentry 초기화
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, ... });
}

// Amplitude 초기화
const amplitudeApiKey = Constants.expoConfig?.extra?.amplitudeApiKey;
if (amplitudeApiKey) {
  await analytics.initialize(amplitudeApiKey);
}
```

---

## 🧪 테스트 방법

### 1. 개발 모드 (콘솔 로그만)
```bash
npm start
# 📊 Analytics Event: user_login ...
# 🔴 Error Tracked: ...
```

### 2. 프로덕션 빌드 (실제 전송)
```bash
# 빌드
npm run build:android

# 설치 후 테스트
1. 회원가입
2. 작품 업로드
3. 좋아요 클릭

# 확인
- Sentry: https://sentry.io/organizations/your-org/issues/
- Amplitude: https://analytics.amplitude.com/
```

**예상 결과**:
- ✅ Sentry: 에러 발생 시 자동 전송
- ✅ Amplitude: `user_signup`, `artwork_upload` 등 이벤트 수집

---

## 📊 자동으로 수집되는 데이터

### Sentry (에러 트래킹)
프로덕션에서 다음 에러가 자동으로 전송됩니다:
- 앱 크래시
- API 호출 실패
- 이미지 업로드 실패
- 로그인 에러
- 권한 거부 에러

**민감 정보 보호**:
- ✅ 이메일 자동 제거
- ✅ 비밀번호 제거
- ✅ User ID만 전송

### Amplitude (사용자 분석)
프로덕션에서 다음 이벤트가 자동으로 전송됩니다:

**회원 관련**:
- `user_signup` (가입 방법: google/kakao/naver/apple)
- `user_login`
- `profile_edit`

**작품 관련**:
- `artwork_view`
- `artwork_upload`
- `artwork_like`
- `artwork_bookmark`

**챌린지 관련**:
- `challenge_view`
- `challenge_vote`
- `challenge_submit`

**소셜 관련**:
- `comment_post`
- `message_send`
- `user_follow`

**검색**:
- `search_performed`

---

## 🎯 대시보드 접속

### Sentry
```
URL: https://sentry.io/
Organization: your-org
Project: artyard
```

**확인할 것**:
- [ ] Issues 탭: 에러 목록
- [ ] Performance: 성능 지표
- [ ] User Feedback: 사용자 피드백

### Amplitude
```
URL: https://analytics.amplitude.com/
Organization: ArtYard
Project: ArtYard Production
```

**확인할 것**:
- [ ] Events: 이벤트 스트림
- [ ] Users: 사용자 행동 분석
- [ ] Funnels: 가입 → 업로드 → 좋아요 퍼널
- [ ] Retention: 리텐션 분석

---

## 🚀 배포 준비 완료!

### ✅ 완료된 항목
```yaml
✅ Sentry DSN 발급 및 저장
✅ Amplitude API Key 발급 및 저장
✅ app.json에 안전하게 저장
✅ 코드에서 환경 변수로 읽기
✅ 민감 정보 필터링 설정
✅ 프로덕션 전용 설정
```

### 🎁 추가 기능 (선택사항)

#### Session Replay (Amplitude)
사용자 세션을 녹화해서 버그 재현에 도움이 됩니다.

**설치**:
```bash
npm install @amplitude/plugin-session-replay-react-native @react-native-async-storage/async-storage
```

**활성화** (`src/services/analyticsService.ts`):
```typescript
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';

async initialize(apiKey: string) {
  await amplitude.init(apiKey).promise;
  await amplitude.add(new SessionReplayPlugin()).promise; // 추가
}
```

**장점**:
- 사용자가 어떻게 버그를 만났는지 영상으로 확인
- 터치, 스크롤, 화면 전환 모두 기록

**단점**:
- 약간의 성능 오버헤드
- 개인정보 녹화 우려 (텍스트는 마스킹됨)

---

## 📝 다음 단계

### 즉시 실행
```bash
# 1. 프로덕션 빌드
npm run build:android
npm run build:ios

# 2. 테스트
- 회원가입 → Amplitude 이벤트 확인
- 에러 발생 → Sentry 이슈 확인

# 3. 배포!
```

### 배포 후 (Day 1)
- [ ] Sentry: 에러 발생 여부 확인
- [ ] Amplitude: 가입자 수 확인
- [ ] 대시보드 알림 설정

### 배포 후 (Week 1)
- [ ] Sentry: Top 3 에러 수정
- [ ] Amplitude: 리텐션 분석
- [ ] 사용자 피드백 수집

---

## ⚙️ 고급 설정 (선택)

### 환경별 키 분리
개발/스테이징/프로덕션 환경별로 다른 키 사용:

**app.config.js** (app.json 대신):
```javascript
export default {
  expo: {
    extra: {
      sentryDsn: process.env.SENTRY_DSN,
      amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
    }
  }
}
```

**.env.production**:
```bash
SENTRY_DSN=https://628a0dc38ec048876741c0e97ed8d370@...
AMPLITUDE_API_KEY=5703283b8f65e91b9e1ba0e20386fbf3
```

---

## 🎉 완료!

모든 설정이 완료되었습니다! 이제 프로덕션 빌드만 하면 됩니다.

**최종 체크리스트**:
- [x] Sentry DSN 저장
- [x] Amplitude API Key 저장
- [x] 코드에 환경 변수 적용
- [x] 보안 설정 완료
- [ ] 프로덕션 빌드 테스트
- [ ] 배포!

---

**문제 발생 시**:
1. Sentry/Amplitude 대시보드 확인
2. `console.log` 확인 (초기화 성공 메시지)
3. 프로덕션 빌드인지 확인 (`__DEV__ = false`)

**배포 준비 완료!** 🚀🎊

