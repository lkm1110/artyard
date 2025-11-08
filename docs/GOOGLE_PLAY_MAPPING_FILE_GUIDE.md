# 🔧 Google Play Console 매핑 파일 업로드 가이드

Google Play Store에서 "가독화 파일이 없습니다" 경고를 해결하는 방법입니다.

---

## 🤔 **이 경고가 뜨는 이유**

### **간단 설명:**
- Android 앱을 배포할 때 **코드 난독화**(ProGuard/R8)로 앱 크기를 줄입니다
- 난독화하면 함수명이 `a()`, `b()` 같은 짧은 이름으로 바뀝니다
- **매핑 파일**이 있어야 크래시 발생 시 원래 함수명을 알 수 있습니다

### **매핑 파일이 없으면?**
```
❌ 크래시 리포트: "함수 a에서 오류 발생"
   → 어떤 함수인지 모름, 디버깅 불가능

✅ 매핑 파일 있음: "함수 getUserProfile에서 오류 발생"
   → 정확한 위치 파악, 빠른 수정 가능
```

---

## ⚠️ **중요: 이것은 경고일 뿐입니다**

✅ **앱 출시는 가능합니다!**
- 매핑 파일 없이도 앱을 Play Store에 올릴 수 있어요
- 단, 나중에 크래시 분석이 어려울 수 있습니다

❌ **출시 차단이 아닙니다**
- 에러(Error)가 아닌 경고(Warning)입니다
- 무시하고 진행해도 됩니다

🎯 **하지만 업로드를 권장합니다**
- 사용자가 크래시를 경험했을 때
- 정확한 원인을 찾아 빠르게 수정할 수 있습니다

---

## 🚀 **해결 방법 (3가지 옵션)**

---

### **옵션 1: 경고 무시하고 출시** (가장 빠름)

**언제 사용:**
- 빨리 출시해야 하는 경우
- MVP/베타 테스트 단계
- 크래시가 거의 없을 것으로 예상되는 경우

**방법:**
```
Google Play Console에서
→ "확인" 또는 "건너뛰기" 클릭
→ 출시 진행
```

**장점:**
- ✅ 즉시 출시 가능
- ✅ 추가 작업 없음

**단점:**
- ⚠️ 크래시 분석 어려움
- ⚠️ 나중에 매핑 파일 업로드 번거로움

---

### **옵션 2: EAS Build에서 매핑 파일 다운로드 후 업로드** (권장!) ⭐

**언제 사용:**
- EAS Build로 빌드한 경우
- 프로덕션 앱
- 크래시 분석이 중요한 경우

#### **STEP 1: EAS Build 확인**

```bash
# 최신 빌드 확인
eas build:list --platform android --profile production --limit 1

# 빌드 ID 확인 (예: a1b2c3d4-e5f6-...)
```

#### **STEP 2: 매핑 파일 다운로드**

**방법 A: EAS CLI 사용**
```bash
# EAS Build에서 자동으로 생성된 매핑 파일 다운로드
eas build:view <BUILD_ID>

# 또는 웹에서 다운로드
# https://expo.dev/accounts/[ACCOUNT]/projects/artyard/builds/[BUILD_ID]
```

**방법 B: 수동으로 찾기**
```bash
# 빌드 아티팩트에 포함된 매핑 파일
# 위치: android/app/build/outputs/mapping/release/mapping.txt
```

EAS Build를 사용하면 이 파일이 자동으로 생성됩니다!

#### **STEP 3: Google Play Console에 업로드**

1. **Google Play Console 접속**
   ```
   https://play.google.com/console
   ```

2. **앱 선택**
   ```
   왼쪽 메뉴 → 앱 선택 (ArtYard)
   ```

3. **출시 관리로 이동**
   ```
   왼쪽 메뉴 → "출시" 섹션
   → "프로덕션" (또는 "내부 테스트", "비공개 테스트")
   ```

4. **해당 버전 찾기**
   ```
   업로드한 App Bundle 버전 찾기
   → "세부정보 보기" 클릭
   ```

5. **매핑 파일 업로드**
   ```
   "App Bundle 탐색기" 섹션
   → "ProGuard 매핑" 또는 "가독화 파일"
   → "파일 업로드" 클릭
   → mapping.txt 선택
   ```

#### **STEP 4: 확인**
```
✅ 업로드 완료 후 "매핑 파일이 업로드됨" 메시지 확인
✅ 경고 사라짐
```

---

### **옵션 3: 다음 빌드부터 자동 업로드 설정** (장기적 해결책)

#### **이미 적용됨!** ✅

`eas.json` 파일에 다음 설정이 추가되었습니다:

```json
"production": {
  "android": {
    "buildType": "app-bundle",
    "enableProguardInReleaseBuilds": true  // ← 추가됨!
  }
}
```

#### **다음 빌드 시:**

```bash
# 새로운 프로덕션 빌드 생성
eas build --platform android --profile production

# EAS가 자동으로:
# 1. ProGuard 활성화
# 2. 매핑 파일 생성
# 3. 빌드 아티팩트에 포함
```

#### **자동 업로드 설정 (더 편리하게!)**

