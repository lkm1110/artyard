# 📱 iOS App Store 심사 제출 체크리스트

Apple App Store에 ArtYard를 제출하기 위한 완전 가이드입니다.

---

## 🚨 **현재 해결해야 할 3가지 문제**

### ❌ 1. 개인정보 처리방침 (Privacy Policy) 필요
### ❌ 2. NSUserTrackingUsageDescription 설정 문제
### ❌ 3. 가격 설정 필요

---

## ✅ **해결 방법**

---

## 📋 **1. 개인정보 처리방침 (Privacy Policy)**

### **STEP 1: 개인정보 처리방침 문서 준비 완료!** ✅

파일 위치: `docs/PRIVACY_POLICY.md`

### **STEP 2: 웹에 호스팅하기**

개인정보 처리방침은 **공개 URL**이 필요합니다!

#### **옵션 A: GitHub Pages (무료, 가장 쉬움!)** ⭐

```bash
# 1. docs 폴더를 GitHub에 푸시
git add docs/PRIVACY_POLICY.md
git commit -m "Add privacy policy"
git push

# 2. GitHub 저장소 → Settings → Pages
# → Source: "Deploy from a branch"
# → Branch: main, /docs
# → Save

# 3. URL 생성됨:
# https://[your-username].github.io/canvaspop/PRIVACY_POLICY.html
```

#### **옵션 B: 간단한 호스팅 서비스**

**Netlify (무료):**
```bash
# 1. https://www.netlify.com 가입
# 2. "New site from Git" 클릭
# 3. GitHub 저장소 연결
# 4. Publish directory: docs
# 5. Deploy!
# URL: https://artyard-app.netlify.app/PRIVACY_POLICY.html
```

**Vercel (무료):**
```bash
# 1. https://vercel.com 가입
# 2. "Import Project"
# 3. GitHub 저장소 연결
# 4. Deploy!
```

#### **옵션 C: 자체 웹사이트**
```
https://artyard.app/privacy
https://artyard.app/privacy-policy
```

### **STEP 3: App Store Connect에 등록**

```
1. App Store Connect 접속
   https://appstoreconnect.apple.com

2. 앱 선택 (ArtYard)

3. 왼쪽 메뉴 → "앱 개인정보 보호"
   (또는 "App Privacy")

4. "시작하기" 클릭

5. 수집하는 데이터 유형 선택:
   
   ✅ 연락처 정보
      - 이메일 주소 (계정 생성)
      - 이름 (프로필)
   
   ✅ 사용자 콘텐츠
      - 사진 또는 비디오 (작품 업로드)
      - 기타 사용자 콘텐츠 (메시지, 프로필)
   
   ✅ 위치
      - 대략적인 위치 (작품 위치, 선택사항)
   
   ✅ 식별자
      - 사용자 ID (계정)
   
   ✅ 사용 데이터
      - 제품 상호작용 (분석)
   
   ✅ 진단
      - 충돌 데이터
      - 성능 데이터

6. 각 데이터 유형마다:
   - 수집 목적 선택
     • 앱 기능
     • 분석
     • 개인 맞춤 설정 (선택 시)
   
   - 데이터가 사용자와 연결되나요? → 예
   - 추적에 사용되나요? → 아니요 (광고 추적 안 함)
   
7. 개인정보 처리방침 URL 입력:
   https://[your-url]/PRIVACY_POLICY.html
   
8. "게시" 클릭
```

---

## 🎯 **2. NSUserTrackingUsageDescription 문제 해결**

### **문제:**
`app.json`에 추적 권한이 포함되어 있음:
```json
"NSUserTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you."
```

### **해결 방법 2가지:**

#### **옵션 A: 추적 권한 제거 (추천!)** ⭐

**ArtYard에서 광고 추적을 하지 않는다면 제거:**

```json
// app.json에서 다음 줄 삭제:
"NSUserTrackingUsageDescription": "..."
```

**장점:**
- ✅ 심사 통과 쉬움
- ✅ 사용자 신뢰 증가
- ✅ GDPR/CCPA 준수 용이

#### **옵션 B: 추적 목적 명확히 하고 App Store Connect 업데이트**

**만약 개인화 추천을 위해 추적이 필요하다면:**

1. **app.json 수정:**
```json
"NSUserTrackingUsageDescription": "ArtYard uses this to provide personalized artwork recommendations based on your interests. You can decline and still use all features."
```

2. **App Store Connect에서 "추적" 데이터 추가:**
```
앱 개인정보 보호 → 데이터 유형 추가
→ "추적" 선택
→ 목적: "개인 맞춤 설정"
→ "추적에 사용" → 예
```

---

### **내 추천: 옵션 A (제거)** 🎯

이유:
- ArtYard는 현재 광고 플랫폼이 아님
- 추적 없이도 추천 기능 구현 가능 (앱 내 데이터만 사용)
- Apple이 추적에 민감함 (거부율 높음)
- 심사 통과 빠름

---

## 💰 **3. 가격 설정**

### **STEP 1: App Store Connect 가격 설정**

