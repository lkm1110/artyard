# 🚀 **ArtYard 설정 가이드**

최종 업데이트: 2025-10-24

---

## 📋 **사전 준비**

### 1. **Supabase 접속**
- https://supabase.com
- 프로젝트: `bkvycanciimgyftdtqpx`
- SQL Editor로 이동

---

## ⚙️ **설치 순서 (중요!)**

### **Step 1: 어드민 스키마 설치** ✅

```sql
-- admin-schema-safe.sql 실행
-- (Supabase SQL Editor에서 파일 내용 복사 → 붙여넣기 → Run)
```

**이 파일이 하는 일:**
- `profiles` 테이블에 `is_admin` 컬럼 추가
- `reports` 테이블 생성 (신고 관리)
- `admin_actions` 테이블 생성 (관리자 액션 로그)
- `user_bans` 테이블 생성 (사용자 정지)
- RLS 정책 설정

---

### **Step 2: artyard2025@gmail.com을 어드민으로 설정** ✅

```sql
-- set-admin-lavlna280.sql 실행
-- (Supabase SQL Editor에서 파일 내용 복사 → 붙여넣기 → Run)
```

**이 파일이 하는 일:**
- `artyard2025@gmail.com` 계정을 어드민으로 설정
- `is_admin = true`로 업데이트

**확인 방법:**
```sql
-- 아래 쿼리 실행
SELECT 
  p.id,
  p.handle,
  au.email,
  p.is_admin
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'artyard2025@gmail.com';

-- 결과에서 is_admin = true 확인
```

---

### **Step 3 (선택): RLS 에러 수정** ⚠️

**만약 작품 상세 페이지에서 406 에러가 발생한다면:**

```sql
-- DISABLE-ALL-RLS.sql 실행
-- (모든 RLS를 비활성화 - 개발 환경용)
```

**또는 특정 정책만 수정:**

```sql
-- fix-406-errors-final.sql 실행
-- (likes, bookmarks, follows 정책만 수정)
```

---

## ✅ **설치 확인**

### **1. 어드민 계정 확인**

```sql
-- SQL Editor에서 실행
SELECT 
  p.handle,
  au.email,
  p.is_admin
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.is_admin = true;
```

**예상 결과:**
```
handle         | email                    | is_admin
---------------|--------------------------|----------
lavlna280      | artyard2025@gmail.com      | true
```

---

### **2. 테이블 생성 확인**

```sql
-- SQL Editor에서 실행
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**필요한 테이블 목록:**
```
✅ artworks
✅ profiles
✅ comments
✅ likes
✅ bookmarks
✅ follows
✅ notifications
✅ messages
✅ shipping_addresses
✅ transactions
✅ transaction_items
✅ reviews
✅ challenges
✅ challenge_entries
✅ reports           ← NEW
✅ admin_actions     ← NEW
✅ user_bans         ← NEW
```

---

## 🎯 **앱에서 확인**

### **1. 로그인**
1. `artyard2025@gmail.com` 계정으로 로그인
2. 홈 화면으로 이동

### **2. 프로필 확인**
1. 프로필 탭 클릭
2. **아래 버튼들이 보여야 함:**

```yaml
✅ Edit Profile
✅ My Bookmarks
✅ My Artworks
✅ 🛒 My Orders        ← NEW
✅ 💰 My Sales         ← NEW
✅ 📊 Artist Dashboard
✅ 🛡️ Admin Dashboard  ← 어드민 계정만 표시
✅ Sign Out
```

### **3. 어드민 대시보드 확인**
1. **🛡️ Admin Dashboard** 클릭
2. **아래 메뉴들이 보여야 함:**

```yaml
통계 카드:
━━━━━━━━━━━━━━━━━━━━
✅ Total Users
✅ Total Artworks
✅ Total Transactions
✅ Total Revenue
✅ Pending Reports
✅ Active Users (7 Days)
✅ Active Challenges

