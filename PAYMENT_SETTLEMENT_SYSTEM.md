# 💰 거래대금 & 정산 시스템 완전 가이드

## 📊 **시스템 개요**

### **핵심 구조:**

```
구매자 (Buyer)
    ↓ $100 결제
2Checkout (Payment Gateway)
    ↓ Webhook 호출
플랫폼 (ArtYard)
    ├─ 10% 수수료 ($10)
    └─ 90% 판매자 ($90)
판매자 (Seller)
```

---

## 🔢 **수수료 계산 로직**

### **calculateFees 함수:**

```typescript
// src/types/transaction.ts

export function calculateFees(
  salePrice: number,           // 판매 가격
  platformFeeRate: number = 0.10,  // 플랫폼 수수료율 (10%)
  paymentFeeRate: number = 0.035   // 결제 수수료율 (3.5%)
): FeeCalculation {
  const platform_fee = Math.round(salePrice * platformFeeRate);
  const seller_amount = salePrice - platform_fee;  // 판매자 90%
  const payment_fee = Math.round(salePrice * paymentFeeRate);  // 플랫폼 부담
  const platform_net = platform_fee - payment_fee;  // 플랫폼 실수령
  
  return {
    sale_price: salePrice,        // 판매 가격
    platform_fee_rate: 0.10,      // 10%
    platform_fee,                 // 플랫폼 수수료
    payment_fee_rate: 0.035,      // 3.5%
    payment_fee,                  // 결제 수수료
    seller_amount,                // 판매자 수령액 (90%)
    platform_net                  // 플랫폼 실수령 (6.5%)
  };
}
```

### **계산 예시:**

```typescript
// 예시: $100 작품 판매

const fees = calculateFees(100);

console.log({
  sale_price: $100,          // 판매가
  platform_fee: $10,         // 플랫폼 수수료 (10%)
  seller_amount: $90,        // 판매자 수령 (90%)
  payment_fee: $3.5,         // 결제 수수료 (3.5%, 플랫폼 부담)
  platform_net: $6.5         // 플랫폼 실수령 (6.5%)
});
```

---

## 💳 **구매자 결제 플로우**

### **1단계: 작품 선택 & 구매 클릭**

```typescript
// src/screens/ArtworkDetailScreen.tsx

<TouchableOpacity onPress={handlePurchase}>
  <Text>Purchase Artwork</Text>
</TouchableOpacity>
```

### **2단계: 연락처 정보 입력**

```typescript
// src/screens/CheckoutScreen.tsx

interface CheckoutInfo {
  contact_name: string;      // 이름
  contact_phone: string;     // 전화번호
  contact_address: string;   // 주소
  delivery_notes: string;    // 배송 요청사항
}
```

**왜 필요한가?**
- 2Checkout은 결제만 처리
- 배송은 판매자가 직접 진행
- 판매자에게 구매자 연락처 제공 필요

### **3단계: Transaction 생성**

```typescript
// src/services/transactionService.ts

export const createPaymentIntent = async (request: CreatePaymentRequest) => {
  // 1. 작품 정보 조회
  const artwork = await getArtwork(request.artwork_id);
  
  // 2. 가격 파싱
  const salePrice = parseInt(artwork.price); // $100
  
  // 3. 수수료 계산
  const fees = calculateFees(salePrice);
  // fees.seller_amount = $90
  
  // 4. Transaction 레코드 생성
  const transaction = await supabase.from('transactions').insert({
    artwork_id: artwork.id,
    buyer_id: user.id,
    seller_id: artwork.author_id,
    amount: salePrice,              // $100
    platform_fee: fees.platform_fee, // $10
    payment_fee: fees.payment_fee,   // $3.5
    seller_amount: fees.seller_amount, // $90
    status: 'pending',              // 결제 대기
    
    // 구매자 연락처 (판매자에게 전달용)
    buyer_name: request.contact_name,
    buyer_phone: request.contact_phone,
    buyer_address: request.contact_address,
    delivery_notes: request.delivery_notes,
  });
  
  return transaction.id;
};
```

### **4단계: 2Checkout 결제 페이지 이동**

```typescript
// src/services/paymentService.ts

export const create2CheckoutPayment = async (request: PaymentRequest) => {
  const paymentUrl = `https://www.2checkout.com/checkout/purchase?${params}`;
  
  // 앱에서 브라우저 열기
  await Linking.openURL(paymentUrl);
};
```

### **5단계: 구매자 카드 정보 입력**

```
2Checkout 페이지에서:
- 카드 번호
- 유효기간
- CVV
- 청구 주소

