# 🔨 경매 Top 3 작품 표시 수정

## 🎯 문제

- 기존: 1등 작품만 표시 (`is_winner=true, final_rank=1`)
- 요구사항: 1, 2, 3등 모두 경매에 올리기

---

## ✅ 해결 방법

### 1. **AuctionManagementScreen 수정**

#### Before:
```typescript
.eq('is_winner', true)
.eq('final_rank', 1)
```

#### After:
```typescript
.in('final_rank', [1, 2, 3])  // ← Top 3 모두 조회!
```

---

## 📊 확인 단계

### **Step 1: Supabase SQL Editor에서 확인**

```sql
-- 최근 종료된 챌린지 확인
SELECT 
  c.id,
  c.title,
  c.status,
  COUNT(ce.id) as total_entries,
  COUNT(CASE WHEN ce.final_rank IN (1,2,3) THEN 1 END) as top_3_count
FROM challenges c
LEFT JOIN challenge_entries ce ON c.id = ce.challenge_id
WHERE c.status IN ('ended', 'voting', 'archived')
GROUP BY c.id
ORDER BY c.end_date DESC
LIMIT 5;
```

**기대 결과**:
- `status`: `'ended'` 또는 `'archived'`
- `top_3_count`: 3 (1, 2, 3등이 선정되어 있어야 함)

---

### **Step 2: Top 3 상세 확인**

```sql
-- Top 3 작품 상세
SELECT 
  c.title as challenge_title,
  ce.final_rank,
  a.title as artwork_title,
  p.handle as artist_name,
  ce.votes_count,
  ce.auction_reserve_price,
  ce.is_top_10
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
JOIN artworks a ON ce.artwork_id = a.id
JOIN profiles p ON a.author_id = p.id
WHERE c.status IN ('ended', 'archived')
  AND ce.final_rank IN (1, 2, 3)
ORDER BY c.end_date DESC, ce.final_rank ASC;
```

**기대 결과**:
```
challenge_title | final_rank | artwork_title | artist_name | votes | auction_reserve_price
----------------|------------|---------------|-------------|-------|----------------------
Winter 2025     | 1          | Frozen Lake   | artist_jane | 45    | 100.00
Winter 2025     | 2          | Winter Night  | artist_bob  | 38    | 80.00
Winter 2025     | 3          | Cold Wind     | artist_charlie | 32 | 60.00
```

---

### **Step 3: 문제 진단**

#### 문제 A: `final_rank`가 NULL이거나 1등만 있을 경우

**원인**: `announce_challenge_winner()`가 실행되지 않았음

**해결**:
```sql
-- 챌린지 ID 확인 (위의 Step 1 쿼리 결과에서)
SELECT announce_challenge_winner('YOUR_CHALLENGE_ID');
```

#### 문제 B: `auction_reserve_price`가 NULL일 경우

**원인**: 작품 업로드 시 가격을 입력하지 않음

**해결**:
```sql
-- 가격 수동 설정
UPDATE challenge_entries
SET auction_reserve_price = 100.00
WHERE challenge_id = 'YOUR_CHALLENGE_ID'
  AND final_rank IN (1, 2, 3)
  AND auction_reserve_price IS NULL;
```

#### 문제 C: 챌린지가 아직 종료되지 않음

**원인**: Status가 `'active'`로 되어 있음

**해결**:
```
Admin Dashboard 
  → Challenge Management 
  → [End & Start Voting] 버튼 클릭
  → [Announce Winner] 버튼 클릭
```

---

## 🎨 UI 변경 사항

### **Auction Management 화면**

#### Before:
```
Select Challenge Winners (1 available)
  ☐ Frozen Lake
     Winter Art Challenge • by @artist_jane
     ❤️ 45 votes • Min: $100
```

#### After:
```
Select Challenge Winners (3 available)
  ☐ #1 Frozen Lake
     Winter Art Challenge • by @artist_jane
     ❤️ 45 votes • Min: $100
  
  ☐ #2 Winter Night
     Winter Art Challenge • by @artist_bob
     ❤️ 38 votes • Min: $80
  
  ☐ #3 Cold Wind
     Winter Art Challenge • by @artist_charlie
     ❤️ 32 votes • Min: $60
```

---

## 🚀 사용 방법

### **1. 챌린지 종료 & 우승자 발표**

```
Admin Dashboard 
  → Challenge Management 
  → [End & Start Voting]
  → [Announce Winner] ✅
```

**결과**: Top 10 선정 + 1등에 `is_winner=true` 설정

---

### **2. Top 3 확인**

```
Supabase SQL Editor
  → Step 2 쿼리 실행
  → 1, 2, 3등 모두 있는지 확인 ✅
```

---

### **3. 경매 생성**

```
Admin Dashboard 
  → Auction Management
  → [+] 버튼
  → Top 3 작품 모두 선택 ✅
  → [Create Auction (3 items)]
```

---

### **4. 경매 시작**

```
Admin Dashboard 
  → Auction Management
  → "Q1 2025 Winners Auction"
  → [Start Auction] ✅
```

---

## 🎯 테스트 시나리오

### **시나리오: 3개 작품을 경매에 추가**

```typescript
// 1. Challenge 종료
Admin → Challenge Management 
  → "Winter Art Challenge"
  → [End & Start Voting]
  → [Announce Winner]
  → ✅ "Winner announced: @artist_jane with 45 votes!"

// 2. SQL 확인
SELECT final_rank, COUNT(*)
FROM challenge_entries
WHERE challenge_id = 'YOUR_ID'
  AND final_rank IN (1,2,3)
GROUP BY final_rank;

// 결과:
// final_rank | count
// -----------|-------
// 1          | 1
// 2          | 1
// 3          | 1

// 3. 경매 생성
Admin → Auction Management
  → [+] 버튼
  → Title: "Q1 2025 Winners Auction"
  → Quarter: "Q1 2025"
  → 3개 작품 모두 체크 ✅
  → [Create Auction (3 items)]

// 4. 확인
Admin → Auction Management
  → "Q1 2025 Winners Auction"
  → "3 items" 표시 확인 ✅
```

---

## 📝 데이터베이스 흐름

### **Before (1등만)**:
```
challenge_entries
  ├── final_rank: 1, is_winner: true  → 경매 O
  ├── final_rank: 2, is_winner: false → 경매 X
  └── final_rank: 3, is_winner: false → 경매 X

auction_items: 1개
```

### **After (Top 3)**:
```
challenge_entries
  ├── final_rank: 1, is_winner: true  → 경매 O
  ├── final_rank: 2, is_winner: false → 경매 O
  └── final_rank: 3, is_winner: false → 경매 O

auction_items: 3개 ✅
```

---

## ✅ 체크리스트

### **코드 수정**
- [x] AuctionManagementScreen.tsx 수정
- [x] `.eq('final_rank', 1)` → `.in('final_rank', [1,2,3])`
- [x] 작품 제목에 순위 표시 (`#1`, `#2`, `#3`)
- [x] `final_rank` 필드 추가

### **확인 사항**
- [ ] 챌린지 status가 `'ended'`인지 확인
- [ ] `announce_challenge_winner()` 실행했는지 확인
- [ ] Top 3가 모두 `final_rank` 값이 있는지 확인
- [ ] `auction_reserve_price`가 NULL이 아닌지 확인

---

## 🎉 완료!

이제 1, 2, 3등 모두 경매에 올릴 수 있습니다!

```
챌린지 종료 → 우승자 발표 → Top 3 확인 → 경매 생성!
     🏆            🎉              👀           🔨
```

