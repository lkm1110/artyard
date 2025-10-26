# ⚡ 빠른 명령어 참조

## 🎯 가장 많이 사용하는 명령어

### 개발 중
```bash
# 개발 서버 시작
npx expo start --clear

# iOS 시뮬레이터에서 실행
npx expo start --ios

# Android 에뮬레이터에서 실행
npx expo start --android
```

### 빌드
```bash
# iOS 프로덕션 빌드
npx eas build --platform ios --profile production

# Android 프로덕션 빌드
npx eas build --platform android --profile production

# 양쪽 모두 빌드
npx eas build --platform all --profile production
```

### 제출 (Submit)
```bash
# iOS 최신 빌드 제출
npx eas submit --platform ios --latest

# Android 최신 빌드 제출
npx eas submit --platform android --latest

# 빌드 + 자동 제출 (한 번에!)
npx eas build --platform ios --profile production --auto-submit
```

### 빌드 확인
```bash
# 빌드 목록 보기
npx eas build:list

# 특정 빌드 상세 보기
npx eas build:view [BUILD_ID]

# 내 계정 확인
npx eas whoami
```

---

## 🍎 iOS 전용

### TestFlight 배포
```bash
# 빌드 → TestFlight 자동 업로드
npx eas build -p ios --profile production --auto-submit
```

### 시뮬레이터 빌드
```bash
# 시뮬레이터용 빌드
npx eas build -p ios --profile development
```

---

## 🤖 Android 전용

### 내부 테스트 배포
```bash
# 빌드 → 내부 테스트 트랙 업로드
npx eas build -p android --profile production --auto-submit
```

### APK vs AAB
```bash
# AAB (App Bundle - Google Play용)
npx eas build -p android --profile production

# APK (직접 설치용)
npx eas build -p android --profile production-apk
```

---

## 🔐 인증 관련

```bash
# EAS 로그인
npx eas login

# 로그아웃
npx eas logout

# 현재 로그인 계정 확인
npx eas whoami
```

---

## 🛠️ 설정 & 관리

```bash
# 프로젝트 초기 설정
npx eas build:configure

# 인증서 관리
npx eas credentials

# 디바이스 등록 (iOS)
npx eas device:create
```

---

## 📦 업데이트 (OTA)

```bash
# 앱 업데이트 배포 (OTA)
npx eas update --branch production --message "버그 수정"

# 업데이트 목록 보기
npx eas update:list
```

---

## 🔍 디버깅

```bash
# 빌드 로그 보기
npx eas build:view [BUILD_ID]

# 빌드 취소
npx eas build:cancel

# 캐시 클리어하고 빌드
npx eas build -p ios --clear-cache
```

---

## 📱 현재 프로젝트 (ArtYard) 전용

### iOS TestFlight 배포 (전체 프로세스)
```bash
# 1. 개발 테스트
npx expo start --clear

# 2. 빌드 & TestFlight 업로드
npx eas build -p ios --profile production --auto-submit

# 3. 빌드 상태 확인
npx eas build:list
```

### 개발 중 디버깅
```bash
# 로그 보면서 개발
npx expo start --clear

# 앱에서 "🐛 디버그" 버튼 클릭하여 로그 확인
```

---

## 🎯 시나리오별 명령어

### 시나리오 1: 처음 배포
```bash
npx eas login
npx eas build:configure
npx eas build -p ios --profile production --auto-submit
```

### 시나리오 2: 업데이트 배포
```bash
git add .
git commit -m "feat: 새 기능 추가"
git push
npx eas build -p ios --profile production --auto-submit
```

### 시나리오 3: 긴급 버그 수정
```bash
# OTA 업데이트 (앱 재빌드 없이)
npx eas update --branch production --message "긴급 버그 수정"
```

### 시나리오 4: 테스트
```bash
# 로컬 테스트
npx expo start --clear

# TestFlight 테스트
npx eas build -p ios --profile production --auto-submit
```

---

## 📝 자주 사용하는 플래그

| 플래그 | 설명 |
|--------|------|
| `-p` | `--platform`의 축약형 |
| `--latest` | 최신 빌드 선택 |
| `--auto-submit` | 빌드 후 자동 제출 |
| `--clear-cache` | 캐시 클리어 |
| `--local` | 로컬에서 빌드 |
| `--no-wait` | 빌드 완료 대기 안 함 |

---

## 💾 스크립트로 저장하기

### package.json에 추가
```json
{
  "scripts": {
    "start": "npx expo start --clear",
    "build:ios": "npx eas build --platform ios --profile production",
    "build:android": "npx eas build --platform android --profile production",
    "submit:ios": "npx eas submit --platform ios --latest",
    "deploy:ios": "npx eas build -p ios --profile production --auto-submit",
    "deploy:all": "npx eas build -p all --profile production --auto-submit"
  }
}
```

그 후:
```bash
npm run start
npm run deploy:ios
```

---

## 🚀 원클릭 명령어 (저장해두세요!)

```bash
# iOS TestFlight 배포 (한 줄로!)
npx eas build -p ios --profile production --auto-submit && echo "✅ 빌드 시작! 15-20분 후 TestFlight에서 확인하세요"

# 양쪽 모두 배포
npx eas build -p all --profile production --auto-submit
```

---

**이 파일을 북마크해두고 필요할 때마다 참조하세요!** 📌

