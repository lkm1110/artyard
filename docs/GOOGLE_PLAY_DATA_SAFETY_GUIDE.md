# Google Play Data Safety 섹션 설정 가이드 📋

## ⚠️ 중요 공지
ArtYard는 사용자의 **이름(Name)**과 **이메일 주소(Email)**를 수집합니다.
소셜 로그인(Google, Apple, Facebook)을 통해 사용자의 이름이 자동으로 수집됩니다.

---

## 📍 Google Play Console 설정 경로

```
Google Play Console → 앱 콘텐츠 (App content) → 데이터 보안 (Data safety)
```

---

## 🔐 수집하는 데이터 유형 (Data Types We Collect)

### 1. **개인 정보 (Personal info)**

#### ✅ Name (이름)
- **수집 여부**: **Yes**
- **수집 방법**: 소셜 로그인 (Google, Apple, Facebook)을 통해 자동 수집
- **목적(Purpose)**:
  - ☑️ App functionality (앱 기능)
  - ☑️ Account management (계정 관리)
- **공유 여부**: **No** (Third parties에게 공유하지 않음)
- **선택적/필수**: **Required** (필수)
- **데이터 암호화**: **Yes, data is encrypted in transit** (전송 중 암호화)
- **데이터 삭제 가능**: **Yes, users can request deletion** (사용자가 삭제 요청 가능)

#### ✅ Email address (이메일 주소)
- **수집 여부**: **Yes**
- **수집 방법**: 회원가입 시 수집
- **목적(Purpose)**:
  - ☑️ App functionality (앱 기능)
  - ☑️ Account management (계정 관리)
  - ☑️ Communications (통신)
- **공유 여부**: **No**
- **선택적/필수**: **Required**
- **데이터 암호화**: **Yes, data is encrypted in transit**
- **데이터 삭제 가능**: **Yes, users can request deletion**

---

### 2. **사진 및 동영상 (Photos and videos)**

#### ✅ Photos
- **수집 여부**: **Yes**
- **수집 방법**: 작품 업로드 시 사용자가 직접 제공
- **목적(Purpose)**:
  - ☑️ App functionality (앱 기능)
- **공유 여부**: **No**
- **선택적/필수**: **Optional** (선택적)
- **데이터 암호화**: **Yes, data is encrypted in transit**
- **데이터 삭제 가능**: **Yes, users can delete their data**

---

### 3. **메시지 (Messages)**

#### ✅ Other in-app messages
- **수집 여부**: **Yes**
- **수집 방법**: 채팅 기능 사용 시
- **목적(Purpose)**:
  - ☑️ App functionality (앱 기능)
- **공유 여부**: **No**
- **선택적/필수**: **Optional**
- **데이터 암호화**: **Yes, data is encrypted in transit**
- **데이터 삭제 가능**: **Yes, users can delete their data**

---

### 4. **앱 활동 (App activity)**

#### ✅ App interactions
- **수집 여부**: **Yes**
- **수집 방법**: 앱 사용 중 자동 수집
- **목적(Purpose)**:
  - ☑️ Analytics (분석)
  - ☑️ App functionality (앱 기능)
- **공유 여부**: **No**
- **선택적/필수**: **Optional**
- **데이터 암호화**: **Yes, data is encrypted in transit**
- **데이터 삭제 가능**: **Yes, users can delete their data**

---

## 🚫 수집하지 않는 데이터 유형

### ❌ Financial info (금융 정보)
- **수집 여부**: **No**
- **이유**: 결제는 2Checkout을 통해 처리되며, 우리 서버에는 금융 정보를 저장하지 않음

### ❌ Location (위치 정보)
- **수집 여부**: **No**
- **이유**: 위치 정보는 사용자가 프로필에 직접 입력하는 텍스트 필드일 뿐, GPS 위치를 수집하지 않음

### ❌ Web browsing history (웹 검색 기록)
- **수집 여부**: **No**

### ❌ Device or other IDs (기기 ID)
- **수집 여부**: **No**

---

## ⚙️ 데이터 사용 목적 (Data Usage Purposes)

### 1. **App functionality (앱 기능)** ✅
- 사용자 프로필 관리
- 작품 업로드 및 표시
- 채팅 기능

### 2. **Account management (계정 관리)** ✅
- 회원가입/로그인
- 프로필 관리

### 3. **Analytics (분석)** ✅
- 앱 사용 패턴 분석
- 사용자 경험 개선

### 4. **Communications (통신)** ✅
- 중요 공지사항
- 계정 관련 알림

### ❌ **NOT for:**
- Financial transactions (금융 거래) - 2Checkout이 처리
- Advertising or marketing (광고/마케팅)
- Fraud prevention (사기 방지)
- Third-party sharing (제3자 공유)

---

## 🔒 보안 설정 (Security Practices)

### ✅ Data is encrypted in transit (전송 중 암호화)
- HTTPS/TLS 사용
- Supabase 보안 연결

### ✅ Users can request that data be deleted (사용자 데이터 삭제 요청 가능)
- URL: `https://lkm1110.github.io/artyard/data-deletion.html`

### ✅ Committed to following Google Play Families Policy (가족 정책 준수)
- 연령 제한: 13세 이상

### ✅ Independent security review (독립적 보안 검토)
- Supabase 플랫폼 사용 (SOC 2 인증)

---

## 📝 개인정보처리방침 URL

```
https://lkm1110.github.io/artyard/privacy-policy.html
```

---

## 🔄 데이터 삭제 URL

```
https://lkm1110.github.io/artyard/data-deletion.html
```

---

## ✅ 체크리스트 (설정 완료 확인)

- [ ] **Name** 데이터 유형 추가 완료
- [ ] **Email address** 데이터 유형 추가 완료
- [ ] **Photos** 데이터 유형 추가 완료
- [ ] **Messages** 데이터 유형 추가 완료
- [ ] **App interactions** 데이터 유형 추가 완료
- [ ] 모든 데이터에 대해 "Used for Tracking" → **No** 설정
- [ ] Privacy Policy URL 입력 완료
- [ ] Data deletion URL 입력 완료
- [ ] "Data is encrypted in transit" 체크 완료
- [ ] "Users can request deletion" 체크 완료

---

## 🎯 주의사항

1. **Name 데이터는 필수로 명시해야 합니다**
   - 소셜 로그인(Google, Apple, Facebook)을 사용하면 사용자의 이름이 자동으로 수집됩니다
   - Google Play Console에서 누락 시 앱이 거부될 수 있습니다

2. **Financial info는 수집하지 않음으로 설정**
   - 2Checkout이 모든 결제를 처리하므로 우리 서버에는 금융 정보가 없습니다

3. **"Used for Tracking" 항목**
   - 모든 데이터 유형에 대해 **No**로 설정해야 합니다
   - Yes로 설정 시 NSUserTrackingUsageDescription 필요 (iOS에서 제거됨)

4. **데이터 삭제**
   - 사용자가 계정 삭제를 요청하면 모든 데이터를 삭제해야 합니다
   - `data-deletion.html` 페이지에서 안내 제공

---

## 📞 문의

데이터 보안 관련 문의:
- 이메일: azza4646@naver.com
- GitHub: https://github.com/lkm1110/artyard

