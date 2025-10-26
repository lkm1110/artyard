# ⚡ iOS 로그인 문제 빠른 해결 가이드

## 🎯 문제
- iOS에서 로그인하면 localhost로 이동
- 앱으로 돌아오지 않음
- "safari opened complete google login..." 메시지만 나옴

## ✅ 해결책 (5분 소요)

### STEP 1: Supabase 설정 (필수!)

1. 브라우저에서 열기:
   ```
   https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/auth/url-configuration
   ```

2. 페이지 하단 "Redirect URLs" 섹션으로 스크롤

3. 다음 2개 URL 추가:
   ```
   artyard://auth-callback
   artyard://**
   ```

4. ⚠️ **"Save" 버튼 클릭** (매우 중요!)

### STEP 2: 앱 재시작

Windows PowerShell에서 실행:
```powershell
.\restart-app.ps1
```

또는 직접 실행:
```bash
npx expo start --clear
```

### STEP 3: 테스트

1. iOS 기기/시뮬레이터에서 앱 열기
2. 로그인 버튼 클릭 (Google, Apple, Facebook, Kakao 아무거나)
3. Safari에서 로그인 완료
4. **자동으로 ArtYard 앱으로 돌아와야 함!**
5. 1-2초 후 로그인 완료

## 🔍 여전히 안되면?

### 체크리스트
- [ ] Supabase에서 "Save" 버튼을 눌렀나요?
- [ ] 앱을 완전히 종료하고 재시작했나요?
- [ ] iOS 기기에서 테스트하고 있나요? (Android는 아직 안됨)

### Deep Link 테스트

터미널에서 다음 명령어로 deep link가 작동하는지 확인:

```bash
# iOS 시뮬레이터
xcrun simctl openurl booted "artyard://auth-callback?test=true"
```

앱이 포그라운드로 나타나면 deep link가 정상 작동하는 것입니다.

### 로그 확인

앱 실행 중 콘솔에서 다음 메시지를 찾아보세요:

```
✅ "Deep Link URL:" - deep link가 수신됨
✅ "로그인 성공!" - 세션이 확인됨
❌ "로그인 실패" - Supabase 설정 재확인 필요
```

## 📞 추가 도움말

자세한 내용은 `FIX-IOS-LOGIN-REDIRECT.md` 파일을 참조하세요.

## 🎉 성공 시나리오

```
1. 로그인 버튼 클릭
2. Safari 열림 (Google/Apple/Facebook/Kakao 로그인 페이지)
3. 로그인 완료
4. ✨ ArtYard 앱으로 자동 전환 ✨
5. "🎉 Login Successful!" 알림 표시
6. 홈 화면으로 이동
```

---

**예상 소요 시간:** 
- Supabase 설정: 2분
- 앱 재시작: 1분
- 테스트: 2분
- **총 5분** ✅

