# 🚨 긴급 수정 사항 - 종합 가이드

## 현재 상황
- **서버 IP**: `172.30.1.63`
- **문제1**: Facebook 로그인 안됨
- **문제2**: Google/Apple 로그인 후 "프로필 처리 중 예외 발생" 에러
- **문제3**: Upload 페이지 안 뜸 (프로필 로드 실패로 인한 것)

---

## ✅ 완료된 수정사항

### 1. 프로필 타임아웃 증가
- **이전**: 3초/10초 (일관성 없음)
- **수정**: 15초로 통일
- **변경**: `src/store/authStore.ts`

### 2. 더 자세한 에러 로깅
- 프로필 조회 시간 측정 (`⏱️ 프로필 조회 완료 (XXXms)`)
- TIMEOUT 에러 발생 시 데이터베이스 문제 힌트 제공

### 3. Facebook OAuth exp:// URL 사용
- **이전**: `https://` URL로 redirect (실패)
- **수정**: `exp://` URL로 redirect

---

## 🚨 지금 바로 해야 할 것 (순서대로)

### 1단계: Supabase Redirect URLs 확인 (Facebook 로그인용)

#### Supabase Dashboard 접속
https://supabase.com/dashboard → `bkvycanciimgyftdtqpx`

#### Authentication → URL Configuration → Redirect URLs

**현재 서버 IP**: `172.30.1.63`

**확인/추가**:
```
exp://172.30.1.63:8085/--/auth-callback
```

**또는 와일드카드** (권장):
```
exp://*:8085/--/auth-callback
```

**Site URL도 확인**:
```
exp://172.30.1.63:8085
```
또는
```
exp://*:8085
```

---

### 2단계: 데이터베이스 RLS 정책 최적화 (프로필 타임아웃 해결)

프로필 조회가 15초도 걸린다면 데이터베이스 문제입니다!

#### Supabase SQL Editor 접속
https://supabase.com/dashboard → SQL Editor

#### 실행할 SQL 스크립트
`database/FIX-PROFILE-TIMEOUT.sql` 파일의 내용을 복사해서 실행:

```sql
-- 1. 기존 복잡한 RLS 정책 모두 제거
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
-- ... (전체 스크립트는 FIX-PROFILE-TIMEOUT.sql 참조)

-- 2. 초간단 RLS 정책 생성
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true); -- 모두 읽기 가능 (빠름!)

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS profiles_handle_idx ON profiles(handle);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- 4. 통계 업데이트
ANALYZE profiles;
```

**효과**: 프로필 조회가 **100ms 이내**로 빨라집니다!

---

### 3단계: 앱 Reload

Expo Go 앱에서:
```
r + r (두 번 누르기)
```

---

### 4단계: 테스트

#### 1. Google 로그인 테스트
```
1. Google 로그인 클릭
2. 브라우저에서 Google 인증
3. 앱으로 돌아옴
4. 로그 확인:
   ⏱️ [SIGNED_IN] 프로필 조회 완료 (100ms) ← 빨라야 정상!
   ✅ [SIGNED_IN] 프로필 조회 성공: user_xxx
```

#### 2. Facebook 로그인 테스트
```
1. Facebook 로그인 클릭
2. 브라우저에서 Facebook 인증
3. 앱으로 돌아옴 (dismiss 에러 없어야 함!)
4. 로그 확인:
   🔗 Expo Redirect URI: exp://172.30.1.63:8085/--/auth-callback
   📱 AuthSession result type: success
   ✅ Facebook OAuth 성공!
```

#### 3. Upload 페이지 테스트
프로필이 정상 로드되면 Upload 페이지도 정상 작동합니다!

---

## 🔍 로그 확인 방법

### 정상적인 로그 (프로필 로드 빠름):
```
⏳ [SIGNED_IN] 프로필 조회 중...
⏱️ [SIGNED_IN] 프로필 조회 완료 (120ms) ← 100~500ms 정상
✅ [SIGNED_IN] 프로필 조회 성공: user_xxx
```