```
1. App Store Connect → ArtYard 선택

2. 왼쪽 메뉴 → "가격 및 사용 가능 여부"
   (Pricing and Availability)

3. 가격 → "편집" 클릭

4. 가격 등급 선택:
   
   ✅ 무료 (0원)
      - 앱 다운로드 무료
      - 인앱 구매/수수료로 수익화
      - 추천! (대부분의 마켓플레이스가 무료)
   
   또는
   
   ⭐ 유료 (₩1,200+)
      - 다운로드 시 결제
      - 마켓플레이스에는 적합하지 않음

5. 국가 선택:
   - 전 세계
   - 또는 특정 국가만 (한국, 미국 등)

6. "저장" 클릭
```

### **추천: 무료 앱** ⭐

```
앱: 무료
수익 모델: 거래 수수료 (10%)
```

---

## 📝 **완전 체크리스트**

### **A. 개인정보 보호 (Privacy)**

- [ ] 개인정보 처리방침 작성 완료 ✅ (이미 완료!)
- [ ] 웹에 호스팅 (GitHub Pages / Netlify)
- [ ] App Store Connect → 앱 개인정보 보호 입력
- [ ] 개인정보 처리방침 URL 등록
- [ ] NSUserTrackingUsageDescription 제거 또는 수정

### **B. 앱 정보**

- [ ] 앱 이름: ArtYard
- [ ] 부제목: "Where Every Artwork Finds Its Home"
- [ ] 카테고리: "라이프스타일" 또는 "소셜 네트워킹"
- [ ] 연령 등급: 12+ (소셜 기능, 결제 있음)
- [ ] 저작권: © 2025 ArtYard
- [ ] 개인정보 처리방침 URL

### **C. 가격 및 배포**

- [ ] 가격: 무료
- [ ] 국가: 전 세계 (또는 선택)
- [ ] 출시 시기: 수동 출시 (심사 통과 후 직접 출시)

### **D. 앱 미리보기 및 스크린샷**

- [ ] iPhone 6.7" (iPhone 15 Pro Max) - 필수
- [ ] iPhone 6.5" (iPhone 11 Pro Max) - 필수
- [ ] iPad Pro 12.9" - 선택사항
- [ ] 각각 최소 3장 (최대 10장)

### **E. 앱 설명**

- [ ] 설명 (4000자 이내)
- [ ] 키워드 (100자 이내)
- [ ] 지원 URL
- [ ] 마케팅 URL (선택사항)

### **F. 빌드**

- [ ] iOS 빌드 업로드 완료
- [ ] 버전 번호: 1.0.0
- [ ] 빌드 번호: 자동 증가

### **G. 심사 정보**

- [ ] 연락처 정보 (이름, 전화, 이메일)
- [ ] 데모 계정 (로그인 필요 시)
  ```
  Username: appstore@artyard.app
  Password: ArtYard2025Demo!
  ```
- [ ] 추가 설명 (선택사항)

### **H. 버전 출시**

- [ ] 버전 정보 (What's New)
  ```
  Initial release of ArtYard!
  
  Features:
  • Discover unique artworks from emerging artists
  • Direct messaging between artists and collectors
  • Secure escrow payment system
  • Artist profiles and portfolios
  • Art challenges and community features
  
  Join our community and find art that speaks to you!
  ```

---

## 🚀 **제출 순서**

### **단계별 가이드:**

```
✅ 1. 개인정보 처리방침 웹 호스팅
   → GitHub Pages 또는 Netlify

✅ 2. app.json 수정
   → NSUserTrackingUsageDescription 제거

✅ 3. iOS 빌드 재생성
   eas build --platform ios --profile production

✅ 4. App Store Connect 설정
   4-1. 가격: 무료
   4-2. 앱 개인정보 보호: 데이터 유형 입력
   4-3. 개인정보 처리방침 URL 등록
   4-4. 스크린샷 업로드
   4-5. 앱 설명 입력
   4-6. 심사 정보 입력
   4-7. 데모 계정 생성 및 입력

✅ 5. 심사 제출
   → "심사를 위해 제출" 클릭

✅ 6. 대기 (24-48시간)
   → Apple 심사 대기

✅ 7. 승인 후 출시!
   → 수동 출시 또는 자동 출시
```

---

## 🛠️ **지금 바로 해야 할 일**

### **1단계: app.json 수정 (NSUserTrackingUsageDescription 제거)**

제가 바로 수정해드릴게요!

### **2단계: 개인정보 처리방침 호스팅**

**가장 빠른 방법 (GitHub Pages):**
```bash
# 1. GitHub 저장소 Settings → Pages
# 2. Source: main branch, /docs folder
# 3. Save
# 4. URL 복사
```

### **3단계: 새 iOS 빌드**
```bash
eas build --platform ios --profile production
```

### **4단계: App Store Connect 설정**
```
가격: 무료 선택
앱 개인정보 보호: 위 가이드대로 입력
```

---

## 📞 **도움이 필요하면**

- **Apple 개발자 지원**: https://developer.apple.com/support/
- **App Store Connect 가이드**: https://developer.apple.com/app-store-connect/
- **개인정보 보호 가이드**: https://developer.apple.com/app-store/user-privacy-and-data-use/

---

## 🎉 **완료 후**

심사가 승인되면:
1. ✅ App Store에 ArtYard 표시됨
2. ✅ 사용자가 다운로드 가능
3. ✅ 마케팅 시작!

---

**화이팅! 곧 App Store에서 볼 수 있을 거예요!** 🚀✨

