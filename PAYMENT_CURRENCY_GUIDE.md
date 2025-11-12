# 💵 결제 & 정산 통화 가이드

## ⚠️ 핵심 제약사항

### **토스페이먼츠는 달러 정산 불가** ❌

```
❌ 불가능:
- 판매자에게 달러로 직접 정산
- 해외 계좌로 달러 송금
- 달러 보유 계좌

✅ 가능:
- 가격 표시: USD (예: $100)
- 결제: USD → KRW 자동 환율 적용
- 정산: KRW만 가능 (원화 계좌로 입금)
```

---

## 💰 실제 거래 흐름

### **시나리오: $100 작품 판매**

```
1. 앱에서 표시:
   Price: $100
   
2. 구매자 클릭 → 결제 페이지:
   Price: $100 (₩130,000)
   * 환율: 1 USD = ₩1,300 (예시)
   
3. 카드 결제:
   - 해외 카드: $100 청구
   - 국내 카드: ₩130,000 청구
   
4. 플랫폼 수령:
   ₩130,000 (원화로만 수령)
   
5. 수수료 차감:
   - 플랫폼 수수료: ₩13,000 (10%)
   - 결제 수수료: ₩4,290 (3.3%)
   
6. 판매자 정산:
   ₩112,710 (한국 계좌로 원화 입금)
   ≈ $86.70 (환율 1,300 기준)
   
❌ $90 직접 정산 불가!
```

---

## 📊 통화 옵션 비교

### **Option 1: 토스페이먼츠 (원화 정산)** ⭐ 추천

```
가격 표시: USD (국제적 appeal)
결제 화면: USD + KRW 병기
정산: KRW만

장점:
✅ 한국 1위 PG사 (신뢰도)
✅ 낮은 수수료 (3.3%)
✅ 빠른 정산 (D+3)
✅ 완벽한 한국어 지원
✅ 테스트 계정 즉시 사용

단점:
❌ 달러 정산 불가
❌ 환율 변동 리스크 (판매자 부담)

적합한 경우:
- 한국 기반 아티스트가 주 타겟
- 원화 계좌 보유
- 빠른 정산 원함
```

---

### **Option 2: PayPal (달러 정산 가능)**

```
가격 표시: USD
결제 화면: USD
정산: USD (PayPal 계좌)

장점:
✅ 달러로 직접 정산
✅ 글로벌 표준
✅ 190개국 지원
✅ 해외 계좌 가능

단점:
❌ 높은 수수료 (4.4% + $0.30)
❌ 느린 정산 (D+7~14)
❌ 한국에서 사용률 낮음
❌ PayPal 계좌 필요 (추가 단계)

적합한 경우:
- 해외 아티스트 많음
- 달러 직접 수령 필수
- 글로벌 확장 계획
```

---

### **Option 3: Stripe (달러 정산 가능, 하지만...)**

```
가격 표시: USD
결제 화면: USD
정산: USD

장점:
✅ 달러 정산
✅ 훌륭한 API
✅ 글로벌 표준

단점:
❌ 한국 계정 생성 불가
❌ 미국/싱가포르 법인 필요
❌ 복잡한 온보딩

적합한 경우:
- 해외 법인 보유
- 글로벌 기업
- (우리에겐 부적합)
```

---

## 🎯 우리의 선택: 토스페이먼츠 + USD 표시

### **전략:**

```
UI/UX:
- 가격 표시: USD (국제적 appeal)
- 설명: "₩130,000 (approximately)" 병기
- 구매 버튼: "Purchase for $100"

결제:
- 토스페이먼츠 SDK
- 자동 환율 적용
- 투명한 금액 표시

정산:
- KRW로 판매자 계좌 입금
- 정산 내역: "₩112,710 (from $100 sale)"
- 환율 정보 제공
```

---

## 💡 판매자에게 설명하는 방법

### **FAQ 예시:**

**Q: 가격을 달러로 표시하는데 왜 원화로 정산되나요?**

A: 
```
ArtYard는 글로벌 플랫폼을 지향하여 가격을 USD로 표시합니다.
하지만 정산은 한국 PG사(토스페이먼츠)를 통해 이루어지므로
원화로만 가능합니다.

예시:
- 판매 가격: $100
- 환율 적용: ₩130,000 (1 USD = ₩1,300)
- 플랫폼 수수료 (10%): ₩13,000
- 결제 수수료 (3.3%): ₩4,290
- 최종 정산: ₩112,710

* 환율은 결제 시점의 실시간 환율이 적용됩니다.
```

**Q: 달러로 직접 받을 수 있나요?**

A:
```
현재는 원화 정산만 가능합니다.

달러가 필요하시다면:
1. 원화로 정산 받기
2. 은행에서 달러로 환전
3. 또는 PayPal 등 해외 송금 서비스 이용

향후 글로벌 확장 시 달러 정산 옵션을 추가할 예정입니다.
```

---

## 🔧 개발 시 고려사항

### **UI 구현:**

```typescript
// ArtworkCard.tsx
<Text>
  ${artwork.price}
  <Text style={styles.krwHint}>
    (≈ ₩{(artwork.price * exchangeRate).toLocaleString()})
  </Text>
</Text>

// CheckoutScreen.tsx
<View>
  <Text>Total: ${totalAmount}</Text>
  <Text style={styles.exchangeInfo}>
    Exchange rate: 1 USD = ₩{exchangeRate}
    Final charge: ₩{(totalAmount * exchangeRate).toLocaleString()}
  </Text>
</View>
```

### **정산 계산:**

```typescript
// transactionService.ts
const calculatePayout = (usdAmount: number, exchangeRate: number) => {
  const krwAmount = usdAmount * exchangeRate;
  const platformFee = krwAmount * 0.10;
  const paymentFee = krwAmount * 0.033;
  const sellerAmount = krwAmount - platformFee - paymentFee;
  
  return {
    totalKRW: krwAmount,
    platformFee,
    paymentFee,
    sellerAmount,
    equivalentUSD: sellerAmount / exchangeRate,
  };
};
```

---

## 🎬 결론

### **최종 추천: 토스페이먼츠 + USD 표시** ⭐

```
이유:
✅ 한국 시장에 최적화
✅ 낮은 수수료 (3.3%)
✅ 빠른 정산 (D+3)
✅ 신뢰도 높음
✅ 테스트 쉬움

트레이드오프:
⚠️ 달러 직접 정산 불가
⚠️ 환율 변동 리스크

하지만:
- 대부분의 판매자는 한국 거주 대학생
- 원화 계좌 보유
- 환율 변동은 투명하게 안내
- 글로벌 확장 시 PayPal 추가 가능
```

---

## 📞 다음 액션

### **즉시:**
1. ✅ 팀/투자자에게 이 제약사항 공유
2. ✅ UI에 환율 정보 추가 계획
3. ✅ FAQ에 정산 통화 설명 추가

### **개발:**
1. 🔄 토스페이먼츠 SDK 통합
2. 🔄 실시간 환율 API 연동 (선택)
3. 🔄 정산 내역에 USD/KRW 병기

### **향후:**
1. 📋 글로벌 확장 시 PayPal 옵션 추가
2. 📋 달러 정산 요청 많으면 재검토
3. 📋 멀티 통화 지원 고려

---

**마지막 업데이트**: 2025-01-11  
**결정**: 토스페이먼츠 (KRW 정산) + USD 가격 표시

