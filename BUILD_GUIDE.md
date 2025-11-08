# 🚀 ArtYard Android 빌드 가이드

Google Play Store에 업로드할 Android App Bundle을 빌드하는 방법입니다.

---

## ⚡ **빠른 시작 (3단계)**

### **STEP 1: 터미널 열기**
```bash
# 프로젝트 루트 폴더에서 터미널 열기
# (현재 위치: C:\project\canvaspop)
```

### **STEP 2: 빌드 명령 실행**
```bash
eas build --platform android --profile production
```

### **STEP 3: 대기**
```
✓ 빌드 시작 (5-15분 소요)
✓ 완료 후 .aab 파일 다운로드
✓ Google Play Console에 업로드!
```

---

## 📋 **상세 가이드**

---

## 1️⃣ **사전 준비 확인**

### ✅ **필요한 것들:**

```bash
# 1. Node.js 설치 확인
node --version
# 출력: v18.x 이상

# 2. EAS CLI 설치 확인
eas --version
# 출력: eas-cli/x.x.x

# 만약 설치 안 되어 있다면:
npm install -g eas-cli
```

### ✅ **EAS 로그인 확인:**

```bash
# 로그인 상태 확인
eas whoami

# 만약 로그인 안 되어 있다면:
eas login
# → Expo 계정으로 로그인 (lavlna280)
```

---

## 2️⃣ **빌드 실행**

### **명령어:**

```bash
eas build --platform android --profile production
```

### **실행 화면:**

```
✔ Linked to project @lavlna280/artyard
✔ Using remote Android credentials
✔ Using Expo SDK 52.0.0
✔ Checking project configuration
✔ Android package: com.artyard.app
✔ App version: 1.0.0

? Build for: Android (AAB)
? Profile: production

Building...
```

### **대기 시간:**
- ⏱️ **일반적으로**: 5-15분
- 🏃 **빠를 때**: 3-5분
- 🐢 **느릴 때**: 15-20분 (서버 혼잡 시)

---

## 3️⃣ **빌드 진행 상황 확인**

### **웹에서 확인 (추천!):**

```
https://expo.dev/accounts/lavlna280/projects/artyard/builds
```

여기서 실시간으로 빌드 상태를 볼 수 있어요!

### **터미널에서 확인:**

```bash
eas build:list --platform android --profile production --limit 5
```

---

## 4️⃣ **빌드 완료 후**

### ✅ **성공 메시지:**

```
✔ Build finished successfully!

Build details:
• Build ID: abc123def-456-789
• Build URL: https://expo.dev/accounts/.../builds/abc123
• Download URL: https://expo.dev/artifacts/eas/...

Download your build:
$ eas build:download --id abc123def-456-789
```

### **다운로드 방법 2가지:**

#### **방법 A: 자동 다운로드 (터미널)**
```bash
eas build:download --id <BUILD_ID> --output ./artyard-release.aab
```

#### **방법 B: 웹에서 다운로드**
```
1. 빌드 페이지 접속:
   https://expo.dev/accounts/lavlna280/projects/artyard/builds

2. 최신 빌드 클릭

3. "Download" 버튼 클릭

4. artyard-xxx.aab 파일 다운로드
```

---

## 5️⃣ **Google Play Console 업로드**

### **STEP 1: Play Console 접속**
```
https://play.google.com/console
```

### **STEP 2: 앱 선택**
```
ArtYard 앱 선택
```

### **STEP 3: 프로덕션 트랙**
```
왼쪽 메뉴 → "출시" → "프로덕션"
→ "새 버전 만들기"
```

### **STEP 4: App Bundle 업로드**
```
"App Bundle" 섹션
→ "업로드" 클릭
→ artyard-xxx.aab 파일 선택
→ 업로드 완료 대기
```

### **STEP 5: 변경사항 입력**
```
"이번 출시의 새로운 기능" 섹션
→ 업데이트 내용 입력 (예: "Initial release")
→ "검토" 버튼 클릭
```

### **STEP 6: 출시!**
```
"출시 시작" 또는 "프로덕션으로 출시" 클릭
→ 확인
→ 🎉 완료!
```

---

## 🔧 **빌드 설정 정보**

### **현재 설정 (eas.json):**

```json
{
  "build": {
    "production": {
      "autoIncrement": true,  // 자동 버전 증가
      "android": {
        "buildType": "app-bundle",  // AAB 형식
        "image": "latest",
        "enableProguardInReleaseBuilds": true  // 코드 난독화
      }
    }
  }
}
```

### **앱 정보 (app.json):**

