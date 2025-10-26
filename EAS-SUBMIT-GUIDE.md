# 📤 EAS Submit 가이드 - App Store Connect & Google Play 업로드

## 🎯 EAS Submit이란?

이미 빌드된 앱을 App Store Connect 또는 Google Play Console에 제출하는 명령어입니다.

> **참고**: `eas build`는 기본적으로 자동 업로드하지만, `eas submit`은 수동 제출 또는 기존 빌드 재제출 시 사용합니다.

---

## 📱 iOS Submit

### 1. 최신 빌드 제출
```bash
npx eas submit --platform ios --latest
```

### 2. 특정 빌드 ID로 제출
```bash
npx eas submit --platform ios --id [BUILD_ID]
```

### 3. 로컬 IPA 파일 제출
```bash
npx eas submit --platform ios --path ./artyard.ipa
```

### 4. 대화형 모드로 제출
```bash
npx eas submit --platform ios
```
이 명령어는:
- 제출할 빌드 선택 가능
- Apple ID 입력 요청
- App Store Connect 앱 선택

---

## 🤖 Android Submit

### 1. 최신 빌드 제출
```bash
npx eas submit --platform android --latest
```

### 2. 특정 트랙으로 제출
```bash
npx eas submit --platform android --latest --track internal
```

트랙 옵션:
- `internal` - 내부 테스트 (기본값)
- `alpha` - 알파 테스트
- `beta` - 베타 테스트
- `production` - 프로덕션 (실제 출시)

### 3. 로컬 AAB 파일 제출
```bash
npx eas submit --platform android --path ./artyard.aab
```

---

## 🚀 빌드 & 제출 한 번에

### iOS: 빌드 후 자동 제출
```bash
npx eas build --platform ios --profile production --auto-submit
```

### Android: 빌드 후 자동 제출
```bash
npx eas build --platform android --profile production --auto-submit
```

### 양쪽 모두 빌드 & 제출
```bash
npx eas build --platform all --profile production --auto-submit
```

---

## ⚙️ Submit 설정 (eas.json)

현재 프로젝트의 `eas.json` 설정:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "9T69A85KY2"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### iOS 설정 항목

#### 1. appleId
- **설명**: Apple ID (이메일)
- **확인 방법**: https://appleid.apple.com/ 에서 확인
- **예시**: `"appleId": "developer@artyard.com"`

#### 2. ascAppId
- **설명**: App Store Connect 앱 ID (숫자)
- **확인 방법**:
  1. https://appstoreconnect.apple.com/ 접속
  2. "나의 앱" → "ArtYard" 선택
  3. URL에서 숫자 확인: `...apps/[이 숫자]/appstore`
- **예시**: `"ascAppId": "123456789"`

#### 3. appleTeamId
- **설명**: Apple Developer Team ID
- **이미 설정됨**: `9T69A85KY2`

### Android 설정 항목

#### 1. serviceAccountKeyPath
- **설명**: Google Play 서비스 계정 JSON 파일 경로
- **생성 방법**:
  1. Google Play Console → 설정 → API 액세스
  2. 서비스 계정 생성
  3. JSON 키 다운로드
  4. 프로젝트 루트에 저장

#### 2. track
- **설명**: 제출할 트랙 (테스트 단계)
- **옵션**:
  - `internal` - 내부 테스트 (추천)
  - `alpha` - 알파 테스트
  - `beta` - 베타 테스트
  - `production` - 프로덕션

---

## 📋 사전 준비 체크리스트

### iOS 제출 전

- [ ] Apple Developer Program 등록 완료
- [ ] App Store Connect에 앱 등록 완료
- [ ] Apple ID 확인
- [ ] ASC App ID 확인
- [ ] 빌드가 성공적으로 완료됨

### Android 제출 전

- [ ] Google Play Developer 계정 등록
- [ ] Google Play Console에 앱 등록
- [ ] 서비스 계정 JSON 키 생성 및 저장
- [ ] 빌드가 성공적으로 완료됨

---

## 🔧 문제 해결

### iOS 제출 실패

#### 에러: "Invalid Apple ID or password"
```bash
# 앱별 비밀번호 사용 (2FA 활성화 시)
# 1. https://appleid.apple.com/ 접속
# 2. 보안 → 앱별 암호 → 생성
# 3. 생성된 비밀번호 사용
```

