# 💳 결제 & 배송 시스템 완벽 가이드

## 📋 목차
1. [전체 플로우](#전체-플로우)
2. [Stripe vs 다른 결제](#stripe-비교)
3. [주소 관리](#주소-관리)
4. [플랫폼 수수료](#플랫폼-수수료)
5. [배송 책임](#배송-책임)
6. [실제 구현](#실제-구현)

---

## 🔄 전체 플로우

### **구매자 관점**
```
1. 작품 보기 → "구매하기" 버튼 클릭
   ↓
2. 배송지 입력/선택
   ├─ 기존 주소 선택
   └─ 새 주소 입력
   ↓
3. 결제 정보 입력 (Stripe)
   ├─ 카드 번호
   ├─ 유효기간
   └─ CVC
   ↓
4. 주문 확인 & 결제
   ┌──────────────────────┐
   │ 주문 요약             │
   │ ─────────────────── │
   │ 작품 가격: 50,000원  │
   │ 플랫폼 수수료: 0원   │  ← 구매자는 안 냄!
   │ 배송비: 3,000원      │
   │ ─────────────────── │
   │ 총 결제액: 53,000원  │
   └──────────────────────┘
   ↓
5. 결제 완료! 🎉
   - 돈은 에스크로(중간 보관)
   - 판매자에게 알림
   ↓
6. 판매자가 배송
   - 송장 번호 입력
   - 배송 추적 가능
   ↓
7. 배송 완료!
   - "수령 확인" 버튼 활성화
   - 7일 후 자동 확인
   ↓
8. 수령 확인 클릭
   - 판매자에게 정산!
   - 리뷰 작성 가능
```

### **판매자 관점**
```
1. 작품 업로드
   ↓
2. 구매자가 주문!
   - 푸시 알림 받음
   - "새 주문 있음" 표시
   ↓
3. 주문 확인
   ┌──────────────────────┐
   │ 새 주문 📦           │
   │ ─────────────────── │
   │ 작품: 봄 일러스트     │
   │ 구매자: 김철수       │
   │ 금액: 50,000원       │
   │ ─────────────────── │
   │ 배송지:              │
   │ 서울시 강남구...     │
   │ 010-1234-5678       │
   └──────────────────────┘
   ↓
4. 배송 준비
   - 작품 포장
   - 택배사에 발송
   ↓
5. 송장 번호 입력
   - "배송 시작" 버튼
   - 송장 번호: 123456789
   - 택배사: 우체국택배
   ↓
6. 배송 중...
   - 구매자가 추적 가능
   ↓
7. 배송 완료!
   - 구매자 수령 확인 대기
   - 7일 후 자동 확인
   ↓
8. 정산 완료! 💰
   ┌──────────────────────┐
   │ 정산 내역            │
   │ ─────────────────── │
   │ 작품 가격: 50,000원  │
   │ 플랫폼 수수료: -5,000원 (10%)
   │ Stripe 수수료: -1,750원
   │ ─────────────────── │
   │ 수령액: 43,250원     │
   └──────────────────────┘
   - 3-5일 내 계좌 입금
```

---

## 💳 Stripe vs 다른 결제 비교

### **글로벌 결제 시장 점유율**
```
1위: Stripe (40%) 🥇
   - Amazon, Google, Shopify, Uber, Lyft
   - Notion, Figma, GitHub, Discord
   - 200만+ 기업 사용

2위: PayPal (25%) 🥈
   - eBay, Airbnb

3위: Square (15%) 🥉
   - 오프라인 결제 강세

4위: Adyen (10%)
   - Spotify, Netflix

5위: 기타 (10%)
```

### **Stripe가 좋은 이유**
```typescript
✅ 개발자 친화적
   - React Native 공식 라이브러리
   - 문서 최고 수준
   - 3시간이면 구현 완료

✅ 기능 완벽
   - 에스크로 자동
   - 환불 한 줄로 가능
   - 정산 자동화
   - 사기 방지 AI 내장

✅ 안정성
   - 99.99% 가동률
   - 대기업들이 쓰는 이유

✅ 확장성
   - 전 세계 135개국 지원
   - 한국 카드도 됨
   - 나중에 해외 진출 쉬움

❌ 단점
   - 수수료 약간 높음 (2.9% + 300원)
   - 카드만 지원 (계좌이체 X)
```

### **다른 옵션들**
```typescript
// Toss Payments (한국)
✅ 카드 + 계좌이체 + 간편결제
✅ 수수료 낮음 (2.7%)
❌ 한국만 가능
❌ React Native 라이브러리 없음 (WebView 사용)

// PayPal
✅ 전 세계 사용
❌ 한국 사용자 거의 안 씀 (5%)
❌ 수수료 높음 (3.6% + 고정 수수료)
❌ 복잡함

// Iamport (아임포트)
✅ 20개+ 결제사 통합
❌ 중간 업체 (수수료 추가)
❌ 설정 복잡
```

### **🎯 추천 전략**
```
Phase 1 (지금): Stripe만
   - 빠른 구현
   - 안정적
   - 국제 사용자도 OK

Phase 2 (6개월 후): Toss 추가
   - 한국 사용자 많아지면
   - 계좌이체/간편결제 추가
   - 결제 수단 선택 화면 추가
```

---

## 📬 주소 관리 시스템

### **주소 입력 UX (최고의 방법)**

#### **방법 1: 우편번호 API 사용** ⭐ **추천!**
```typescript
// Daum 우편번호 API (무료!)
import DaumPostcode from 'react-native-daum-postcode';

const AddressInputScreen = () => {
  const [showPostcode, setShowPostcode] = useState(false);
  
  return (
    <View>
      <TextInput
        placeholder="우편번호"
        value={postalCode}
        editable={false}
      />
      <Button 
        title="주소 찾기" 
        onPress={() => setShowPostcode(true)} 
      />
      
      {showPostcode && (
        <DaumPostcode
          onSelected={(data) => {
            setPostalCode(data.zonecode);
            setAddress(data.address);
            setShowPostcode(false);
          }}
        />
      )}
      
      <TextInput
        placeholder="기본 주소"
        value={address}
        editable={false}
      />
      
      <TextInput
        placeholder="상세 주소 (동/호수)"
        value={addressDetail}
        onChangeText={setAddressDetail}
      />
    </View>
  );
};
```

**장점**:
- ✅ 사용자 편함 (한국인 익숙함)
- ✅ 정확함
- ✅ 빠름

#### **방법 2: GPS 기반** (부가 기능)
```typescript
// 현재 위치 기반 주소 자동 입력
import * as Location from 'expo-location';

const getCurrentAddress = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  
  const location = await Location.getCurrentPositionAsync({});
  const address = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
  
  // 자동 입력!
  setAddress(address[0].street);
  setCity(address[0].city);
};
```

### **배송지 관리 화면 구조**
```
MyAddressesScreen.tsx
┌──────────────────────────┐
│ 내 배송지 관리            │
├──────────────────────────┤
│                          │
│ ✅ 기본 배송지           │
│ ┌────────────────────┐  │
│ │ 김철수               │  │
│ │ 010-1234-5678       │  │
│ │ 서울시 강남구...     │  │
│ │ [수정] [삭제]       │  │
│ └────────────────────┘  │
│                          │
│ 다른 배송지              │
│ ┌────────────────────┐  │
│ │ 회사                │  │
│ │ 서울시 종로구...     │  │
│ │ [기본으로 설정]     │  │
│ └────────────────────┘  │
│                          │
│ [+ 새 배송지 추가]       │
│                          │
└──────────────────────────┘
```

---

## 💰 플랫폼 수수료 구조

### **일반적인 마켓플레이스 수수료**
```
Etsy: 6.5% (수공예품)
Depop: 10% (의류)
Mercari: 10% (중고)
Craigslist: 무료 (직거래만)

아트 플랫폼:
- Artsy: 15-20%
- Saatchi Art: 35% 😱
- Redbubble: 20%
```

### **🎯 ArtYard 추천 수수료: 10%**

**이유**:
```
✅ 경쟁력 있음 (Artsy보다 낮음)
✅ 학생들에게 부담 적음
✅ 플랫폼 운영 가능
```

### **수수료 계산 예시**
```typescript
작품 가격: 50,000원
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 구매자 결제
   작품 가격: 50,000원
   배송비: 3,000원
   ─────────────────────
   총 결제액: 53,000원 💳

2. 에스크로 보관
   50,000원 보관 중... 🏦

3. 배송 완료 후 정산
   작품 가격: 50,000원
   - 플랫폼 수수료 (10%): -5,000원
   - Stripe 수수료 (2.9%): -1,450원
   - Stripe 고정 수수료: -300원
   ─────────────────────
   판매자 수령액: 43,250원 💰

4. 배송비
   배송비: 3,000원
   - 우체국 실제 비용: -2,500원
   ─────────────────────
   플랫폼 수익: 500원
```

### **누가 수수료를 내나요?**

#### **옵션 A: 판매자가 다 냄** ⭐ **추천!**
```
구매자: 50,000원만 냄
판매자: 43,250원 받음 (수수료 제외)

장점:
✅ 구매자 입장에서 간단
✅ 가격 투명
✅ 대부분의 플랫폼이 이렇게 함

단점:
❌ 판매자가 가격을 높게 책정할 수 있음
```

#### **옵션 B: 나눠서 냄**
```
구매자: 52,500원 냄 (2,500원 추가)
판매자: 45,000원 받음 (5,000원 차감)

장점:
✅ 공평함
✅ 판매자 부담 적음

단점:
❌ 복잡함
❌ 구매자가 불편해함
```

---

## 🚚 배송 책임 & 보호 시스템

### **Q: 배송 중 파손되면 누구 책임?**

#### **일반적인 방법: 단계별 책임**
```
1. 발송 전
   └─ 판매자 책임 100%

2. 배송 중
   └─ 택배사 책임
   └─ 보험 필수!

3. 배송 완료 후
   └─ 구매자 책임

단, 플랫폼은 중재자 역할!
```

### **보호 시스템 설계**

#### **1. 에스크로 (중간 보관)**
```typescript
// 돈의 흐름
구매자 결제
   ↓
Stripe 에스크로 (7-14일 보관)
   ↓
구매자 "수령 확인" 클릭
   ↓
판매자에게 정산

// 만약 문제가 있다면?
구매자: "분쟁 제기" 클릭
   ↓
플랫폼 관리자 조사
   ↓
판정:
  - 판매자 잘못 → 환불
  - 택배사 잘못 → 보험 청구
  - 구매자 잘못 → 판매자 정산
```

#### **2. 배송 보험**
```
모든 거래에 배송 보험 의무화!

우체국 택배:
- 5만원까지 무료 보험
- 50만원까지 2,000원 추가

CJ대한통운:
- 5만원까지 무료
- 100만원까지 3,000원 추가

→ 플랫폼이 자동으로 보험 추가
→ 파손 시 보험금 청구
```

#### **3. 증거 요구**
```typescript
// 판매자 발송 시
- 📸 포장 사진 필수
- 📦 무게/크기 기록
- 📄 송장 번호 필수

// 구매자 수령 시 파손 발견
- 📸 파손 사진 필수
- 📦 박스 개봉 전 사진
- ⏰ 24시간 내 신고

→ 증거 없으면 분쟁 불가
```

#### **4. 자동 확인 시스템**
```
배송 완료 후 7일 동안:
- 구매자: 문제 신고 가능
- 판매자: 돈 못 받음 (에스크로)

7일 후:
- 자동으로 "수령 확인"
- 판매자에게 정산

→ 구매자 보호 + 판매자 보호
```

---

## 💡 실제 구현 예시

### **화면 구조**
```
src/screens/
  checkout/
    - CheckoutScreen.tsx           # 주문 결제
    - AddressSelectScreen.tsx      # 배송지 선택
    - AddressFormScreen.tsx        # 배송지 입력
    - PaymentMethodScreen.tsx      # 결제 수단
    - OrderConfirmScreen.tsx       # 주문 완료
  
  orders/
    - OrdersScreen.tsx             # 내 주문 목록
    - OrderDetailScreen.tsx        # 주문 상세
    - TrackingScreen.tsx           # 배송 추적
    - ReviewScreen.tsx             # 리뷰 작성
  
  sales/
    - SalesScreen.tsx              # 내 판매 목록
    - SaleDetailScreen.tsx         # 판매 상세
    - ShippingInputScreen.tsx      # 송장 입력
    - PayoutScreen.tsx             # 정산 내역

src/services/
  - transactionService.ts          # 거래 API
  - shippingService.ts             # 배송 API
  - paymentService.ts              # Stripe 연동
  - reviewService.ts               # 리뷰 API
```

### **결제 플로우 코드**
```typescript
// src/services/paymentService.ts
import { stripe } from '@stripe/stripe-react-native';
import { supabase } from './supabase';

export const createPaymentIntent = async (
  artworkId: string,
  shippingAddressId: string
): Promise<{ clientSecret: string; transactionId: string }> => {
  
  // 1. 작품 정보 가져오기
  const { data: artwork } = await supabase
    .from('artworks')
    .select('*, author:profiles(*)')
    .eq('id', artworkId)
    .single();
  
  if (!artwork) throw new Error('작품을 찾을 수 없습니다');
  
  // 2. 배송지 가져오기
  const { data: address } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('id', shippingAddressId)
    .single();
  
  if (!address) throw new Error('배송지를 찾을 수 없습니다');
  
  // 3. 수수료 계산
  const artworkPrice = parseInt(artwork.price.replace(/\D/g, ''));
  const platformFee = Math.round(artworkPrice * 0.1); // 10%
  const sellerAmount = artworkPrice - platformFee;
  
  // 4. Stripe Payment Intent 생성 (백엔드 API 호출)
  const response = await fetch('https://your-backend.com/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: artworkPrice,
      currency: 'krw',
      metadata: {
        artwork_id: artworkId,
        seller_id: artwork.author_id,
      }
    })
  });
  
  const { clientSecret, paymentIntentId } = await response.json();
  
  // 5. Transaction 레코드 생성
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      artwork_id: artworkId,
      buyer_id: (await supabase.auth.getUser()).data.user!.id,
      seller_id: artwork.author_id,
      amount: artworkPrice,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      payment_method: 'stripe_card',
      stripe_payment_intent_id: paymentIntentId,
      status: 'pending',
      
      // 배송 주소 스냅샷
      shipping_recipient: address.recipient_name,
      shipping_phone: address.phone,
      shipping_postal_code: address.postal_code,
      shipping_address: address.address,
      shipping_address_detail: address.address_detail,
      shipping_memo: address.delivery_memo,
    })
    .select()
    .single();
  
  return {
    clientSecret,
    transactionId: transaction!.id
  };
};

// 결제 확인
export const confirmPayment = async (
  clientSecret: string,
  transactionId: string
): Promise<boolean> => {
  
  // Stripe 결제 실행
  const { error } = await stripe.confirmPayment(clientSecret, {
    paymentMethodType: 'Card',
  });
  
  if (error) {
    console.error('결제 실패:', error);
    return false;
  }
  
  // Transaction 상태 업데이트
  await supabase
    .from('transactions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', transactionId);
  
  // 판매자에게 알림
  await supabase
    .from('notifications')
    .insert({
      user_id: seller_id,
      type: 'new_sale',
      title: '새로운 주문이 있습니다! 🎉',
      message: `${artwork.title} 작품이 판매되었습니다.`,
      link: `/sales/${transactionId}`,
    });
  
  return true;
};
```

### **사용 예시**
```typescript
// CheckoutScreen.tsx
const CheckoutScreen = ({ route }) => {
  const { artworkId } = route.params;
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // 1. Payment Intent 생성
      const { clientSecret, transactionId } = await createPaymentIntent(
        artworkId,
        selectedAddressId
      );
      
      // 2. 결제 UI 표시
      const { error } = await stripe.presentPaymentSheet({
        clientSecret,
      });
      
      if (error) {
        Alert.alert('결제 실패', error.message);
        return;
      }
      
      // 3. 결제 확인
      const success = await confirmPayment(clientSecret, transactionId);
      
      if (success) {
        Alert.alert('결제 완료! 🎉', '주문이 접수되었습니다.');
        navigation.navigate('OrderDetail', { id: transactionId });
      }
      
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View>
      {/* 주문 요약 */}
      <OrderSummary artwork={artwork} />
      
      {/* 배송지 */}
      <AddressSelector
        selectedId={selectedAddressId}
        onSelect={setSelectedAddressId}
      />
      
      {/* 결제 버튼 */}
      <Button
        title={loading ? '처리 중...' : '결제하기'}
        onPress={handleCheckout}
        disabled={loading}
      />
    </View>
  );
};
```

---

## 🎯 핵심 요약

### **✅ 결제**
- Stripe 사용 (국제적으로 가장 많이 씀)
- 10% 플랫폼 수수료 (판매자 부담)
- 에스크로로 안전 거래

### **✅ 주소**
- Daum 우편번호 API 사용
- 여러 배송지 저장 가능
- 기본 배송지 설정

### **✅ 수수료**
```
플랫폼 수수료: 10% (판매자 부담)
Stripe 수수료: 2.9% + 300원 (판매자 부담)
━━━━━━━━━━━━━━━━━━━━━━━━━━
판매자 실수령: 약 86.5%
```

### **✅ 배송 책임**
- 에스크로 (7일)
- 배송 보험 의무
- 증거 사진 필수
- 플랫폼이 중재

---

## 🚀 다음 단계

지금 바로 구현하시겠어요?

1. **DB 테이블 생성** (shipping-address-schema.sql)
2. **Stripe 연동** (1-2일)
3. **주소 입력 화면** (반나절)
4. **결제 플로우** (2-3일)

**시작할까요?** 🎨