→ 2Checkout이 결제 처리
→ 결제 성공 시 Webhook 호출!
```

---

## 🔔 **Webhook 처리 (결제 완료)**

### **Webhook 플로우:**

```typescript
// supabase/functions/twocheckout-webhook/index.ts

Deno.serve(async (req) => {
  // 1. IPN 데이터 파싱
  const ipnData = await req.formData();
  
  const transactionId = ipnData.merchant_order_id; // UUID
  const saleId = ipnData.order_number;  // 2CO-12345
  const totalAmount = parseFloat(ipnData.invoice_list_amount); // $100
  const sellerId = ipnData.custom_field_1;
  const artworkId = ipnData.custom_field_2;
  const shippingAddress = {
    name: ipnData.ship_name,
    street: ipnData.ship_street_address,
    city: ipnData.ship_city,
    state: ipnData.ship_state,
    zip: ipnData.ship_zip,
    country: ipnData.ship_country,
  };
  
  // 2. Transaction 업데이트
  await supabase.from('transactions').update({
    status: 'paid',                    // pending → paid
    stripe_payment_intent_id: saleId,  // 2CO-12345
    paid_at: new Date().toISOString(),
  }).eq('id', transactionId);
  
  // 3. Artwork 상태 업데이트
  await supabase.from('artworks').update({
    sale_status: 'sold',               // available → sold
    sold_at: new Date().toISOString(),
    buyer_id: transaction.buyer_id,
  }).eq('id', artworkId);
  
  // 4. 판매자 정산 레코드 생성 ⭐
  const platformFee = totalAmount * 0.10;  // $10
  const sellerAmount = totalAmount - platformFee; // $90
  
  await supabase.from('seller_payouts').insert({
    seller_id: sellerId,
    transaction_id: transactionId,
    artwork_id: artworkId,
    total_amount: totalAmount,        // $100
    platform_fee: platformFee,        // $10
    seller_amount: sellerAmount,      // $90
    status: 'pending',                // 정산 대기
    shipping_address: shippingAddress, // 배송 주소
  });
  
  // 5. 판매자에게 알림
  await supabase.from('notifications').insert({
    user_id: sellerId,
    type: 'new_sale',
    title: 'New Order! 🎉',
    message: 'Your artwork has been sold.',
  });
});
```

---

## 💸 **판매자 정산 시스템**

### **seller_payouts 테이블 구조:**

```sql
CREATE TABLE seller_payouts (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  transaction_id UUID REFERENCES transactions(id),
  artwork_id UUID REFERENCES artworks(id),
  
  -- 금액
  total_amount DECIMAL(10, 2),    -- $100 (총 결제금액)
  platform_fee DECIMAL(10, 2),    -- $10 (플랫폼 수수료 10%)
  seller_amount DECIMAL(10, 2),   -- $90 (판매자 수령액 90%)
  
  -- 상태
  status TEXT DEFAULT 'pending',  -- pending / paid / failed
  
  -- 시간
  created_at TIMESTAMPTZ,         -- 정산 레코드 생성 시간
  paid_at TIMESTAMPTZ,            -- 실제 정산 완료 시간
  
  -- 배송 정보 (판매자에게 전달)
  shipping_address JSONB,         -- 구매자 배송 주소
  
  -- 판매자 계좌 정보 ⭐
  bank_info JSONB,                -- 판매자 은행 계좌
  
  -- 관리자 메모
  admin_notes TEXT
);
```

### **정산 레코드 예시:**

```json
{
  "id": "uuid-123",
  "seller_id": "artist-uuid",
  "transaction_id": "tx-uuid",
  "artwork_id": "artwork-uuid",
  "total_amount": 100.00,
  "platform_fee": 10.00,
  "seller_amount": 90.00,
  "status": "pending",
  "created_at": "2025-01-11T10:00:00Z",
  "paid_at": null,
  "shipping_address": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Seoul",
    "state": "Seoul",
    "zip": "06000",
    "country": "KR"
  },
  "bank_info": null,  // ⚠️ 아직 등록 안됨!
  "admin_notes": null
}
```

---

## 🏦 **판매자 계좌 등록 (현재 미구현!)**

### **현재 상태: ⚠️ 구현 안됨**

```
❌ 판매자 계좌 등록 화면 없음
❌ bank_info 필드 비어있음
❌ 자동 정산 불가