```json
{
  "version": "1.0.0",
  "android": {
    "package": "com.artyard.app",
    "versionCode": 자동 증가
  }
}
```

---

## ❓ **문제 해결**

### **문제 1: EAS CLI가 설치 안 됨**

```bash
# 해결 방법:
npm install -g eas-cli

# 또는 권한 문제 시:
npx eas-cli build --platform android --profile production
```

### **문제 2: 로그인 안 됨**

```bash
# 해결 방법:
eas login

# Expo 계정 정보 입력:
# Username: lavlna280
# Password: [your password]
```

### **문제 3: "Project not found"**

```bash
# 해결 방법:
eas init --id 273782f5-efd0-4ebc-be22-667922222f8d

# 또는 app.json 확인:
# "extra.eas.projectId"가 있는지 확인
```

### **문제 4: 빌드가 실패함**

```bash
# 로그 확인:
eas build:view <BUILD_ID>

# 또는 웹에서 확인:
https://expo.dev/accounts/lavlna280/projects/artyard/builds

# 일반적인 원인:
# - credentials 문제 → eas credentials 명령으로 재설정
# - 의존성 문제 → package.json 확인
# - 네트워크 문제 → 재시도
```

### **문제 5: 빌드가 너무 느림**

```bash
# 정상입니다! 첫 빌드는 20-30분 걸릴 수 있어요.
# 다음 빌드부터는 캐시를 사용해서 빠릅니다 (5-10분)

# 빌드 우선순위 높이기 (유료):
eas build --platform android --profile production --priority high
```

---

## 🎯 **빌드 체크리스트**

빌드 전에 확인하세요:

- [ ] `.env` 파일에 환경변수가 올바르게 설정됨
- [ ] `app.json`의 버전 정보 확인 (1.0.0)
- [ ] `eas.json`의 production 프로필 확인
- [ ] Expo 계정 로그인됨 (`eas whoami`)
- [ ] 인터넷 연결 안정적

빌드 후:

- [ ] 빌드 성공 확인
- [ ] .aab 파일 다운로드
- [ ] 로컬에서 테스트 (선택사항)
- [ ] Google Play Console 업로드
- [ ] 출시 전 최종 검토

---

## 📱 **로컬 테스트 (선택사항)**

### **실제 기기에 설치:**

```bash
# 1. AAB를 APK로 변환 (bundletool 사용)
bundletool build-apks --bundle=artyard.aab --output=artyard.apks

# 2. APK 설치
bundletool install-apks --apks=artyard.apks

# 또는 간단하게 (Preview 빌드 사용):
eas build --platform android --profile preview
# → APK 직접 생성 → 기기에 설치
```

---

## 🚀 **자동화 (고급)**

### **빌드 & 제출을 한 번에:**

```bash
# Google Play Console에 자동 업로드
eas build --platform android --profile production --auto-submit
```

**사전 설정 필요:**
1. Google Cloud Service Account 생성
2. Play Console API 활성화
3. `eas.json`에 submit 설정 추가

자세한 내용은 `docs/GOOGLE_PLAY_MAPPING_FILE_GUIDE.md` 참고!

---

## 📊 **빌드 히스토리 확인**

### **최근 빌드 목록:**

```bash
eas build:list --platform android --limit 10
```

### **특정 빌드 상세 정보:**

```bash
eas build:view <BUILD_ID>
```

### **빌드 취소 (진행 중인 경우):**

```bash
eas build:cancel <BUILD_ID>
```

---

## 💡 **팁 & 트릭**

### **빌드 속도 높이기:**
```bash
# 1. 로컬 credentials 캐시 사용
# 2. 불필요한 assets 제거
# 3. 변경사항이 적을 때 빌드
# 4. EAS 유료 플랜 사용 (빌드 우선순위)
```

### **비용 절약:**
```bash
# 무료 플랜: 월 30빌드
# 프로 플랜: 무제한 빌드

# 불필요한 빌드 줄이기:
# - 로컬에서 충분히 테스트 후 빌드
# - Preview 빌드로 먼저 테스트
# - Production 빌드는 최종 확정 후에만
```

### **빌드 알림 받기:**
```bash
# Expo 앱 설치 (모바일)
# → 빌드 완료 시 푸시 알림 받음
```

---

## 🎉 **완료!**

이제 빌드가 준비되었습니다!

**다음 단계:**
1. ✅ 터미널에서 `eas build --platform android --profile production` 실행
2. ✅ 5-15분 대기
3. ✅ .aab 파일 다운로드
4. ✅ Google Play Console 업로드
5. ✅ 출시! 🚀

---

**궁금한 점이 있으면 언제든 물어보세요!** 😊