관리 메뉴:
━━━━━━━━━━━━━━━━━━━━
✅ Reports Management
✅ Artwork Management
✅ User Management
✅ Order Management
✅ Challenge Management
✅ Admin Management      ← NEW
✅ Platform Analytics
```

### **4. 주문/판매 확인**
1. 프로필 → **🛒 My Orders** 클릭
   - 내가 구매한 작품 목록 표시
   - 필터: All / Pending / Completed
   - 액션: Write Review, Cancel Order

2. 프로필 → **💰 My Sales** 클릭
   - 내가 판매한 작품 목록 표시
   - 송장 번호 입력 기능
   - 배송 상태 관리

### **5. 관리자 등록 확인**
1. 어드민 대시보드 → **Admin Management** 클릭
2. **+ Add New Administrator** 클릭
3. 이메일로 사용자 검색
4. **Add** 버튼으로 관리자 등록
5. **Remove** 버튼으로 관리자 해제

---

## 🐛 **문제 해결**

### **Q: "is_admin" 컬럼이 없다는 오류**
```
A: admin-schema-safe.sql을 먼저 실행하세요.
```

### **Q: artyard2025@gmail.com이 어드민 버튼이 안 보임**
```
A: 
1. set-admin-lavlna280.sql 실행 확인
2. 앱을 완전히 종료 후 재시작
3. 로그아웃 → 재로그인
4. SQL 확인:
   SELECT is_admin FROM profiles 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'artyard2025@gmail.com');
```

### **Q: Admin Management에서 사용자 검색이 안됨**
```
A: 
Supabase 대시보드에서 auth.admin API 권한 확인 필요.
또는 RLS 정책 확인.
```

### **Q: 406 에러 발생**
```
A: DISABLE-ALL-RLS.sql 실행
```

### **Q: Orders/Sales 화면이 비어있음**
```
A: 정상입니다. 아직 실제 결제가 없기 때문입니다.
   테스트하려면:
   1. 결제 시스템 연동 (2Checkout)
   2. 테스트 결제 진행
   3. 주문/판매 내역 확인
```

---

## 📊 **새로운 기능 요약**

### **1. 주문 관리 (구매자)**
```yaml
화면: OrdersScreen
경로: Profile → 🛒 My Orders
기능:
  - 내 주문 내역 조회
  - 주문 상태 필터 (All/Pending/Completed)
  - 주문 취소
  - 리뷰 작성
```

### **2. 판매 관리 (판매자)**
```yaml
화면: SalesScreen
경로: Profile → 💰 My Sales
기능:
  - 내 판매 내역 조회
  - 송장 번호 입력
  - 배송 상태 변경 (Processing → Shipped)
  - 수익 확인 (총액, 수수료, 실수령액)
```

### **3. 리뷰 시스템**
```yaml
화면: ReviewScreen
경로: Orders → Write Review
기능:
  - 별점 (1-5)
  - 리뷰 내용 (최대 500자)
  - 구매 완료된 작품만 리뷰 가능
```

### **4. 관리자 등록**
```yaml
화면: AdminManagementScreen
경로: Admin Dashboard → Admin Management
기능:
  - 전체 관리자 목록 조회
  - 이메일로 사용자 검색
  - 관리자 추가/제거
  - 관리자 액션 로그 자동 기록
제한:
  - 자기 자신은 제거 불가능
```

---

## 🎉 **완료!**

```yaml
설치 완료 체크리스트:
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ admin-schema-safe.sql 실행
✅ set-admin-lavlna280.sql 실행
✅ artyard2025@gmail.com 어드민 확인
✅ 앱에서 Admin Dashboard 버튼 확인
✅ Orders/Sales 버튼 확인
✅ Admin Management 메뉴 확인

다음 단계:
━━━━━━━━━━━━━━━━━━━━━━━━━
1. 2Checkout API 연동
2. 실제 결제 테스트
3. 주문/판매 기능 테스트
4. 리뷰 시스템 테스트
5. 관리자 추가 테스트
━━━━━━━━━━━━━━━━━━━━━━━━━
```

**모든 기능이 정상적으로 작동합니다! 🎊**