→ Admin이 수동으로 처리 중!
```

### **구현 필요 사항:**

#### **1. ProfileEditScreen에 계좌 정보 추가**

```typescript
// src/screens/ProfileEditScreen.tsx

interface BankInfo {
  bank_name: string;        // 은행명 (예: 국민은행)
  account_number: string;   // 계좌번호 (예: 123-45-67890)
  account_holder: string;   // 예금주 (본인 이름과 일치 확인)
}

const [bankInfo, setBankInfo] = useState<BankInfo>({
  bank_name: '',
  account_number: '',
  account_holder: '',
});

// UI
<View>
  <Text>Bank Account (For Payouts)</Text>
  <TextInput
    placeholder="Bank Name (e.g. KB Bank)"
    value={bankInfo.bank_name}
    onChangeText={(text) => setBankInfo({...bankInfo, bank_name: text})}
  />
  <TextInput
    placeholder="Account Number"
    value={bankInfo.account_number}
    onChangeText={(text) => setBankInfo({...bankInfo, account_number: text})}
  />
  <TextInput
    placeholder="Account Holder Name"
    value={bankInfo.account_holder}
    onChangeText={(text) => setBankInfo({...bankInfo, account_holder: text})}
  />
</View>

// 저장
await supabase.from('profiles').update({
  bank_info: bankInfo  // JSONB 형식으로 저장
}).eq('id', user.id);
```

#### **2. 정산 시 bank_info 자동 포함**

```typescript
// supabase/functions/twocheckout-webhook/index.ts

// 판매자 계좌 정보 조회
const { data: seller } = await supabase
  .from('profiles')
  .select('bank_info')
  .eq('id', sellerId)
  .single();

// Payout 레코드에 포함
await supabase.from('seller_payouts').insert({
  // ... 기존 필드들 ...
  bank_info: seller.bank_info,  // ✅ 판매자 계좌 자동 포함
});
```

#### **3. 정산 조회 화면 (판매자용)**

```typescript
// src/screens/MyPayoutsScreen.tsx (신규)

const PayoutsScreen = () => {
  const [payouts, setPayouts] = useState([]);
  
  useEffect(() => {
    fetchPayouts();
  }, []);
  
  const fetchPayouts = async () => {
    const { data } = await supabase
      .from('seller_payouts')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    
    setPayouts(data);
  };
  
  return (
    <FlatList
      data={payouts}
      renderItem={({ item }) => (
        <View>
          <Text>Transaction: {item.transaction_id}</Text>
          <Text>Amount: ${item.seller_amount}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Created: {item.created_at}</Text>
          {item.paid_at && (
            <Text>Paid: {item.paid_at}</Text>
          )}
        </View>
      )}
    />
  );
};
```

---

## 🎯 **정산 처리 프로세스**

### **현재 (수동 처리):**

```
1. 결제 완료
   ↓
2. seller_payouts 레코드 생성 (status: 'pending')
   ↓
3. Admin이 Supabase Dashboard에서 확인
   ↓
4. Admin이 판매자에게 직접 연락
   ↓
5. 판매자 계좌 정보 수집
   ↓
6. Admin이 수동으로 송금
   ↓
7. Admin이 status를 'paid'로 변경
   ↓
8. paid_at 시간 기록
```

### **미래 (자동 처리):**

```
1. 결제 완료
   ↓
2. seller_payouts 레코드 생성
   - bank_info 자동 포함 ✅
   ↓
3. Admin Dashboard에서 일괄 정산 버튼 클릭
   ↓
4. 은행 API 연동 (또는 CSV 다운로드)
   ↓
5. 자동 송금 (또는 일괄 이체)
   ↓
6. status 자동으로 'paid' 변경
   ↓
7. 판매자에게 알림
```

---

## 📋 **판매자 My Sales 화면**

### **현재 구현:**

```typescript
// src/screens/SalesScreen.tsx

