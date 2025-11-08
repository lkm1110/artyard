# 🚀 2Checkout 빠른 설정 가이드 (5분!)

## ✅ 이미 완료된 것

```
✅ 2Checkout 계정 생성
✅ API Credentials 발급
✅ Product 생성 (ID: 52070072)
✅ 코드 통합 완료 (CheckoutScreen, PaymentService)
```

---

## ⚡ 지금 바로 해야 할 것 (3단계)

### **1단계: .env 파일 생성** (1분) ⭐ **가장 중요!**

**프로젝트 루트에 `.env` 파일 생성:**

```
경로: C:\project\canvaspop\.env
```

**아래 내용 전체 복사해서 붙여넣기:**

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

**⚠️ 저장 후 Expo 재시작 필수!**
```bash
# Ctrl+C로 종료
npm start
```

---

### **2단계: Return URLs 설정** (2분)

**2Checkout Dashboard 접속:**
```
https://secure.2checkout.com/cpanel/
```

**경로:**
```
Setup → Ordering Options → Return URLs
```

**입력할 URL:**
```
Approved URL:    artyard://payment-success
Pending URL:     artyard://payment-success
Declined URL:    artyard://payment-cancel
```

**💾 Save 클릭!**

---

### **3단계: 테스트!** (2분)

**앱에서:**
```
1. 작품 선택
2. Purchase 버튼 클릭
3. Checkout 화면에서 정보 입력
4. Proceed to Payment 클릭
5. 2Checkout 페이지로 이동
```

**테스트 카드 정보:**
```
카드 번호: 4111 1111 1111 1111
CVV: 123
만료일: 12/25
이름: Test User
```

**성공하면:**
```
✅ artyard://payment-success로 돌아옴
✅ 트랜잭션이 'paid' 상태로 변경
✅ 알림 발송
```

---

## 🎯 현재 자격증명 요약

| 항목 | 값 |
|------|-----|
| **Merchant Code** | 255745102572 |
| **Secret Key** | _~xp(*6XV4mU!PcJMld0 |
| **Publishable Key** | 7C1C2F71-1F96-413B-8A97-D25A8F3D4454 |
| **Private Key** | 4EF7362F-0A0A-4F61-823A-58CF1A9D70F0 |
| **Product ID** | 52070072 |

---

## 🔧 Payment Methods 활성화 (선택)

**경로:**
```
Setup → Payment Methods
```

**활성화 권장:**
```
✅ Credit Cards (Visa, Mastercard, Amex)
✅ PayPal (선택사항)
```

---

## 🧪 Test Mode 확인

**경로:**
```
Setup → General Settings
```

**확인:**
```
✅ Test Mode: ON (현재 테스트 중)
   → 실제 결제 안 됨
   → 나중에 Production Mode로 변경
```

---

## ❌ 문제 해결

### **1. 환경변수가 인식 안 됨**
```bash
# 해결: Expo 완전 재시작
npm start -- --clear
```

### **2. Return URL이 작동 안 됨**
```
해결: 
1. Dashboard에서 URL 다시 확인
2. 오타 없는지 확인 (artyard://)
3. Save 버튼 눌렀는지 확인
```

### **3. 테스트 카드가 거부됨**
```
해결:
1. Test Mode가 ON인지 확인
2. 카드 번호 정확히 입력 (4111111111111111)
3. CVV와 만료일 입력
```

---

## ✅ 체크리스트

```
현재 상태:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 2Checkout 계정
✅ API Credentials
✅ Product ID
⬜ .env 파일 생성      ← 지금!
⬜ Expo 재시작
⬜ Return URLs 설정
⬜ Payment Methods 활성화
⬜ 테스트!
```

---

## 📱 결제 흐름

```
1. User clicks "Purchase" on artwork
   ↓
2. CheckoutScreen opens
   - Shows artwork details
   - Displays price in USD
   - Collects contact info
   ↓
3. User clicks "Proceed to Payment"
   - Creates transaction in DB
   - Generates 2Checkout payment URL
   - Opens TwoCheckoutPaymentScreen (WebView)
   ↓
4. 2Checkout hosted page
   - User enters card details
   - 2Checkout processes payment
   ↓
5. Payment success
   - Redirects to artyard://payment-success
   - Updates transaction status to 'paid'
   - Sets auto_confirm_at (7 days escrow)
   - Sends notification to seller
   ↓
6. PaymentSuccessScreen
   - Shows success message
   - Explains escrow process
   - Guides to chat with artist for shipping
```

---

## 💰 Fee Structure (다시 확인)

```
Sale Price: $100
├─ Platform Fee (10%): $10 (included)
├─ Payment Fee (3.5%): $3.50 (platform pays)
└─ Seller Receives: $90 (exactly 90%)

Platform Net: $10 - $3.50 = $6.50
```

---

## 🔒 보안 주의사항

```
⚠️ .env 파일은 절대 공유하지 마세요!

❌ GitHub 업로드 금지
❌ 스크린샷 공유 금지
❌ 메신저 전송 금지

✅ .gitignore에 이미 포함됨
✅ 로컬에만 보관
```

---

## 🎯 다음 단계 (순서대로!)

1. ✅ `.env` 파일 생성 → 내용 복사 붙여넣기
2. ✅ `npm start` 재시작
3. ✅ Return URLs 설정
4. ✅ 테스트 결제 진행
5. ✅ 성공 확인!

---

**거의 다 끝났어요! 화이팅! 🚀**

더 자세한 내용은 `2CHECKOUT-INTEGRATION-GUIDE.md`를 참고하세요!


