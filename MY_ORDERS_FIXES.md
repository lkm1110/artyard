# My Orders 문제 해결 가이드

## 🔧 수정 사항

### 1. Contact Information (구매 시 연락처) ✅

**Q: Contact Information이 필요한가요? 2Checkout에서 수집하는데?**

**A: 네, 필요합니다!**

```
✅ 2Checkout의 역할:
   - 결제 처리만 담당
   - 배송 정보를 수집하지만 판매자에게 직접 전달하지 않음

✅ Contact Information의 역할:
   - 판매자가 구매자와 직접 소통
   - 배송 상세 조율 (시간, 방법 등)
   - 긴급 연락용
   - 맞춤 포장, 특별 요청 처리
```

**수집되는 정보:**
- Name (이름)
- Phone (전화번호)  
- Address (주소)
- Delivery Notes (배송 요청사항)

**판매자에게 전달:**
- My Sales 화면에서 구매자 정보 확인 가능
- Chat으로 직접 소통 가능

---

### 2. 중복 데이터 제거 ✅

**문제:** DB에 실제로 중복 레코드가 존재

**해결:**

#### A. SQL로 중복 제거 (즉시 실행)

```sql
-- 1. Supabase Dashboard 접속
-- https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/editor

-- 2. SQL Editor에서 실행
-- database/remove-duplicate-transactions.sql 파일 내용 복사

-- 3. Run 클릭

-- 4. 결과 확인
-- "DELETE X" 메시지 → X개의 중복 레코드 삭제됨
```

#### B. 앱 코드 (자동 필터링)

이미 구현됨:
- `OrdersScreen.tsx`: ID 기준 중복 제거
- `SalesScreen.tsx`: ID 기준 중복 제거
- 디버그 로그 추가: 제거된 중복 개수 표시

---

### 3. "Unknown User" 문제 ✅

**문제:** "Chat with Artist" 클릭 → "Unknown user"

**원인:**
- seller_id가 비어있거나
- seller profile이 로드되지 않음

**해결:**
- `handleChatWithSeller`에 유효성 검사 추가
- 디버그 로그 추가: seller_id 확인
- seller_id가 없으면 에러 메시지 표시

---

## 🧪 테스트 방법

### 1단계: DB 중복 제거

```bash
# Supabase Dashboard 열기
https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/editor

# SQL Editor → New query → 복사 & 실행
# database/remove-duplicate-transactions.sql
```

### 2단계: 앱 재시작

```bash
# 터미널에서
npm start -- --clear
```

### 3단계: My Orders 확인

1. My Orders 화면으로 이동
2. **터미널 로그 확인:**
   ```
   LOG 📦 Total orders fetched: 10
   LOG 📦 Unique orders: 10
   LOG 📦 Removed duplicates: 0  ← 0이면 중복 없음!
   
   LOG 📦 Order item: {
     id: "...",
     artwork_title: "kuku",
     seller_id: "...",  ← 이게 있는지 확인!
     status: "paid",
     has_seller: true   ← true여야 함!
   }
   ```

3. "Chat with Artist" 버튼 클릭
4. **터미널 로그:**
   ```
   LOG 💬 Chat with seller clicked: [seller_id]
   ```
   
   - seller_id가 출력되면 → ✅ 정상
   - "❌ Seller ID is missing!" 에러 → ❌ 문제 있음

---

## 📋 FAQ

### Q1: Contact Information을 선택 사항으로 만들 수 있나요?

A: 가능하지만 비추천합니다.
- 판매자가 구매자에게 연락할 방법이 없음
- 배송 문제 발생 시 해결 불가
- 맞춤 서비스 제공 불가

**권장:** 필수 항목으로 유지

---

### Q2: 중복 데이터는 왜 생겼나요?

A: 여러 원인이 있을 수 있습니다:
- 결제 재시도
- 네트워크 오류로 인한 중복 요청
- 앱 재시작 후 동일 구매

**방지책:** 
- 이미 코드에서 중복 필터링 구현됨
- DB에서 UNIQUE constraint 추가 가능

---

### Q3: "Unknown user"가 계속 나오면?

A: 터미널 로그를 확인하세요:

```
LOG 📦 Order item: {
  seller_id: undefined  ← 문제!
  has_seller: false     ← 문제!
}

LOG 💬 Chat with seller clicked: undefined
ERROR ❌ Seller ID is missing!
```

**해결:**
1. Transaction이 seller 정보를 제대로 로드하는지 확인
2. `getMyOrders()` 함수의 `.select()` 쿼리 확인
3. seller profile이 실제로 존재하는지 확인

---

## 🎯 기대 효과

✅ 중복 데이터 제거 → 깔끔한 UI
✅ Chat 버튼 정상 작동 → 원활한 소통
✅ Contact Information → 배송 문제 최소화
✅ 디버그 로그 → 빠른 문제 파악

---

## 🔗 관련 파일

- `database/remove-duplicate-transactions.sql` - 중복 제거 SQL
- `src/screens/OrdersScreen.tsx` - My Orders 화면
- `src/screens/SalesScreen.tsx` - My Sales 화면
- `src/services/transactionService.ts` - Transaction 서비스

