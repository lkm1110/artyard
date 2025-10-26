# 💳 Stripe 5분 설정 가이드

## ✅ **완료된 것**
- ✅ App.tsx 업데이트 (StripeProvider 추가됨!)
- ✅ 코드 준비 완료

## 🚀 **지금 해야 할 것**

---

## 1️⃣ **Stripe 패키지 설치**

### **터미널에서 실행**
```bash
npm install @stripe/stripe-react-native
```

---

## 2️⃣ **Stripe 계정 & API 키**

### **1. 회원가입**
```
https://stripe.com
→ Sign up
→ 이메일, 비밀번호
```

### **2. API 키 복사**
```
Dashboard → Developers → API keys

✅ Publishable key: pk_test_51...
✅ Secret key: sk_test_51... (Reveal test key 클릭)
```

---

## 3️⃣ **환경변수 설정**

### **프로젝트 루트에 `.env` 파일 생성**

```env
# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_여기에_붙여넣기

# Supabase (기존)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**중요:** `.env` 파일은 `.gitignore`에 추가되어 있어야 합니다!

---

## 4️⃣ **Supabase Edge Function 생성** ⭐

### **옵션 1: Supabase Dashboard (간단)**

```
1. Supabase Dashboard → Edge Functions
2. "New Function" 클릭
3. 함수 이름: create-payment-intent
4. 아래 코드 붙여넣기:
```

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, metadata } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'krw',
      automatic_payment_methods: { enabled: true },
      metadata,
    })

    return new Response(
      JSON.stringify({
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

```
5. "Deploy" 클릭
6. Secrets → Add new secret
   - Name: STRIPE_SECRET_KEY
   - Value: sk_test_... (비밀 키)
7. "Save" 클릭
```

### **옵션 2: CLI (고급)**

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# Edge Function 생성
supabase functions new create-payment-intent

# 위 코드를 supabase/functions/create-payment-intent/index.ts에 붙여넣기

# 배포
supabase functions deploy create-payment-intent

# Secret 설정
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

---

## 5️⃣ **테스트**

### **1. 앱 재시작**
```bash
# 캐시 클리어
npm start -- --clear

# 또는
npx expo start -c
```

### **2. 테스트 결제**
```
CheckoutScreen에서 테스트 카드 사용:

카드 번호: 4242 4242 4242 4242
유효기간: 12/34
CVC: 123
우편번호: 12345
```

### **3. 확인**
```
✅ 결제 성공 메시지
✅ Stripe Dashboard에서 결제 기록 확인
✅ Supabase transactions 테이블에 데이터 확인
```

---

## 🎯 **체크리스트**

```
□ npm install @stripe/stripe-react-native
□ Stripe 계정 생성
□ API 키 복사
□ .env 파일에 EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY 추가
□ Supabase Edge Function 배포
□ STRIPE_SECRET_KEY Secret 추가
□ 앱 재시작
□ 테스트 결제
```

---

## 🐛 **문제 해결**

### **1. "publishableKey is required"**
```
→ .env 파일에 EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY 확인
→ 앱 재시작 (npm start -- --clear)
```

### **2. Edge Function 호출 실패**
```
→ Supabase Dashboard → Edge Functions → Logs 확인
→ STRIPE_SECRET_KEY Secret이 설정되어 있는지 확인
```

### **3. 결제 실패**
```
→ Stripe Dashboard → Logs 확인
→ 테스트 카드 번호 확인 (4242...)
→ 금액이 너무 적지 않은지 확인 (최소 50원)
```

---

## 🎁 **추가 테스트 카드**

```
성공: 4242 4242 4242 4242
거부: 4000 0000 0000 0002
인증 필요: 4000 0027 6000 3184
잔액 부족: 4000 0000 0000 9995
```

---

## ✅ **완료!**

이제 다음을 할 수 있습니다:
- ✅ 작품 구매
- ✅ Stripe 결제
- ✅ 에스크로 (안전 거래)
- ✅ 자동 정산

---

## 📚 **참고 문서**

- [Stripe React Native 문서](https://stripe.com/docs/mobile/react-native)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe 테스트 카드](https://stripe.com/docs/testing)

---

**준비 완료!** 🚀

문제가 있으면 알려주세요! 😊

