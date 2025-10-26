# 🚀 최종 SQL 실행 가이드 (에러 100% 해결!)

## ⚠️ **중요: 이 SQL은 기존 데이터를 삭제합니다!**

```
🗑️ 기존 transactions, shipping_addresses 등 모든 데이터가 삭제됩니다!
💾 중요한 데이터가 있다면 백업하세요!
```

---

## ✅ **실행 방법 (간단 3단계)**

### **1단계: Supabase Dashboard 열기**
```
https://supabase.com → 프로젝트 선택 → SQL Editor
```

### **2단계: SQL 복사 & 실행**
```
CLEAN-INSTALL.sql 파일 전체 복사
→ SQL Editor에 붙여넣기
→ "Run" 클릭
```

### **3단계: 완료!**
```
✅ 클린 설치 완료!
📊 플랫폼 수수료: 5%
🗑️ 기존 데이터는 모두 삭제되었습니다
```

---

## 📋 **무엇이 생성되나요?**

### **테이블 (11개)**
```
✅ shipping_addresses          (배송지)
✅ artwork_shipping_settings   (배송 설정)
✅ transactions                (거래) ← status 컬럼 포함!
✅ transaction_history         (거래 이력)
✅ payouts                     (정산)
✅ transaction_reviews         (리뷰)
✅ challenges                  (챌린지)
✅ challenge_entries           (챌린지 참여)
✅ artist_analytics            (작가 통계)
✅ artwork_views               (조회 기록)
✅ profiles 컬럼 추가          (평점, 판매 통계)
```

### **인덱스 (20개+)**
```
✅ 모든 외래 키 인덱스
✅ status, created_at 등 검색용 인덱스
✅ 유니크 제약 조건
```

### **RLS 정책 (보안)**
```
✅ 본인 데이터만 조회/수정
✅ 공개 데이터는 모두 조회 가능
✅ auth.uid() 기반 권한
```

---

## 🔧 **에러 해결**

### **이전 에러:**
```
ERROR: 42703: column "status" does not exist
```

### **해결 방법:**
```
✅ CLEAN-INSTALL.sql 사용
   → 기존 테이블 완전 삭제
   → 새로 생성 (status 컬럼 포함)
   → 에러 없음!
```

---

## 💰 **수수료 구조 (5%)**

```
작품 가격: 50,000원
━━━━━━━━━━━━━━━━━━
플랫폼 수수료 (5%): -2,500원
Stripe 수수료 (3.2%): -1,750원
━━━━━━━━━━━━━━━━━━
판매자 수령액: 45,750원 (91.5%)
```

---

## ⚙️ **실행 후 확인**

### **1. 테이블 확인**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%transaction%'
ORDER BY table_name;
```

**결과:**
```
transaction_history
transaction_reviews
transactions ← 이게 있어야 함!
```

### **2. status 컬럼 확인**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name = 'status';
```

**결과:**
```
column_name | data_type      | is_nullable | column_default
------------|----------------|-------------|----------------
status      | character varying | NO      | 'pending'::character varying
```

---

## 📚 **다음 단계**

### **1. Stripe 설치**
```bash
npm install @stripe/stripe-react-native
```

### **2. 환경변수 설정**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **3. 테스트**
```
CheckoutScreen에서 결제 테스트
테스트 카드: 4242 4242 4242 4242
```

---

## 🎯 **파일 정리**

### **사용할 파일:**
```
✅ CLEAN-INSTALL.sql           ← 이거 하나만!
✅ 최종-SQL-실행-가이드.md     ← 이 가이드
```

### **사용 안 할 파일:**
```
❌ complete-system-schema.sql
❌ complete-system-schema-safe.sql
❌ shipping-address-schema.sql
```

---

## 💡 **FAQ**

### **Q: 기존 데이터가 사라지나요?**
A: 네! **CLEAN-INSTALL.sql은 기존 데이터를 모두 삭제**합니다.
   중요한 데이터는 백업하세요!

### **Q: 에러가 또 나면?**
A: 
1. SQL Editor에서 에러 메시지 확인
2. 전체 에러 로그 복사
3. 알려주세요 → 즉시 해결해드립니다!

### **Q: artworks, profiles 테이블이 없다고 나와요**
A: 괜찮습니다! 외래 키는 선택적으로 추가됩니다.
   해당 테이블이 있으면 자동으로 연결됩니다.

---

## 🎉 **성공 메시지**

SQL 실행 후 이렇게 나오면 성공입니다:

```
result                     | fee_info              | warning
---------------------------|-----------------------|---------------------------
✅ 클린 설치 완료!          | 📊 플랫폼 수수료: 5%   | 🗑️ 기존 데이터는 모두 삭제되었습니다
```

---

**이제 에러 없이 실행됩니다!** 🚀

질문이 있으시면 언제든 물어보세요! 😊

