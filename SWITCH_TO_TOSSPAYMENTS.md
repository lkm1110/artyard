# 🚀 2Checkout → 토스페이먼츠 전환 가이드

## ⚠️ 상황

**2Checkout 거부 이유:**
- 개인 사업자 미지원 (법인 필요)
- 한국 사업자 검증 실패
- 제품/서비스 검토 실패

**영향:**
- Demo 계정만 사용 가능
- 실제 결제 불가
- Empty cart 발생

---

## ✅ 토스페이먼츠 (추천!)

### **왜 토스페이먼츠?**

```
✅ 한국 1위 PG사
✅ 개인 사업자 지원
✅ 글로벌 결제 지원 (Visa, Mastercard, AMEX)
✅ 테스트 계정 즉시 사용 가능 (사업자 없이도!)
✅ React Native SDK 제공
✅ 완벽한 문서 (한국어)
✅ 빠른 지원
✅ 낮은 수수료 (3.3%)

❌ 2Checkout:
  - 한국 개인 사업자 거부
  - 높은 수수료 (3.9% + $0.30)
  - 복잡한 ConvertPlus
  - 느린 검증 (2-3주)
```

---

## 📋 토스페이먼츠 통합 계획

### **Phase 1: 테스트 계정 (지금!)** ⏱️ 30분

```
1. 토스페이먼츠 개발자 계정 생성
   https://developers.tosspayments.com/
   
2. 테스트 API 키 발급 (즉시!)
   - Client Key (공개)
   - Secret Key (비밀)
   
3. 코드 수정
   - paymentService.ts 교체
   - 토스페이먼츠 SDK 연동
   
4. 테스트 카드로 결제 테스트
   - 카드번호: 4330-1234-1234-1234
   - 유효기간: 12/25
   - CVV: 123
   
5. 완벽하게 작동! ✅
```

### **Phase 2: 실제 서비스 (나중에)** ⏱️ 1-2주

```
1. 사업자 등록
2. 토스페이먼츠 사업자 계약
3. Production API 키 발급
4. 실제 카드 결제
5. 정산 계좌 등록
```

---

## 💻 코드 변경 사항

### **1. 패키지 설치**

```bash
npm install @tosspayments/payment-sdk
```

### **2. paymentService.ts 교체**

