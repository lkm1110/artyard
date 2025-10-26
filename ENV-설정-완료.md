# 🔐 .env 파일 설정 가이드

## ✅ **받으신 2Checkout Credentials**

```
Merchant Code: 255745102572
Secret Key: _~xp(*6XV4mU!PcJMld0
Publishable Key: 7C1C2F71-1F96-413B-8A97-D25A8F3D4454
Private Key: 4EF7362F-0A0A-4F61-823A-58CF1A9D70F0
```

---

## 📝 **1단계: .env 파일 생성/수정**

### VS Code에서:
```
1. 프로젝트 루트 (C:\project\canvaspop) 폴더에서
2. ".env" 파일 열기 (없으면 새로 만들기)
3. 아래 내용 전체 복사해서 붙여넣기
```

---

## 📋 **전체 .env 파일 내용 (복사하세요!)**

```bash
# =====================================
# 2CHECKOUT 설정
# =====================================
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=255745102572
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=_~xp(*6XV4mU!PcJMld0
EXPO_PUBLIC_2CHECKOUT_PUBLISHABLE_KEY=7C1C2F71-1F96-413B-8A97-D25A8F3D4454
EXPO_PUBLIC_2CHECKOUT_PRIVATE_KEY=4EF7362F-0A0A-4F61-823A-58CF1A9D70F0
EXPO_PUBLIC_2CHECKOUT_PRODUCT_ID=52070072

# =====================================
# SUPABASE 설정
# =====================================
EXPO_PUBLIC_SUPABASE_URL=https://bkvycanciimgyftdtqpx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MjcxMjUsImV4cCI6MjA1MDEwMzEyNX0.OXlpgEqVUo-1L0khEZE3-uy0d3K5KmJi55FlNVGTWis

# =====================================
# KAKAO 설정
# =====================================
EXPO_PUBLIC_KAKAO_APP_KEY=4d49bb1ab7c3308b68b8d4eb0e05ced3
```

---

## ⚠️ **보안 주의사항**

### **절대 공유하지 마세요!**
```
❌ GitHub에 업로드 금지
❌ 스크린샷 공유 금지
❌ 메신저 전송 금지
❌ 디스코드/슬랙 공유 금지

✅ .env 파일은 .gitignore에 이미 포함됨
✅ 로컬에만 저장
```

---

## 🚀 **2단계: 앱 재시작**

### 터미널에서:
```bash
# Expo 서버 완전 종료 (Ctrl+C)
# 그 다음 다시 시작:
npm start
```

### 변경사항 적용:
```
환경변수가 변경되었으므로
Expo를 완전히 재시작해야 합니다!
```

---

## ✅ **3단계: Return URLs 설정**

### 2Checkout Dashboard로 돌아가서:

```
경로:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup → Ordering options
━━━━━━━━━━━━━━━━━━━━━━━━━━━

입력할 URL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Success URL: artyard://payment-success
Cancel URL: artyard://payment-cancel
Decline URL: artyard://payment-decline
━━━━━━━━━━━━━━━━━━━━━━━━━━━

저장!
```

---

## ✅ **4단계: Payment Methods 활성화**

### 2Checkout Dashboard:

```
경로:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup → Payment Methods
━━━━━━━━━━━━━━━━━━━━━━━━━━━

활성화:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Credit Card (필수!)
   - Visa
   - Mastercard
   - American Express

✅ PayPal (선택, 추천)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 **5단계: 테스트 모드 확인**

### 2Checkout Dashboard:

```
경로:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup → General Settings
또는
Account Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━

확인:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test Mode: ON
   → 실제 결제 안 됨
   → 테스트용

❌ Production Mode: OFF
   → 나중에 출시 시 ON
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 **테스트 카드 정보**

### 결제 테스트용:

```
카드 번호: 4111 1111 1111 1111
CVV: 123
만료일: 12/25 (미래 날짜 아무거나)
이름: Test User
주소: 아무거나
```

---

## ✅ **완료 체크리스트**

```
현재 상태:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Product 생성 (ID: 52070072)
✅ API Credentials 받음
⏸️ .env 파일 설정 ← 지금 할 일!
⏸️ 앱 재시작
⏸️ Return URLs 설정
⏸️ Payment Methods 활성화
⏸️ Test Mode 확인
⏸️ 테스트!
```

---

## 🚀 **다음 단계**

### 1. .env 파일 복사 붙여넣기 (지금!)
### 2. npm start 재시작
### 3. Return URLs 설정
### 4. 테스트!

---

**거의 다 끝났어요! 화이팅! 🎉**