const SalesScreen = () => {
  const [sales, setSales] = useState([]);
  
  const loadSales = async () => {
    const data = await getMySales();  // transactions 조회
    setSales(data);
  };
  
  return (
    <FlatList
      data={sales}
      renderItem={({ item }) => (
        <View>
          <Text>{item.artwork.title}</Text>
          <Text>${item.amount}</Text>
          <Text>Status: {item.status}</Text>
          
          {/* 구매자 정보 표시 */}
          <Text>Buyer: {item.buyer_name}</Text>
          <Text>Phone: {item.buyer_phone}</Text>
          <Text>Address: {item.buyer_address}</Text>
          
          {/* 배송 메모 */}
          <Text>Notes: {item.delivery_notes}</Text>
          
          {/* 채팅 버튼 */}
          <TouchableOpacity onPress={() => chatWithBuyer(item.buyer_id)}>
            <Text>Chat with Buyer</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};
```

---

## 💰 **정산 금액 계산 요약**

### **판매 가격: $100**

```
구매자 결제:        $100.00

플랫폼 수령:         $100.00
├─ 플랫폼 수수료:    -$10.00 (10%)
├─ 결제 수수료:     -$3.50 (3.5%, 플랫폼 부담)
└─ 플랫폼 실수령:    $6.50 (6.5%)

판매자 수령:        $90.00 (90%) ✅
```

### **누가 무엇을 내는가?**

```
구매자:
✅ 작품 가격 $100 결제
❌ 추가 수수료 없음

판매자:
✅ $90 수령 (90%)
❌ $10 플랫폼 수수료 (자동 차감)

플랫폼:
✅ $10 수수료 수령
❌ $3.5 결제 수수료 지불 (2Checkout에게)
✅ $6.5 실수령
```

---

## 🚨 **현재 미구현 기능**

### **1. 판매자 계좌 등록** ❌

```
위치: ProfileEditScreen
필요: Bank name, Account number, Account holder
저장: profiles.bank_info (JSONB)
```

### **2. 정산 조회 화면** ❌

```
위치: MyPayoutsScreen (신규)
기능: seller_payouts 조회
표시: 정산 금액, 상태, 날짜
```

### **3. Admin 정산 처리 화면** ❌

```
위치: AdminPayoutsScreen (신규)
기능: 
- pending payouts 목록
- 일괄 정산 버튼
- 개별 정산 처리
- status 업데이트
```

### **4. 자동 정산 시스템** ❌

```
방법 1: 은행 API 연동 (복잡)
방법 2: CSV 다운로드 후 일괄 이체
방법 3: 수동 처리 (현재)
```

---

## 🎯 **정산 시스템 개선 로드맵**

### **Phase 1: MVP (현재)** ✅

```
✅ 거래 생성
✅ 수수료 계산 (10%)
✅ Webhook 처리
✅ seller_payouts 레코드 생성
✅ Admin 수동 정산
```

### **Phase 2: 기본 자동화 (2-3주 후)**

```
🔄 판매자 계좌 등록 UI
🔄 정산 조회 화면
🔄 Admin 정산 대시보드
🔄 CSV 다운로드
```

### **Phase 3: 완전 자동화 (3-6개월 후)**

```
📋 은행 API 연동
📋 자동 송금
📋 정산 스케줄 (주간/월간)
📋 세금 계산서 발행
```

---

## 📞 **요약**

### **구매자 플로우:**

```
1. 작품 선택
2. 연락처 입력
3. $100 결제
4. 구매 완료!
```

### **판매자 플로우:**

```
1. 작품 등록
2. 구매자 결제 ($100)
3. Webhook → seller_payouts 생성
4. $90 정산 대기 (status: 'pending')
5. Admin이 수동 정산
6. 판매자 계좌로 $90 입금
7. status → 'paid'
```

### **Admin 플로우:**

```
1. Supabase Dashboard 접속
2. seller_payouts 테이블 확인
3. status='pending' 레코드 조회
4. 판매자에게 연락 (계좌 확인)
5. 수동 송금 ($90)
6. status를 'paid'로 변경
7. paid_at 시간 기록
```

---

## 🔧 **구현 필요 작업**

### **즉시:**

```
❌ ProfileEditScreen: 계좌 등록 UI
❌ MyPayoutsScreen: 정산 조회 화면
```

### **추후:**

```
📋 AdminPayoutsScreen: Admin 정산 대시보드
📋 은행 API 연동 또는 CSV 다운로드
📋 자동 정산 스케줄링
```

---

**현재는 Admin 수동 정산으로 운영하고, 서비스 성장 후 자동화 진행!** ✅

