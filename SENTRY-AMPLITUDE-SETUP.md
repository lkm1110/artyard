# 🚀 Sentry & Amplitude 설정 가이드

배포 전 마지막 단계! Sentry DSN과 Amplitude API Key만 입력하면 완료됩니다.

---

## ✅ 설치 완료!

```bash
✅ @sentry/react-native
✅ @amplitude/analytics-react-native
```

---

## 📝 1단계: Sentry DSN 발급

### Sentry 계정 생성 (무료)
1. https://sentry.io 접속
2. **Sign Up** (GitHub으로 가입 가능)
3. **Create Project** 클릭
4. Platform: **React Native** 선택
5. Alert frequency: **On every new issue** (기본값)
6. Project name: **artyard**
7. **Create Project** 클릭

### DSN 복사
프로젝트 생성 후 다음 화면에서 DSN을 복사:

```
https://abcd1234@o123456.ingest.sentry.io/7890123
```

**또는**:
- Settings → Projects → artyard → Client Keys (DSN)

---

## 📝 2단계: Amplitude API Key 발급

### Amplitude 계정 생성 (무료)
1. https://amplitude.com 접속
2. **Start Free Trial** (무료 플랜 영구 사용 가능)
3. Organization name: **ArtYard**
4. **Create Organization**

### 프로젝트 생성 & API Key 복사
1. **Create New Project**
2. Project name: **ArtYard Production**
3. Platform: **Mobile**
4. 프로젝트 생성 후 자동으로 API Key 표시

**또는**:
- Settings → Projects → ArtYard Production → API Key

API Key 형식:
```
1a2b3c4d5e6f7g8h9i0j
```

---

## 🔧 3단계: 코드에 키 입력

### A. Sentry DSN 입력
**파일**: `App.tsx` (24번째 줄)

```typescript
Sentry.init({
  dsn: 'https://your-sentry-dsn@sentry.io/project-id', // ⬅️ 여기에 복사한 DSN 붙여넣기
  environment: 'production',
  ...
```

**변경 후**:
```typescript
Sentry.init({
  dsn: 'https://abcd1234@o123456.ingest.sentry.io/7890123',
  environment: 'production',
  ...
```

---

### B. Amplitude API Key 입력
**파일**: `src/services/analyticsService.ts` (26번째 줄)

```typescript
async initialize(apiKey?: string) {
  if (this.initialized || __DEV__) return;

  try {
    const key = apiKey || 'YOUR_AMPLITUDE_API_KEY'; // ⬅️ 여기에 복사한 API Key 붙여넣기
    ...
```

**변경 후**:
```typescript
async initialize(apiKey?: string) {
  if (this.initialized || __DEV__) return;

  try {
    const key = apiKey || '1a2b3c4d5e6f7g8h9i0j';
    ...
```

---

## 🧪 4단계: 테스트

### 프로덕션 빌드로 테스트 (필수!)

**중요**: Sentry와 Amplitude는 **프로덕션에서만** 작동합니다.
개발 모드(`__DEV__ = true`)에서는 콘솔 로깅만 됩니다.

```bash
# 1. 프로덕션 빌드
npm run build:android

# 2. 설치 후 테스트
# - 회원가입 → Amplitude에 "user_signup" 이벤트 전송
# - 에러 발생 → Sentry에 에러 전송

# 3. 확인
# - Sentry Dashboard: Issues 탭에서 에러 확인
# - Amplitude Dashboard: Events 탭에서 이벤트 확인
```

---

## 📊 5단계: 대시보드 확인

### Sentry Dashboard
https://sentry.io/organizations/[your-org]/issues/

**확인 사항**:
- [ ] 에러가 정상적으로 수집되고 있는가?
- [ ] User ID가 제대로 표시되는가?
- [ ] Breadcrumb이 기록되는가?

### Amplitude Dashboard
https://analytics.amplitude.com/[your-org]/

**확인 사항**:
- [ ] `user_signup`, `user_login` 이벤트가 보이는가?
- [ ] `artwork_upload`, `artwork_like` 이벤트가 보이는가?
- [ ] User Properties가 설정되어 있는가?

---

## 🎯 자동으로 전송되는 이벤트

### Sentry (에러만)
- 앱 크래시
- 네트워크 에러
- 권한 거부 에러
- 로그인 실패
- 업로드 실패

### Amplitude (사용자 행동)
- ✅ **회원가입**: `user_signup`
- ✅ **로그인**: `user_login`
- ✅ **작품 업로드**: `artwork_upload`
- ✅ **작품 좋아요**: `artwork_like`
- ✅ **댓글 작성**: `comment_post`
- ✅ **메시지 전송**: `message_send`
- ✅ **챌린지 투표**: `challenge_vote`
- ✅ **검색**: `search_performed`
- ✅ **팔로우**: `user_follow`

더 많은 이벤트는 `src/services/analyticsService.ts` 참고

---

## ⚙️ 선택 사항: 환경별 설정

### 개발/스테이징 환경 분리 (고급)

```typescript
// App.tsx
Sentry.init({
  dsn: __DEV__ 
    ? undefined 
    : 'https://production-dsn@sentry.io/123',
  environment: __DEV__ ? 'development' : 'production',
  ...
```

---

## 🔒 보안 체크리스트

```yaml
□ Sentry DSN이 anon key인가? (service key 아님!)
□ Amplitude API Key가 공개 저장소에 노출되지 않는가?
□ 민감 정보 필터링이 활성화되어 있는가? (이메일 제거)
□ 프로덕션에서만 전송되는가? (__DEV__ 체크)
```

---

## 📈 배포 후 모니터링

### Day 1
- Sentry: 에러 발생 시 알림 확인
- Amplitude: 가입/로그인 이벤트 수 확인

### Week 1
- Sentry: 가장 많이 발생하는 에러 TOP 3 수정
- Amplitude: 사용자 리텐션 분석

### Month 1
- Sentry: 에러율 < 1% 유지
- Amplitude: 사용자 퍼널 분석 (가입 → 업로드 → 좋아요)

---

## 🆘 문제 해결

### Sentry 이벤트가 안 보여요
```yaml
✅ DSN이 올바른가?
✅ 프로덕션 빌드인가? (개발 모드에서는 전송 안 됨)
✅ 인터넷 연결이 되어 있는가?
✅ Sentry 프로젝트가 Active 상태인가?
```

### Amplitude 이벤트가 안 보여요
```yaml
✅ API Key가 올바른가?
✅ analytics.initialize()가 호출되었는가?
✅ 프로덕션 빌드인가?
✅ 이벤트 전송 후 최대 5분 대기 (실시간 아님)
```

---

## 🎉 완료!

설정이 완료되면:

```bash
# 최종 빌드
npm run build:android
npm run build:ios

# 배포!
```

이제 프로덕션에서 모든 에러와 사용자 행동이 자동으로 수집됩니다! 🚀

---

**마지막 체크**:
- [ ] Sentry DSN 입력 완료
- [ ] Amplitude API Key 입력 완료
- [ ] 프로덕션 빌드 테스트 완료
- [ ] 대시보드에서 데이터 확인 완료

**배포 준비 완료!** 🎊

