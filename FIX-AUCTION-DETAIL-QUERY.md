# 🔧 Auction Detail 쿼리 에러 해결

## 🚨 발생한 에러

```
ERROR: Could not embed because more than one relationship was found 
for 'auction_items' and 'profiles'
```

---

## 🔍 문제 원인

### **auction_items 테이블 구조:**
```sql
auction_items
├── artist_id      → profiles (FK)
├── buyer_id       → profiles (FK)
└── highest_bidder_id → profiles (FK)
```

**문제**: 하나의 테이블에서 같은 테이블(`profiles`)을 여러 번 참조하고 있음!

### **모호한 쿼리:**
```typescript
artist:profiles(*)  ← 어떤 FK를 사용할지 모호함!
```

Supabase가 어떤 관계를 사용할지 알 수 없어서 에러 발생

---

## ✅ 해결 방법

### **명시적으로 Foreign Key 지정:**

```typescript
// Before (모호함)
artist:profiles(*)

// After (명확함)
artist:profiles!auction_items_artist_id_fkey(*)
```

---

## 🔧 수정된 코드

### **AuctionDetailScreen.tsx**

```typescript
// Before
const { data: itemsData, error: itemsError } = await supabase
  .from('auction_items')
  .select(`
    *,
    artwork:artworks(*),
    artist:profiles(*)  ← 모호!
  `)
  .eq('auction_id', auctionId);

// After
const { data: itemsData, error: itemsError } = await supabase
  .from('auction_items')
  .select(`
    *,
    artwork:artworks(*),
    artist:profiles!auction_items_artist_id_fkey(*)  ← 명확!
  `)
  .eq('auction_id', auctionId);
```

---

## 📊 Foreign Key 이름 규칙

### **Supabase에서 자동 생성된 FK 이름:**

```
{table_name}_{column_name}_fkey

예시:
- auction_items_artist_id_fkey
- auction_items_buyer_id_fkey
- auction_items_highest_bidder_id_fkey
```

---

## 🎯 여러 관계를 모두 가져오려면?

### **방법 1: 각각 명시**

```typescript
const { data } = await supabase
  .from('auction_items')
  .select(`
    *,
    artist:profiles!auction_items_artist_id_fkey(*),
    buyer:profiles!auction_items_buyer_id_fkey(*),
    highest_bidder:profiles!auction_items_highest_bidder_id_fkey(*)
  `);
```

### **방법 2: 필요한 것만 가져오기 (권장)**

```typescript
// 현재 우리가 사용하는 방법
const { data } = await supabase
  .from('auction_items')
  .select(`
    *,
    artwork:artworks(*),
    artist:profiles!auction_items_artist_id_fkey(*)
  `);
```

---

## 🔍 다른 Foreign Key 확인 방법

### **Supabase SQL Editor에서 확인:**

```sql
-- Foreign Key 목록 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'auction_items';
```

**결과:**
```
constraint_name                          | column_name        | foreign_table
-----------------------------------------|--------------------|--------------
auction_items_artist_id_fkey             | artist_id          | profiles
auction_items_buyer_id_fkey              | buyer_id           | profiles
auction_items_highest_bidder_id_fkey     | highest_bidder_id  | profiles
auction_items_artwork_id_fkey            | artwork_id         | artworks
auction_items_auction_id_fkey            | auction_id         | challenge_auctions
```

---

## 📋 체크리스트

### **수정 완료:**
- [x] AuctionDetailScreen 쿼리 수정
- [x] `artist:profiles!auction_items_artist_id_fkey(*)` 명시
- [x] 에러 해결

### **추가로 확인할 곳:**
- [ ] AuctionsScreen에도 같은 에러 있는지 확인
- [ ] Admin AuctionManagementScreen 확인
- [ ] 다른 auction 관련 쿼리 확인

---

## 🚀 테스트

### **1. 경매 상세 화면 열기**
```
Challenges → 🔨 Auctions → 경매 선택
```

### **2. 정상 작동 확인**
- ✅ 경매 정보 로딩
- ✅ 작품 목록 표시
- ✅ 작가 정보 표시
- ✅ 에러 없음!

---

## 🎉 완료!

### **해결됨:**
- ✅ Foreign Key 모호성 제거
- ✅ 명시적 관계 지정
- ✅ 경매 상세 화면 정상 작동

### **배운 것:**
- 하나의 테이블에서 같은 테이블을 여러 번 참조할 때는 명시적으로 FK 이름을 지정해야 함
- Supabase 쿼리에서 `!{foreign_key_name}` 문법 사용

**이제 경매 상세 화면이 정상적으로 동작합니다!** 🎉

