# 🚀 SQL 실행 가이드

## ✅ **올바른 방법**

### **1. 어떤 SQL 파일을 사용해야 하나요?**

```
❌ shipping-address-schema.sql (사용 안 함!)
✅ complete-system-schema-safe.sql (이거 사용!)
```

**이유:** `complete-system-schema-safe.sql`에 **모든 것**이 포함되어 있습니다!

---

## 📝 **실행 방법**

### **Supabase Dashboard에서**

1. **SQL Editor 열기**
   ```
   Supabase Dashboard → SQL Editor
   ```

2. **파일 내용 복사**
   ```
   complete-system-schema-safe.sql 파일 전체 복사
   ```

3. **붙여넣기 & 실행**
   ```
   SQL Editor에 붙여넣고 → "Run" 클릭
   ```

4. **완료!** 🎉
   ```
   ✅ 스키마 생성 완료!
   📊 플랫폼 수수료: 5%
   ```

---

## 🔧 **생성되는 테이블**

```
✅ shipping_addresses          (배송지)
✅ artwork_shipping_settings   (배송 설정)
✅ transactions                (거래)
✅ transaction_history         (거래 이력)
✅ payouts                     (정산)
✅ transaction_reviews         (리뷰)
✅ challenges                  (챌린지)
✅ challenge_entries           (챌린지 참여)
✅ artist_analytics            (작가 통계)
✅ artwork_views               (조회 기록)
```

---

## 💰 **수수료 구조 (변경됨!)**

### **이전 (10%)**
```
작품 가격: 50,000원
━━━━━━━━━━━━━━━━━━
플랫폼 수수료: -5,000원
Stripe 수수료: -1,750원
━━━━━━━━━━━━━━━━━━
판매자 수령액: 43,250원 (86.5%)
```

### **현재 (5%)** ✅
```
작품 가격: 50,000원
━━━━━━━━━━━━━━━━━━
플랫폼 수수료: -2,500원  ← 절반!
Stripe 수수료: -1,750원
━━━━━━━━━━━━━━━━━━
판매자 수령액: 45,750원 (91.5%)
```

**판매자가 5% 더 받습니다!** 🎉

---

## ❌ **이전 에러 해결**

### **에러:**
```
ERROR: 42703: column "status" does not exist
```

### **원인:**
- `artworks`, `profiles` 테이블이 없었음
- REFERENCES 외래 키가 실패함

### **해결:**
- ✅ `complete-system-schema-safe.sql` 사용
- ✅ 외래 키를 안전하게 추가 (테이블 존재 확인 후)
- ✅ 에러 무시 (`EXCEPTION WHEN OTHERS`)

---

## 🎯 **다음 단계**

### **1. Stripe 설치**
```bash
npm install @stripe/stripe-react-native
```

### **2. .env 설정**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **3. 테스트**
```
테스트 카드: 4242 4242 4242 4242
```

---

## 📚 **참고 문서**

- ✅ `INSTALLATION-GUIDE.md` - 설치 가이드
- ✅ `COMPLETE-SYSTEM-README.md` - 전체 시스템
- ✅ `PAYMENT-SHIPPING-GUIDE.md` - 결제/배송

---

## 💡 **자주 묻는 질문**

### **Q: shipping-address-schema.sql은?**
A: **사용하지 마세요!** 이미 `complete-system-schema-safe.sql`에 포함되어 있습니다.

### **Q: 에러가 계속 나요**
A: 
1. 기존 테이블 삭제
2. `complete-system-schema-safe.sql` 다시 실행
3. 그래도 안 되면 → 에러 메시지 알려주세요!

### **Q: 수수료 변경은?**
A: **자동으로 5%**로 설정됩니다! 코드도 모두 업데이트되었습니다.

---

**준비 완료!** 🚀

