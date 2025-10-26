# 🚀 2Checkout 최종 설정 가이드

## ✅ **완료된 것**

```
✅ SQL 실행 (FINAL-INSTALL.sql)
✅ WebView 패키지 설치
✅ TwoCheckoutPaymentScreen 생성
✅ CheckoutScreen 생성 (달러 버전)
✅ formatPrice 함수 수정 (USD 지원)
```

---

## 📋 **지금 해야 할 것 (5단계)**

### **1단계: 2Checkout 계정 생성** (5분)

```
1. https://www.2checkout.com 접속
2. "Get Started" 클릭
3. 이메일, 비밀번호 입력
4. 비즈니스 정보 입력
   - Company Name: ArtYard
   - Business Type: Marketplace
   - Website: (테스트용은 생략 가능)
5. 이메일 인증
```

### **2단계: API 자격증명 발급** (2분)

```
1. Dashboard 로그인
2. 왼쪽 메뉴 → Integrations → API
3. "Generate API Credentials" 클릭
4. 복사할 것:
   ✅ Merchant Code (예: 123456)
   ✅ Secret Key (예: abc123...)
```

### **3단계: 환경변수 설정** (1분)

**.env 파일 생성/수정:**

```env
# 2Checkout
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=123456
EXPO_PUBLIC_2CHECKOUT_SECRET=abc123...

# 통화 설정
EXPO_PUBLIC_CURRENCY=USD

# Supabase (기존)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### **4단계: 네비게이션 추가** (2분)

**src/navigation/RootNavigator.tsx 또는 MainNavigator.tsx 수정:**

```typescript
import { TwoCheckoutPaymentScreen } from '../screens/TwoCheckoutPaymentScreen';
import { CheckoutScreen } from '../screens/CheckoutScreenNew'; // 새 버전

// Stack Navigator에 추가
<Stack.Screen 
  name="Checkout" 
  component={CheckoutScreen}
  options={{ title: 'Checkout' }}
/>
<Stack.Screen 
  name="TwoCheckoutPayment" 
  component={TwoCheckoutPaymentScreen}
  options={{ title: 'Secure Payment', headerBackTitle: 'Back' }}
/>
```

### **5단계: 앱 재시작** (1분)

```bash
# 캐시 클리어 후 재시작
npm start -- --clear

# 또는
npx expo start -c
```

---

## 🧪 **테스트 방법**

### **테스트 카드 (Sandbox 모드)**

```
카드 번호: 4111 1111 1111 1111
유효기간: 12/25 (미래 날짜)
CVV: 123
이름: Test User

→ 실제 돈 안 빠져나감!
→ 테스트 결제 완벽 작동
```

### **테스트 시나리오**

```
1. 작품 선택
2. "구매하기" 버튼 클릭
3. 배송지 선택/추가
4. "Continue to Payment" 클릭
5. 테스트 카드 입력
6. "Pay $XX.XX" 클릭
7. 결제 완료 확인
8. OrderDetail 화면으로 이동
```

---

## 📂 **파일 구조**

```
src/
├── screens/
│   ├── CheckoutScreenNew.tsx       ← 새 결제 화면
│   └── TwoCheckoutPaymentScreen.tsx ← 2Checkout 결제
├── types/
│   └── complete-system.ts          ← formatPrice 수정됨
└── services/
    └── transactionService.ts       ← 기존 그대로 사용
