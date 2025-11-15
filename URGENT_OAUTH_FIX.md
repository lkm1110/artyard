# 🚨 긴급: Google OAuth Dismiss 에러 해결

## 문제 상황
- 구글 2차 인증에서 "예"를 눌러도 `dismiss` 에러 발생
- 에러 메시지: `{"message":"OAUTH_CANCELLED","type":"dismiss"}`

## 근본 원인
**Supabase Redirect URL 설정 누락**

Expo Go는 `exp://172.30.1.63:8085/--/auth-callback` 같은 URL로 redirect되는데,
Supabase에 이 URL이 등록되어 있지 않으면 redirect 실패 → dismiss

---

## ✅ 해결 방법

### 1단계: Supabase Redirect URL 추가

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트: `bkvycanciimgyftdtqpx`

2. **Authentication → URL Configuration**
   
3. **Redirect URLs에 추가** (아래 URL들 모두 추가):
   ```
   exp://172.30.1.63:8085/--/auth-callback
   exp://localhost:8081/--/auth-callback
   exp://192.168.*:*/--/auth-callback
   artyard://auth-callback
   ```

4. **Save** 클릭

---

### 2단계: 앱 재시작

```bash
# Metro 재시작
r
```

---

## 📱 임시 조치 (Supabase 설정 전)

사용자가 취소했을 때 에러 팝업이 안 뜨게:

```typescript
// LoginScreen.tsx에서 이미 수정됨
if (error && error.message === 'OAUTH_CANCELLED') {
  console.log('사용자가 로그인을 취소했습니다');
  return; // 팝업 없이 조용히 종료
}
```

**하지만 현재 로그가 안 나온다** = 앱이 재시작되지 않음!

---

## 🔍 디버깅

### 현재 Redirect URI 확인
```
콘솔에서 다음 로그 확인:
🔗 AuthSession Redirect URI: exp://...
```

이 URL을 복사해서 Supabase Redirect URLs에 추가!

---

## 📋 체크리스트

- [ ] Supabase Redirect URLs에 exp:// 추가
- [ ] 앱 재시작 (Metro reload: `r`)
- [ ] 로그에서 디버그 메시지 확인
- [ ] Google 로그인 재시도
- [ ] OAUTH_CANCELLED 팝업 안 뜨는지 확인

---

## 🎯 예상 결과

**Supabase 설정 후**:
- "예"를 누르면 → 로그인 성공 ✅
- "아니요"를 누르면 → 조용히 취소 (팝업 없음) ✅