```typescript
// src/services/paymentService.ts
import { loadTossPayments } from '@tosspayments/payment-sdk';

const clientKey = process.env.EXPO_PUBLIC_TOSSPAYMENTS_CLIENT_KEY!;

export const create2CheckoutPayment = async (request: PaymentRequest) => {
  try {
    // 토스페이먼츠 SDK 로드
    const tossPayments = await loadTossPayments(clientKey);
    
    // 결제창 호출
    await tossPayments.requestPayment('카드', {
      amount: request.amount,
      orderId: request.transaction_id,
      orderName: request.artwork_title,
      customerName: request.buyer_name,
      customerEmail: request.buyer_email,
      successUrl: `artyard://payment-success?txId=${request.transaction_id}`,
      failUrl: `artyard://payment-fail?txId=${request.transaction_id}`,
    });
    
    console.log('✅ Toss payment initiated');
    
    return {
      payment_url: '', // Not needed for Toss (SDK handles it)
      order_reference: request.transaction_id,
    };
  } catch (error) {
    console.error('❌ Toss payment error:', error);
    throw error;
  }
};
```

### **3. Webhook 교체**

```typescript
// supabase/functions/tosspayments-webhook/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  try {
    const { orderId, paymentKey, amount } = await req.json();
    
    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = Deno.env.get('TOSSPAYMENTS_SECRET_KEY')!;
    const authorization = btoa(`${secretKey}:`);
    
    const confirmResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authorization}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentKey,
          amount,
        }),
      }
    );
    
    if (!confirmResponse.ok) {
      throw new Error('Payment confirmation failed');
    }
    
    // DB 업데이트 (기존 로직 동일)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Transaction 업데이트
    await supabase
      .from('transactions')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentKey,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    
    // 2. Artwork 업데이트
    const { data: transaction } = await supabase
      .from('transactions')
      .select('artwork_id, seller_id, amount, buyer_id')
      .eq('id', orderId)
      .single();
    
    await supabase
      .from('artworks')
      .update({
        sale_status: 'sold',
        sold_at: new Date().toISOString(),
        buyer_id: transaction.buyer_id,
      })
      .eq('id', transaction.artwork_id);
    
    // 3. Seller Payout 생성
    const platformFee = transaction.amount * 0.10;
    const sellerAmount = transaction.amount - platformFee;
    
    await supabase.from('seller_payouts').insert({
      seller_id: transaction.seller_id,
      transaction_id: orderId,
      artwork_id: transaction.artwork_id,
      total_amount: transaction.amount,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      status: 'pending',
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### **4. 환경 변수 추가**

```bash
# .env
EXPO_PUBLIC_TOSSPAYMENTS_CLIENT_KEY=test_ck_...

# Supabase Secrets (Dashboard에서 설정)
TOSSPAYMENTS_SECRET_KEY=test_sk_...
```

---

## 🧪 테스트 방법

### **1. 토스페이먼츠 계정 생성**
https://developers.tosspayments.com/

### **2. 테스트 키 발급**
- Dashboard → API 키 → 테스트 키 복사

### **3. 앱에서 결제 테스트**
- 테스트 카드: 4330-1234-1234-1234
- 유효기간: 12/25
- CVV: 123
- 비밀번호 앞 2자리: 12

### **4. 결제 성공 확인**
- Webhook 호출됨 ✅
- Transaction status = 'paid' ✅
- Artwork sale_status = 'sold' ✅
- Seller Payout 생성됨 ✅

---

## 💰 비용 비교

### 토스페이먼츠
```
국내 카드: 3.3%
해외 카드: 3.6% + $0.30
정산 주기: D+3 (빠름!)
```

### 2Checkout (사용 불가)
```
모든 카드: 3.9% + $0.30
정산 주기: D+14
+ 한국 개인 사업자 거부 ❌
```

---

## 🎯 액션 플랜 (오늘 할 일)

### **즉시 (30분):**
```
1. ✅ DB 데이터 정리 (restore-test-data.sql 실행)
2. ✅ Chat with Artist 테스트 (수동 transaction 생성)
3. ⏸️ 2Checkout 개발 중단
```

### **이번 주 (3시간):**
```
1. 🔄 토스페이먼츠 계정 생성
2. 🔄 paymentService.ts 교체
3. 🔄 Webhook 구현
4. 🔄 테스트 카드로 결제 테스트
5. 🔄 iOS/Android 빌드
```

### **다음 주 (서비스 오픈 전):**
```
1. 📋 사업자 등록
2. 📋 토스페이먼츠 사업자 계약
3. 📋 Production 키 발급
4. 📋 실제 카드 테스트
5. 📋 정산 계좌 등록
```

---

## 🤔 FAQ

### Q: 개인 사업자 없이도 개발 가능?
A: **네!** 토스페이먼츠는 테스트 계정만으로 전체 기능 개발/테스트 가능합니다.

### Q: 2Checkout 코드는 버려야 하나요?
A: 네, 전면 교체가 필요합니다. 하지만 webhook 로직은 거의 동일합니다.

### Q: 글로벌 결제도 가능한가요?
A: 네, Visa/Mastercard/AMEX 모두 지원합니다.

### Q: 수수료가 더 저렴하네요?
A: 네! 3.3% vs 3.9% + $0.30 (2Checkout)

### Q: 얼마나 걸리나요?
A: 테스트 환경: 3시간, 실제 서비스: 사업자 등록 후 1주일

---

## 🔗 유용한 링크

- 토스페이먼츠 개발자센터: https://developers.tosspayments.com/
- React Native 가이드: https://docs.tosspayments.com/guides/react-native
- API 문서: https://docs.tosspayments.com/reference
- 테스트 카드: https://docs.tosspayments.com/guides/test-card

---

## 💪 결론

**2Checkout 거부는 오히려 기회입니다!**

✅ 토스페이먼츠가 훨씬 낫습니다:
- 더 저렴 (3.3% vs 3.9%)
- 더 빠름 (D+3 vs D+14)
- 더 쉬움 (한국어 문서)
- 더 안정적 (한국 1위)

**지금 바로 시작하세요!** 🚀

