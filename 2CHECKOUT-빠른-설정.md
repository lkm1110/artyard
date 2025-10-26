# 🚀 2Checkout 5분 빠른 설정 가이드

## ✅ **1단계: Product 추가** (2분)

### 현재 화면에서:
1. **"+ Add product"** 버튼 클릭
2. 아래 정보 입력:

```yaml
📋 필수 정보:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product name: "ArtYard Artwork"
Product code: "ARTYARD_ART"
Product type: "Regular" 선택
Price: $1.00 (테스트용, 실제는 동적 설정)
Currency: USD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 선택 정보:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description: "Artwork purchase on ArtYard"
Category: "Digital Goods" 또는 "Art"
Image: (선택사항, 나중에 추가 가능)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

3. **"Save"** 클릭

### 💡 왜 $1.00?
```
실제 결제 시 백엔드에서 가격을 동적으로 변경합니다!
이건 그냥 기본 템플릿일 뿐입니다.
```

---

## ✅ **2단계: API Credentials** (1분)

### 경로:
```
Dashboard → Setup → Integrations & API → API
```

### 받을 정보:
1. **Merchant Code** (또는 Account ID)
   - 예: `250622123456`
   
2. **Secret Key** (또는 Secret Word)
   - 예: `SECRET_WORD_abc123`
   
3. **Publishable Key** (있으면)
   - 예: `pk_test_abc123xyz`

### .env 파일에 저장:
```bash
# 프로젝트 루트에 .env 파일 생성/수정
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=250622123456
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=SECRET_WORD_abc123
```

---

## ✅ **3단계: Return URLs** (1분)

### 경로:
```
Dashboard → Setup → Ordering Options → Return URLs
```

### 입력할 URL들:
```yaml
Success URL (결제 성공):
  artyard://payment-success

Cancel URL (결제 취소):
  artyard://payment-cancel

Decline URL (결제 실패):
  artyard://payment-decline
```

### 💡 왜 이렇게?
```
artyard:// = 앱으로 돌아오는 딥링크
→ 결제 후 자동으로 앱이 열립니다!
```

---

## ✅ **4단계: Payment Methods** (1분)

### 경로:
```
Dashboard → Setup → Payment Methods
```

### 활성화할 것들:
- ✅ **Credit Card** (필수!)
  - Visa
  - Mastercard
  - American Express
  
- ✅ **PayPal** (선택, 하면 좋음)
- ✅ **Apple Pay** (선택)
- ✅ **Google Pay** (선택)

### 최소한:
```
Credit Card만 켜면 됩니다!
```

---

## 🎯 **테스트 모드 활성화**

### 경로:
```
Dashboard → Setup → General Settings
```

### 설정:
```yaml
Test Mode: ON ✅
  → 실제 결제 안 됨
  → 개발/테스트용

Production Mode: OFF
  → 나중에 출시 시 ON
```

### 테스트 카드:
```
카드 번호: 4111 1111 1111 1111
CVV: 123
만료일: 12/25 (미래 날짜 아무거나)
```

---

## ✅ **완료 체크리스트**

### 필수 (지금 바로):
- [ ] Product 1개 추가 완료
- [ ] API Credentials 받아서 .env에 저장
- [ ] Return URLs 설정 완료
- [ ] Credit Card 활성화
- [ ] Test Mode ON

### 선택 (나중에):
- [ ] Webhooks 설정 (자동 알림)
- [ ] PayPal 추가
- [ ] Tax 설정
- [ ] Fulfillment 자동화

---

## 🚀 **이제 할 일**

### 1. 환경변수 확인:
```bash
# .env 파일 확인
cat .env
```

### 2. 앱 재시작:
```bash
npm start
```

### 3. 테스트:
```
1. 앱에서 작품 선택
2. "Purchase" 버튼 클릭
3. CheckoutScreen → TwoCheckoutPaymentScreen 이동
4. 테스트 카드로 결제
5. 앱으로 돌아오기 확인
```

---

## ⚠️ **주의사항**

### Test Mode에서:
```
✅ 실제 돈 안 나감
✅ 무제한 테스트 가능
✅ 테스트 카드만 사용

❌ 실제 고객은 결제 못함
```

### Production Mode로 전환 시:
```
1. 사업자 정보 입력 완료
2. 은행 계좌 연결
3. 신원 확인 (KYC) 완료
4. Test Mode OFF
5. Production Mode ON
```

---

## 🆘 **문제 해결**

### "API Key가 안 보여요"
```
→ Setup → Integrations → API
→ "Generate New API Key" 클릭
```

### "Return URL이 작동 안 해요"
```
→ app.json에 scheme 확인:
  "scheme": "artyard"
```

### "결제 페이지가 안 열려요"
```
→ .env 파일 확인
→ 앱 재시작 (Expo Go 완전 종료 후)
```

---

## 📞 **도움이 필요하면**

### 2Checkout 지원:
```
Email: support@2checkout.com
Docs: https://knowledgecenter.2checkout.com/
```

### 코드 문제:
```
→ 저한테 물어보세요! 😊
```

---

## ✨ **다음 단계**

### 설정 완료 후:
1. ✅ 테스트 결제 해보기
2. ✅ Webhooks 추가 (자동화)
3. ✅ Production 준비
4. ✅ 실제 출시!

---

**5분이면 끝납니다! 화이팅! 🚀**