```

---

## 💰 **가격 설정 가이드**

### **작품 가격을 달러로 변경**

#### **옵션 1: DB에서 직접 변경**

```sql
-- Supabase SQL Editor에서 실행
UPDATE artworks 
SET price = '$50'  -- 원하는 달러 금액
WHERE id = 'your-artwork-id';
```

#### **옵션 2: 앱에서 입력**

작품 업로드 시 가격 입력:
```
예: 50 → 자동으로 $50.00으로 저장
```

### **추천 가격대**

```
🎨 Beginner: $10 - $30
🎨 Standard: $30 - $100
🎨 Premium: $100 - $500
🎨 Masterpiece: $500+
```

---

## 🌏 **배송비 설정**

현재 코드:
```typescript
const calculateShipping = (price: number) => {
  if (price >= 100) return 0;  // $100 이상 무료
  return 5;  // 기본 $5
};
```

**수정하려면:** `CheckoutScreenNew.tsx` 파일에서 함수 변경

---

## 🔧 **문제 해결**

### **1. "EXPO_PUBLIC_2CHECKOUT_ACCOUNT is undefined"**

```bash
# .env 파일 확인
# 앱 재시작
npm start -- --clear
```

### **2. "Navigation error: TwoCheckoutPayment not found"**

```typescript
// RootNavigator.tsx에 화면 추가 확인
<Stack.Screen name="TwoCheckoutPayment" component={TwoCheckoutPaymentScreen} />
```

### **3. "Transaction not found"**

```sql
-- Supabase에서 transactions 테이블 확인
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

### **4. 결제 버튼 클릭해도 안 넘어감**

```typescript
// CheckoutScreenNew.tsx에서 navigation.navigate 확인
// TwoCheckoutPaymentScreen이 import되었는지 확인
```

---

## 💡 **수수료 계산**

### **$100 작품 판매 시**

```
고객 결제: $100.00
배송비: $5.00
━━━━━━━━━━━━━━━━━━━━
총 결제액: $105.00

작품 가격: $100.00
플랫폼 수수료 (5%): -$5.00
2Checkout (3.5%): -$3.80
━━━━━━━━━━━━━━━━━━━━
판매자 수령: $91.20 (91.2%)
━━━━━━━━━━━━━━━━━━━━
한국 은행 입금: 약 118,560원
(환율 1,300원 기준)
```

---

## 🎯 **체크리스트**

```
□ 2Checkout 계정 생성
□ API 자격증명 발급
□ .env 파일에 API 키 추가
□ 네비게이션에 화면 추가
□ 앱 재시작 (캐시 클리어)
□ 테스트 카드로 결제 테스트
□ transactions 테이블 확인
□ 결제 완료 화면 확인
```

---

## 📊 **vs PayPal 비교**

| 항목 | 2Checkout | PayPal |
|------|-----------|--------|
| 수수료 | 3.5% + $0.30 | 4.4% + $0.30 |
| $100 작품 | **$91.20** | $90.30 |
| 차이 | **+$0.90** | - |
| 월 100개 | **+$90** | - |
| 설정 | ⭐⭐⭐ | ⭐⭐ |

**월 100개 팔면 $90 더 벌어요!** 💰

---

## 🚀 **다음 단계**

### **Phase 1: 테스트 (지금)**
```
✅ 테스트 카드로 결제
✅ 전체 플로우 확인
✅ 버그 수정
```

### **Phase 2: 실제 서비스 (승인 후)**
```
1. 2Checkout 사업자 인증
2. 한국 은행 계좌 연결
3. 라이브 모드 활성화
4. 실제 결제 테스트
```

### **Phase 3: 최적화 (나중에)**
```
- 여러 통화 지원 (KRW, JPY 등)
- 할부 지원
- 정기 결제 (프리미엄)
```

---

## 📚 **참고 문서**

- [2Checkout 공식 문서](https://www.2checkout.com/documentation/)
- [2Checkout API 레퍼런스](https://www.2checkout.com/documentation/api/)
- [WebView 문서](https://github.com/react-native-webview/react-native-webview)

---

## ✨ **축하합니다!**

**2Checkout 연동 완료!** 🎉

```
✅ 달러 시스템
✅ 글로벌 결제
✅ 저렴한 수수료
✅ 한국 은행 정산
```

**이제 테스트해보세요!** 🚀

문제가 있으면 언제든 물어보세요! 😊

---

## 🐛 **자주 발생하는 에러**

### **"Cannot find TwoCheckoutPaymentScreen"**
```
→ import 경로 확인
→ 파일명 확인 (대소문자)
```

### **"Transaction insert failed"**
```
→ FINAL-INSTALL.sql 실행 확인
→ transactions 테이블 존재 확인
```

### **"WebView not working"**
```
→ react-native-webview 설치 확인
→ 앱 재빌드 (expo run:ios or run:android)
```

---

**준비 완료!** 🎯