`eas.json`에 Google Play 자동 제출 설정을 추가하면
매핑 파일도 자동으로 업로드됩니다!

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "production"
    }
  }
}
```

**설정 방법:**

1. **Google Cloud Console에서 서비스 계정 생성**
   ```
   https://console.cloud.google.com
   → IAM 및 관리자 → 서비스 계정
   → 서비스 계정 만들기
   → 키 생성 (JSON)
   ```

2. **JSON 키 파일 저장**
   ```bash
   # 프로젝트 루트에 저장
   mv ~/Downloads/service-account-key.json ./google-service-account.json
   
   # .gitignore에 추가 (보안!)
   echo "google-service-account.json" >> .gitignore
   ```

3. **Play Console에서 권한 부여**
   ```
   Google Play Console
   → 설정 → API 액세스
   → 서비스 계정 연결
   → 권한 부여 (앱 관리, 릴리스 관리)
   ```

4. **자동 제출**
   ```bash
   # 빌드 & 제출을 한 번에!
   eas build --platform android --profile production --auto-submit
   ```

---

## 📋 **빠른 체크리스트**

### **지금 당장 출시해야 한다면:**
- [ ] 옵션 1 사용: 경고 무시하고 출시
- [ ] 나중에 매핑 파일 업로드 계획

### **시간이 조금 있다면:**
- [ ] 옵션 2 사용: EAS Build에서 매핑 파일 다운로드
- [ ] Google Play Console에 수동 업로드
- [ ] 경고 해결 확인

### **장기적 해결을 원한다면:**
- [x] `eas.json`에 ProGuard 설정 추가 (완료!)
- [ ] Google Cloud 서비스 계정 생성
- [ ] EAS Submit 자동화 설정
- [ ] 다음 빌드부터 자동 처리

---

## 🔍 **매핑 파일 찾는 방법 (수동 빌드 시)**

로컬에서 직접 빌드했다면:

```bash
# 1. Android 프로젝트 폴더로 이동
cd android

# 2. 매핑 파일 위치 (release 빌드 후)
android/app/build/outputs/mapping/release/mapping.txt

# 3. 파일 확인
cat app/build/outputs/mapping/release/mapping.txt
```

**파일 내용 예시:**
```
com.artyard.app.MainActivity -> com.artyard.app.a:
    void onCreate(android.os.Bundle) -> a
com.artyard.app.utils.ImageHelper -> com.artyard.app.b:
    android.graphics.Bitmap loadImage(java.lang.String) -> a
```

원본 클래스명 → 난독화된 이름 매핑이 저장되어 있습니다!

---

## ❓ **FAQ**

### Q1. 매핑 파일을 업로드하지 않으면 앱이 출시 안 되나요?
**A:** 아니요! 경고일 뿐이며 출시는 가능합니다. 다만 크래시 분석이 어려워집니다.

### Q2. 이미 출시한 버전에도 매핑 파일을 추가할 수 있나요?
**A:** 네! Google Play Console에서 해당 버전을 찾아 나중에 업로드할 수 있습니다.

### Q3. 매핑 파일이 어디 있는지 모르겠어요.
**A:** EAS Build를 사용했다면 빌드 페이지에서 다운로드 가능합니다. 로컬 빌드라면 `android/app/build/outputs/mapping/release/mapping.txt`에 있습니다.

### Q4. 개발 버전이나 테스트 버전에도 필요한가요?
**A:** 내부 테스트나 비공개 테스트에서는 선택사항입니다. 프로덕션(정식 출시)에서 권장됩니다.

### Q5. 매핑 파일을 잃어버렸어요!
**A:** EAS Build를 사용했다면 빌드 히스토리에서 다시 다운로드 가능합니다. 로컬 빌드는 재빌드해야 합니다.

### Q6. 다음 버전을 업로드할 때도 매핑 파일이 필요한가요?
**A:** 네, 버전마다 다른 매핑 파일이 생성됩니다. 각 버전마다 업로드해야 합니다.

---

## 🎯 **권장 사항**

### **지금 (현재 버전):**
```bash
# 1. 경고 무시하고 출시 진행 (빠른 출시 우선)
# 2. 출시 후 여유가 생기면 매핑 파일 업로드
```

### **다음 버전부터 (장기적):**
```bash
# 1. eas.json 설정 확인 (이미 완료! ✅)
# 2. EAS Build 사용
# 3. 빌드 시 매핑 파일 자동 생성
# 4. Google Play Console에 수동 또는 자동 업로드
```

### **앱이 성장하면:**
```bash
# 1. Google Cloud 서비스 계정 설정
# 2. EAS Submit 자동화
# 3. CI/CD 파이프라인에 포함
# 4. 완전 자동화된 배포 프로세스
```

---

## 📞 **추가 도움이 필요하면**

- **EAS Build 문서**: https://docs.expo.dev/build/introduction/
- **Google Play Console 가이드**: https://support.google.com/googleplay/android-developer/answer/9848633
- **ProGuard 설명**: https://developer.android.com/build/shrink-code

---

## ✅ **요약**

| 상황 | 권장 방법 | 예상 시간 |
|------|----------|----------|
| 🚀 **지금 당장 출시** | 경고 무시 | 0분 |
| 🎯 **제대로 출시** | 매핑 파일 수동 업로드 | 10-15분 |
| 🔧 **장기적 해결** | EAS Submit 자동화 | 30-60분 (최초 설정) |

---

**현재 상황에서는 경고를 무시하고 출시해도 괜찮습니다!** ✅

나중에 여유가 생기면 매핑 파일을 업로드하거나 자동화를 설정하세요! 😊

궁금한 점이 있으면 언제든 물어보세요! 🚀