#### 에러: "App Store Connect API key required"
```bash
# API 키로 제출 (더 안전)
npx eas submit --platform ios --apple-api-key-path ./AuthKey.p8 --apple-api-key-id [KEY_ID] --apple-api-key-issuer-id [ISSUER_ID]
```

### Android 제출 실패

#### 에러: "Service account credentials not found"
```bash
# 서비스 계정 키 경로 확인
ls -la google-service-account.json

# 경로가 맞는지 eas.json 확인
```

#### 에러: "Track not found"
```bash
# Google Play Console에서 트랙 생성 필요
# 설정 → 테스트 → 내부 테스트 생성
```

---

## 💡 실전 예제

### 예제 1: iOS TestFlight 제출
```bash
# 1. 최신 프로덕션 빌드 확인
npx eas build:list --platform ios --profile production

# 2. 최신 빌드 제출
npx eas submit --platform ios --latest

# 3. Apple ID 입력 (대화형)
# 4. 앱 선택 (ArtYard)
# 5. 제출 완료 대기 (1-2분)
```

### 예제 2: Android 내부 테스트 제출
```bash
# 1. 최신 프로덕션 빌드 제출
npx eas submit --platform android --latest --track internal

# 2. 서비스 계정 자동 인증
# 3. 제출 완료
```

### 예제 3: 빌드 & 제출 자동화
```bash
# iOS + Android 동시에 빌드하고 제출
npx eas build --platform all --profile production --auto-submit
```

---

## 🎬 전체 워크플로우

### 처음부터 끝까지

```bash
# 1. 코드 변경 후 커밋
git add .
git commit -m "feat: 로그인 문제 해결"
git push

# 2. iOS 빌드 & 제출
npx eas build --platform ios --profile production --auto-submit

# 3. 빌드 완료 대기 (15-20분)
# EAS가 자동으로 App Store Connect에 제출

# 4. App Store Connect에서 확인
# https://appstoreconnect.apple.com/
# TestFlight → 새 빌드 확인

# 5. TestFlight에서 테스트
# iPhone에서 TestFlight 앱 열기
# ArtYard 업데이트 설치
```

---

## 📊 Submit vs Build 비교

| 작업 | 명령어 | 용도 |
|------|--------|------|
| **빌드만** | `eas build` | 앱 컴파일 |
| **제출만** | `eas submit` | 기존 빌드 업로드 |
| **빌드 + 제출** | `eas build --auto-submit` | 한 번에 처리 |

---

## ⚡ 빠른 명령어 참조

```bash
# iOS 최신 빌드 제출
npx eas submit -p ios --latest

# Android 최신 빌드 제출
npx eas submit -p android --latest

# 양쪽 모두 제출
npx eas submit -p all --latest

# 빌드 + 자동 제출 (추천)
npx eas build -p ios --profile production --auto-submit
```

---

## 🎯 현재 프로젝트 설정 업데이트

`eas.json` 파일의 submit 섹션을 다음과 같이 업데이트하세요:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "[당신의 Apple ID]",
        "ascAppId": "[App Store Connect 앱 ID]",
        "appleTeamId": "9T69A85KY2"
      }
    }
  }
}
```

### 필요한 정보:

1. **Apple ID 확인**
   ```
   https://appleid.apple.com/
   ```

2. **ASC App ID 확인**
   ```
   https://appstoreconnect.apple.com/
   → 나의 앱 → ArtYard → URL의 숫자
   ```

---

## 🚨 주의사항

1. **제출 전 테스트 필수**
   - 로컬에서 충분히 테스트
   - 디버그 로그 확인
   - 주요 기능 동작 확인

2. **버전 번호 관리**
   - app.json의 `version` 업데이트
   - `buildNumber` 자동 증가 (`autoIncrement: true`)

3. **검토 시간**
   - TestFlight: 즉시 사용 가능
   - App Store 제출: 1-3일 검토 필요

---

## 🎉 성공 메시지

제출이 성공하면 다음과 같은 메시지가 나타납니다:

```
✔ Successfully submitted build to App Store Connect!
🎊 Your app will be available on TestFlight shortly.
📱 TestFlight URL: https://testflight.apple.com/...
```

---

**이제 빌드가 완료되면 바로 제출해보세요!** 🚀
