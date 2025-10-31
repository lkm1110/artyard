# Facebook 로그인 디버깅 체크리스트

## ✅ 이미 완료된 항목
- [x] Supabase Redirect URLs에 `exp://*:8085/--/auth-callback` 추가
- [x] Facebook OAuth Redirect URI에 `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback` 추가
- [x] 코드 수정 완료 (exp:// URL 사용)

---

## 🔍 추가 확인 필요 사항

### 1. ⚠️ 앱 Reload 했나요?
**중요**: 코드를 수정했으니 반드시 reload 필요!

Expo Go 앱에서:
```
r + r (두 번 누르기)
```

---

### 2. Facebook 앱 모드 확인

Facebook Developer Console에서 확인:

#### 앱 대시보드 → 설정 → 기본 설정

**앱 모드**를 확인하세요:

- **개발 모드** (Development)
  - 테스터로 등록된 계정만 로그인 가능
  - 로그인하려는 Facebook 계정이 테스터로 추가되어 있는지 확인 필요
  
- **라이브 모드** (Live)
  - 모든 사용자 로그인 가능
  - 앱 검수 완료 필요

#### 테스터 추가 방법 (개발 모드인 경우)
1. Facebook Developer Console → 역할(Roles) → 테스터(Testers)
2. "테스터 추가" 버튼 클릭
3. 로그인하려는 Facebook 계정의 이메일 또는 이름 입력
4. 해당 계정에서 테스터 초대 수락

---

### 3. Supabase Site URL 확인

Supabase Dashboard → Authentication → URL Configuration

**Site URL**이 설정되어 있는지 확인:
```
exp://*:8085
```
또는
```
exp://172.30.1.54:8085
```

> 📝 **참고**: Site URL이 비어있거나 잘못되면 redirect가 실패할 수 있습니다.

---

### 4. 새로운 로그 확인

앱을 reload 한 후 Facebook 로그인을 다시 시도하고 로그를 확인하세요:

#### 예상 로그 (정상):
```
LOG  📱 Using Expo AuthSession for Facebook OAuth...
LOG  🔗 Expo Redirect URI: exp://172.30.1.54:8085/--/auth-callback
LOG  🌐 Facebook OAuth URL: https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/authorize?provider=facebook&redirect_to=exp%3A%2F%2F172.30.1.54%3A8085%2F--...
LOG  ⏳ Opening browser with AuthSession...
LOG  📱 AuthSession result type: success
LOG  ✅ Facebook OAuth 성공!
```

#### 주의할 점:
- `redirect_to=exp%3A%2F%2F...` (exp:// URL로 인코딩되어야 함)
- **이전**: `redirect_to=https%3A%2F%2Fbkvycanciimgyftdtqpx...` ❌
- **수정 후**: `redirect_to=exp%3A%2F%2F172.30.1.54...` ✅

---

### 5. Facebook 앱 검수 상태 확인

#### 앱 검수(App Review) 상태

Facebook Developer Console → 앱 검수

- **필요한 권한**: `email`, `public_profile`
- **상태**: 승인됨 (Approved)

> 📝 **참고**: 기본 권한(`email`, `public_profile`)은 검수 없이 사용 가능하지만, 앱이 라이브 모드이고 추가 권한이 필요하면 검수가 필요합니다.

---

### 6. Facebook 로그인 설정 확인

Facebook Developer Console → Facebook 로그인 → 설정

#### 필수 설정:
- [x] **클라이언트 OAuth 로그인**: 예
- [x] **웹 OAuth 로그인**: 예
- [x] **유효한 OAuth 리디렉션 URI**: `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback`

---

## 🧪 디버깅 단계

### 1단계: 앱 Reload
```
Expo Go에서 r + r
```

### 2단계: Facebook 로그인 시도

### 3단계: 로그 확인
- `redirect_to=exp://...` 인지 확인
- `AuthSession result type` 확인

### 4단계: 여전히 "dismiss" 에러가 나온다면

**콘솔 로그를 공유해주세요**:
- 📱 Expo Redirect URI
- 🌐 Facebook OAuth URL (특히 `redirect_to` 파라미터)
- 📱 AuthSession result

---

## 🐛 흔한 문제들

### 문제 1: "dismiss" 에러
**원인**: 
- 앱을 reload하지 않음 (이전 코드 실행 중)
- Facebook 앱이 개발 모드이고 테스터로 등록 안됨

**해결**:
- 앱 reload (r + r)
- Facebook 테스터 추가

### 문제 2: "Invalid OAuth redirect URI"
**원인**: Facebook Developer Console 설정 문제

**해결**:
- `https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback` 확인

### 문제 3: 로그인 후 "권한 없음" 에러
**원인**: Facebook 앱이 개발 모드이고 테스터 아님

**해결**:
- 역할 → 테스터 추가

---

## 📋 최종 체크리스트

- [ ] 앱을 reload 했나요? (r + r)
- [ ] Facebook 앱 모드가 "개발" 모드인가요?
  - 예 → 테스터로 추가되어 있나요?
- [ ] Supabase Site URL이 설정되어 있나요?
- [ ] 새로운 로그에서 `redirect_to=exp://...`가 보이나요?
- [ ] Facebook Developer Console에서 OAuth Redirect URI가 설정되어 있나요?

---

## 🆘 그래도 안된다면?

다음 정보를 공유해주세요:

1. **앱 reload 후 새로운 콘솔 로그** (특히 Facebook 관련)
2. **Facebook 앱 모드** (개발 or 라이브)
3. **Supabase Site URL** 스크린샷
4. **Facebook Developer Console → Facebook 로그인 → 설정** 스크린샷

이 정보가 있으면 정확한 문제를 찾을 수 있습니다! 🔍

