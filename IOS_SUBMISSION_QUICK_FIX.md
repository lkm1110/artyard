# ⚡ iOS 심사 제출 문제 빠른 해결 가이드

**3가지 문제를 30분 안에 해결!**

---

## ✅ **문제 1: 개인정보 처리방침 (해결 완료!)**

### **STEP 1: 문서 준비 완료** ✅
파일: `docs/PRIVACY_POLICY.md`

### **STEP 2: 웹에 호스팅 (5분)**

**가장 빠른 방법 - GitHub Pages:**

```bash
# 1. GitHub 저장소로 이동
https://github.com/[your-username]/canvaspop

# 2. Settings → Pages (왼쪽 메뉴)

# 3. Source 설정:
   - Branch: main
   - Folder: /docs
   - Save

# 4. 5분 후 URL 확인:
https://[your-username].github.io/canvaspop/PRIVACY_POLICY.html
```

### **STEP 3: App Store Connect에 등록 (10분)**

```
1. https://appstoreconnect.apple.com 접속

2. ArtYard 앱 선택

3. 왼쪽 메뉴 → "App Privacy" (앱 개인정보 보호)

4. "Get Started" 클릭

5. 수집하는 데이터 선택:
   
   ✅ Contact Info → Email Address, Name
   ✅ User Content → Photos/Videos, Other User Content
   ✅ Location → Coarse Location (선택사항)
   ✅ Identifiers → User ID
   ✅ Usage Data → Product Interaction
   ✅ Diagnostics → Crash Data, Performance Data

6. 각 데이터마다:
   - Purpose: App Functionality, Analytics
   - Linked to User: Yes
   - Used for Tracking: NO ← 중요!

7. Privacy Policy URL 입력:
   https://[your-url]/PRIVACY_POLICY.html

8. "Publish" 클릭
```

---

## ✅ **문제 2: NSUserTrackingUsageDescription (해결 완료!)** ✅

### **이미 수정됨!**
- ✅ `app.json`에서 `NSUserTrackingUsageDescription` 제거됨
- ✅ 추적 권한 요청 없음
- ✅ Apple 심사 통과 가능

### **다음 단계: 새 빌드 생성**

```bash
# iOS 빌드 재생성 (추적 권한 제거된 버전)
eas build --platform ios --profile production
```

---

## ✅ **문제 3: 가격 설정 (5분)**

### **App Store Connect 가격 설정:**

```
1. App Store Connect → ArtYard

2. 왼쪽 메뉴 → "Pricing and Availability"
   (가격 및 사용 가능 여부)

3. Price → "Edit" 클릭

4. 가격 선택:
   ✅ Free (무료) ← 추천!
   
   이유:
   - 마켓플레이스는 무료 다운로드가 표준
   - 거래 수수료(10%)로 수익화
   - 다운로드 수 증가

5. Availability (사용 가능 여부):
   ✅ All Countries and Regions
   또는
   ✅ Specific Countries (Korea, US 등)

6. "Save" 클릭
```

---

## 🚀 **전체 프로세스 (30분)**

```
✅ 1. 개인정보 처리방침 호스팅 (5분)
   → GitHub Pages 설정

✅ 2. App Store Connect - 앱 개인정보 보호 (10분)
   → 데이터 수집 목적 입력
   → Privacy Policy URL 등록

✅ 3. 가격 설정 (5분)
   → 무료 앱으로 설정

✅ 4. 새 iOS 빌드 (10분 대기 후 제출)
   eas build --platform ios --profile production
   → 15-20분 빌드 시간

✅ 5. 새 빌드를 App Store Connect에 연결
   → 빌드 완료 후 자동으로 나타남
   → 버전에 빌드 선택

✅ 6. 심사 제출!
   → "Submit for Review" 클릭
```

---

## 📋 **빠른 체크리스트**

제출 전에 확인:

### **필수 항목:**
- [x] NSUserTrackingUsageDescription 제거 ✅
- [ ] 개인정보 처리방침 URL 호스팅
- [ ] App Store Connect - 앱 개인정보 보호 입력
- [ ] 가격: 무료 설정
- [ ] 새 iOS 빌드 (추적 권한 제거)
- [ ] 빌드를 버전에 연결

### **권장 항목:**
- [ ] 스크린샷 업로드 (iPhone 6.7", 6.5")
- [ ] 앱 설명 작성
- [ ] 키워드 입력
- [ ] 데모 계정 제공 (로그인 필요 시)

---

## 🎯 **지금 바로 할 일 (우선순위 순서)**

### **1️⃣ 개인정보 처리방침 호스팅 (가장 중요!)**

```bash
# GitHub 저장소 Settings → Pages
# Source: main, /docs
# Save
# → URL 복사
```

### **2️⃣ App Store Connect 설정**

```
앱 개인정보 보호 → 데이터 입력
가격 → 무료
```

### **3️⃣ 새 빌드**

```bash
eas build --platform ios --profile production
```

### **4️⃣ 심사 제출**

```
빌드 연결 → 심사 제출
```

---

## 💡 **팁**

### **GitHub Pages가 작동 안 하면:**

**대안 1: Netlify (2분)**
```
1. https://netlify.com
2. "New site from Git"
3. GitHub 저장소 연결
4. Build: 없음, Publish: docs
5. Deploy!
```

**대안 2: Google Sites (5분)**
```
1. https://sites.google.com
2. 새 사이트 생성
3. PRIVACY_POLICY.md 내용 복사/붙여넣기
4. 게시
```

### **빌드 시간 단축:**

```bash
# 이전 빌드가 있으면 캐시 사용되어 빠름
# 일반적으로 15-20분 소요
```

---

## ❓ **FAQ**

### Q: 개인정보 처리방침을 반드시 웹에 올려야 하나요?
**A:** 네! Apple은 공개 URL을 요구합니다. PDF나 앱 내 텍스트는 불가능합니다.

### Q: 추적 권한을 제거하면 분석이 안 되나요?
**A:** 아니요! 앱 내 분석은 계속 가능합니다. "추적"은 다른 앱/웹사이트 간 사용자 추적을 의미합니다.

### Q: 무료 앱인데 수익은 어떻게 내나요?
**A:** 거래 수수료(10%)로 수익화합니다. 이게 마켓플레이스의 표준 모델이에요.

### Q: 빌드를 다시 해야 하나요?
**A:** 네! NSUserTrackingUsageDescription을 제거했으므로 새 빌드가 필요합니다.

### Q: 얼마나 걸리나요?
**A:** 설정 30분 + 빌드 20분 = 총 50분 정도!

---

## 🎉 **완료 후**

심사 제출하면:
- ⏱️ 24-48시간 내 심사 (평균)
- 📧 이메일로 결과 통지
- ✅ 승인 시 즉시 또는 예약 출시

---

## 📞 **도움이 필요하면**

- 상세 가이드: `docs/APP_STORE_SUBMISSION_CHECKLIST.md`
- 개인정보 처리방침: `docs/PRIVACY_POLICY.md`

---

**화이팅! 곧 App Store에 올라갈 거예요!** 🚀✨