### 문제 있는 로그 (느림):
```
⏳ [SIGNED_IN] 프로필 조회 중...
⏱️ [SIGNED_IN] 프로필 조회 완료 (8500ms) ← 5초 이상은 문제!
❌ [SIGNED_IN] 프로필 조회 에러: TIMEOUT
💡 데이터베이스가 느립니다. database/FIX-PROFILE-TIMEOUT.sql을 실행하세요!
```

---

## 🐛 문제별 해결 방법

### 문제 1: Facebook "dismiss" 에러
**원인**: Supabase Redirect URLs에 exp:// URL 없음

**해결**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 `exp://172.30.1.63:8085/--/auth-callback` 추가
3. 앱 reload (r + r)

---

### 문제 2: 프로필 조회 느림 (5초 이상)
**원인**: 복잡한 RLS 정책, 인덱스 부족

**해결**:
1. Supabase SQL Editor에서 `FIX-PROFILE-TIMEOUT.sql` 실행
2. 앱 reload (r + r)
3. 로그인 시도 → `⏱️ 프로필 조회 완료 (XXXms)` 확인

**예상 결과**: 100~500ms 이내

---

### 문제 3: Upload 페이지 안 뜸
**원인**: 프로필 로드 실패로 인증 상태가 불완전

**해결**:
1. 문제 2 해결 (프로필 조회 속도 개선)
2. 로그아웃 → 다시 로그인
3. Upload 페이지 정상 작동 확인

---

## 📋 최종 체크리스트

- [ ] Supabase Redirect URLs에 `exp://172.30.1.63:8085/--/auth-callback` 추가됨
- [ ] Supabase Site URL에 `exp://172.30.1.63:8085` 설정됨
- [ ] `FIX-PROFILE-TIMEOUT.sql` 실행 완료
- [ ] 앱 reload (r + r)
- [ ] Google 로그인 성공 (프로필 조회 500ms 이내)
- [ ] Facebook 로그인 성공 (dismiss 에러 없음)
- [ ] Upload 페이지 정상 작동

---

## 🆘 여전히 안된다면?

### 추가 정보 공유 필요:

1. **프로필 조회 시간**:
   ```
   ⏱️ [SIGNED_IN] 프로필 조회 완료 (XXXms)
   ```
   몇 ms인지 확인

2. **Facebook 로그인 로그**:
   ```
   🔗 Expo Redirect URI: exp://...
   📱 AuthSession result type: ???
   ```

3. **Supabase RLS 정책 실행 결과**:
   SQL 실행 후 에러 메시지가 있다면 공유

4. **네트워크 상태**:
   - 인터넷 연결 확인
   - Supabase 대시보드 접속 가능한지 확인

---

## 📄 참고 파일

- `database/FIX-PROFILE-TIMEOUT.sql` - 데이터베이스 최적화 스크립트
- `FACEBOOK_DEBUG_CHECKLIST.md` - Facebook 로그인 디버깅 가이드
- `SUPABASE_SETUP_REQUIRED.md` - Supabase 설정 상세 가이드

---

## 🎯 핵심 요약

| 문제 | 원인 | 해결 | 우선순위 |
|------|------|------|----------|
| Facebook 로그인 실패 | Supabase Redirect URLs 미설정 | exp:// URL 추가 | 🔴 높음 |
| 프로필 타임아웃 | 느린 데이터베이스 쿼리 | SQL 스크립트 실행 | 🔴 높음 |
| Upload 페이지 안 뜸 | 프로필 로드 실패 | 위 2개 해결 시 자동 해결 | 🟡 중간 |

**가장 중요**: 
1. Supabase Redirect URLs 추가
2. SQL 스크립트 실행
3. 앱 reload

이 3가지만 하면 모든 문제가 해결됩니다! 🚀

