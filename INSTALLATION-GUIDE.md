# 🚀 ArtYard 완전한 시스템 설치 가이드

## 📦 **1단계: 패키지 설치**

### **Stripe React Native 설치**
```bash
npm install @stripe/stripe-react-native
```

### **Daum 우편번호 API (선택)**
```bash
npm install react-native-daum-postcode
npm install react-native-webview
```

---

## 🗄️ **2단계: DB 스키마 적용**

### **Supabase SQL Editor에서 실행**
```bash
1. Supabase Dashboard → SQL Editor 열기
2. complete-system-schema.sql 파일 내용 복사
3. "Run" 클릭
4. 완료! 🎉
```

**생성된 테이블:**
- ✅ shipping_addresses (배송지)
- ✅ artwork_shipping_settings (배송 설정)
- ✅ transactions (거래)
- ✅ transaction_history (거래 이력)
- ✅ payouts (정산)
- ✅ transaction_reviews (리뷰)
- ✅ challenges (챌린지)
- ✅ challenge_entries (챌린지 참여)
- ✅ artist_analytics (작가 통계)
- ✅ artwork_views (조회 기록)

---

## 🔑 **3단계: Stripe 설정**

### **Stripe 계정 생성**
1. [stripe.com](https://stripe.com) 가입
2. Dashboard → API Keys 복사
   - Publishable key
   - Secret key

### **.env 파일에 추가**
```env
# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🏗️ **4단계: Supabase Edge Function 배포**

### **create-payment-intent 함수 생성**

#### **1. Supabase CLI 설치**
```bash
npm install -g supabase
supabase login
```

#### **2. 프로젝트 초기화**
```bash
supabase init
```

#### **3. Edge Function 생성**
```bash
supabase functions new create-payment-intent
```

#### **4. 함수 코드 작성**

**supabase/functions/create-payment-intent/index.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, metadata } = await req.json()

    // Payment Intent 생성
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    })

    return new Response(
      JSON.stringify({
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

#### **5. 함수 배포**
```bash
supabase functions deploy create-payment-intent --no-verify-jwt

# Secret 설정
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

---

## ⚙️ **5단계: App.tsx 업데이트**

**App.tsx:**
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <RootNavigator />
        <DebugLogger />
      </QueryClientProvider>
    </StripeProvider>
  );
}
```

---

## 🧪 **6단계: 테스트**

### **Stripe 테스트 카드**
```
카드 번호: 4242 4242 4242 4242
유효기간: 12/34
CVC: 123
우편번호: 12345
```

### **테스트 시나리오**
```
1. ✅ 작품 선택
2. ✅ 배송지 입력
3. ✅ 결제 (테스트 카드)
4. ✅ 주문 확인
5. ✅ 판매자: 송장 입력
6. ✅ 구매자: 수령 확인
7. ✅ 리뷰 작성
```

---

## 📱 **7단계: 네비게이션 업데이트**

**src/navigation/TabNavigator.tsx에 추가:**
```typescript
<Tab.Screen 
  name="Orders" 
  component={OrdersScreen}
  options={{
    title: '주문',
    tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
  }}
/>

<Tab.Screen 
  name="Challenges" 
  component={ChallengesScreen}
  options={{
    title: '챌린지',
    tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
  }}
/>

<Tab.Screen 
  name="Dashboard" 
  component={ArtistDashboardScreen}
  options={{
    title: '대시보드',
    tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
  }}
/>
```

---

## ✅ **설치 완료!**

이제 다음 기능들을 사용할 수 있습니다:

### **결제 시스템**
- ✅ Stripe 카드 결제
- ✅ 에스크로 (7일)
- ✅ 자동 정산

### **배송 시스템**
- ✅ 배송지 관리
- ✅ 송장 번호 추적
- ✅ 배송 상태 알림

### **리뷰 시스템**
- ✅ 5점 평점
- ✅ 세부 평점
- ✅ 이미지 첨부
- ✅ 자동 평균 계산

### **Challenge 시스템**
- ✅ 주간/월간 챌린지
- ✅ 투표 (좋아요)
- ✅ 우승자 선정
- ✅ 배지

### **작가 대시보드**
- ✅ 조회수 통계
- ✅ 판매 통계
- ✅ 인게이지먼트 분석
- ✅ 트렌드 차트

---

## 🐛 **문제 해결**

### **Stripe 연결 실패**
```bash
# API Key 확인
echo $EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Edge Function 로그 확인
supabase functions logs create-payment-intent
```

### **DB 오류**
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'transactions';

-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 📚 **추가 자료**

- [Stripe React Native 문서](https://stripe.com/docs/mobile/react-native)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Navigation](https://reactnavigation.org/)

---

**모든 준비 완료! 🎉**

