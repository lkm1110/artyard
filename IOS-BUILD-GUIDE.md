# 🍎 iOS 빌드 & App Store Connect 업로드 가이드

## 📋 사전 준비

### 1. EAS 계정 로그인
```bash
npx eas login
```

### 2. 프로젝트 설정 확인
```bash
npx eas build:configure
```

## 🚀 빌드 명령어

### 옵션 1: TestFlight 빌드 (추천 - 테스트용)
```bash
npx eas build --platform ios --profile production
```

### 옵션 2: 개발용 빌드 (시뮬레이터용)
```bash
npx eas build --platform ios --profile development
```

### 옵션 3: 로컬에서 빌드 (Mac만 가능)
```bash
npx eas build --platform ios --local
```

## 📦 빌드 프로필 설정 (eas.json)

현재 프로젝트의 `eas.json` 파일:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildNumber": "12"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "9T69A85KY2"
      }
    }
  }
}
```

## 🎯 전체 프로세스 (빌드 → 업로드 → TestFlight)

### 1단계: 프로덕션 빌드
```bash
npx eas build --platform ios --profile production
```

이 명령어는:
- ✅ 자동으로 빌드 번호 증가 (`autoIncrement: true`)
- ✅ App Store Connect에 자동 업로드
- ✅ TestFlight에서 자동으로 사용 가능

**예상 소요 시간**: 15-20분

### 2단계: 빌드 상태 확인
```bash
npx eas build:list
```

또는 웹에서 확인:
```
https://expo.dev/accounts/lavlna280/projects/artyard/builds
```

### 3단계: TestFlight에서 확인
1. App Store Connect 접속: https://appstoreconnect.apple.com/
2. "나의 앱" → "ArtYard" 선택
3. "TestFlight" 탭 클릭
4. 새 빌드가 "처리 중" → "테스트 준비 완료"로 변경될 때까지 대기 (5-10분)

## 🎪 TestFlight 테스터 추가

### 내부 테스터 추가 (즉시 테스트 가능)
1. App Store Connect → TestFlight → 내부 테스터
2. "+" 버튼 클릭
3. 이메일 입력
4. 테스터가 이메일 받고 TestFlight 앱에서 설치

### 외부 테스터 추가 (검토 필요)
1. App Store Connect → TestFlight → 외부 테스터
2. 새 그룹 생성
3. 테스터 이메일 추가
4. Apple 검토 제출 (1-2일 소요)

## 🔧 문제 해결

### 빌드 실패 시
```bash
# 캐시 클리어 후 재시도
npx eas build --platform ios --profile production --clear-cache
```

### 인증서 문제 시
```bash
# 인증서 재생성
npx eas credentials
```

### 로컬에서 빌드 로그 확인
```bash
# 빌드 ID 확인
npx eas build:list

# 특정 빌드 로그 보기
npx eas build:view [BUILD_ID]
```

## 📱 빠른 테스트 워크플로우

### 방법 1: 클라우드 빌드 (추천)
```bash
# 1. 빌드 시작
npx eas build --platform ios --profile production

# 2. 빌드 완료 대기 (15-20분)
# EAS가 자동으로 App Store Connect에 업로드

# 3. TestFlight 앱에서 설치 및 테스트
```

### 방법 2: 개발 빌드 (더 빠름, 하지만 제한적)
```bash
# 1. 개발 빌드 생성
npx eas build --platform ios --profile development

# 2. QR 코드 스캔하여 설치
# 또는 URL로 다운로드
```

## 🎬 실전 예제

### TestFlight 배포용 완전한 커맨드
```bash
# 1. 버전 업데이트 (app.json에서)
# "version": "1.0.1" → "1.0.2"

# 2. 변경사항 커밋
git add .
git commit -m "feat: iOS 로그인 문제 해결"
git push

# 3. 프로덕션 빌드
npx eas build --platform ios --profile production

# 4. 빌드 완료 대기 후 TestFlight에서 테스트
```

### 한 줄 명령어 (전체 프로세스)
```bash
npx eas build --platform ios --profile production --auto-submit
```

`--auto-submit` 플래그:
- ✅ 빌드 완료 즉시 App Store Connect에 자동 제출
- ✅ TestFlight에서 바로 사용 가능

## 📊 빌드 번호 관리

현재 빌드 번호: **12** (app.json 참고)

다음 빌드 번호는 자동으로 **13**이 됩니다 (`autoIncrement: true`)

## 🔐 필수 정보

- **Bundle ID**: `com.artyard.app`
- **Team ID**: `9T69A85KY2`
- **Apple ID**: 설정 필요 (eas.json)
- **ASC App ID**: 설정 필요 (App Store Connect에서 확인)

## 💡 유용한 팁

### 1. 빌드 전 체크리스트
- [ ] `app.json`에서 버전 업데이트
- [ ] Git에 모든 변경사항 커밋
- [ ] Supabase 설정 확인 (리디렉션 URL)
- [ ] OAuth 제공자 설정 확인

### 2. 빌드 속도 개선
```bash
# 프로필 지정으로 빌드 속도 향상
npx eas build --platform ios --profile production --no-wait
```

### 3. 여러 플랫폼 동시 빌드
```bash
# iOS와 Android 동시 빌드
npx eas build --platform all --profile production
```

## 🚨 주의사항

1. **프로덕션 빌드는 되돌릴 수 없습니다**
   - 테스트 후 빌드하세요

2. **빌드 크레딧 소비**
   - 무료 계정: 월 30회 빌드
   - 유료 계정: 무제한

3. **Apple 검토 시간**
   - 내부 테스터: 즉시
   - 외부 테스터: 1-2일
   - App Store 제출: 1-3일

## 🎉 성공 시나리오

```bash
$ npx eas build --platform ios --profile production

✔ Build started
⠙ Building iOS app...
  → Build in progress...
  → Uploading artifacts...
  → Uploading to App Store Connect...
✔ Build complete!

🎊 Your build is now available on TestFlight!
📱 Share with testers: https://testflight.apple.com/...
```

---

**다음 단계**: TestFlight에서 로그인 테스트 후 문제가 해결되었는지 확인하세요!

