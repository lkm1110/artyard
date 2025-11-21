# 🏆 챌린지 경매 시스템 테스트 가이드

## 📋 테스트 순서

### Step 1: 챌린지 생성 (Admin)
```
Admin Dashboard → Challenge Management → Create Challenge

입력 정보:
- Title: "Winter Art Challenge"
- Description: "Create beautiful winter-themed artworks"
- Topic: "Winter"
- Tier Requirement: New Artists
- 기간: 자동 (2주)
```

결과: Challenge가 `active` 상태로 생성됨

---

### Step 2: 작품 업로드 (Artist)
```
Challenges → "Winter Art Challenge" → Submit Your Artwork

입력 정보:
- 이미지: 작품 사진
- Title: "Frozen Lake"
- Description: "Beautiful frozen lake in winter"
- Size: 50×70cm
- Price (Auction Reserve Price): $100

✅ 챌린지 참가 시 Price = 경매 최소 금액
```

**3-4개의 작품 업로드** (여러 계정 또는 테스트 계정)

결과:
- 작품이 메인 페이지에 **표시되지 않음**
- Challenge Entries에만 표시됨

---

### Step 3: 투표 (Users)
```
Challenges → "Winter Art Challenge" → Entries

각 작품에 투표:
- ❤️ Vote 버튼 클릭
- 1계정당 1작품만 투표 가능
- 다른 작품에 투표 시 자동으로 이전 투표 취소
```

**투표 수 분산**:
- 작품 A: 5표
- 작품 B: 3표
- 작품 C: 1표

결과:
- 실시간으로 투표 수 업데이트
- 작품 A가 1등

---

### Step 4: 챌린지 종료 & 우승자 발표 (Admin)
```
Admin Dashboard → Challenge Management → "Winter Art Challenge"

[End & Start Voting] 버튼 클릭
→ Challenge가 'voting' 상태로 변경

[Announce Winner] 버튼 클릭
→ Top 10 선정 및 1등 발표
```

**데이터베이스 확인**:
```sql
-- 1등 확인
SELECT * FROM challenge_entries
WHERE challenge_id = 'your-challenge-id'
ORDER BY votes_count DESC
LIMIT 1;

-- 결과:
-- is_winner = true
-- final_rank = 1
-- auction_reserve_price = 100.00
```

---

### Step 5: 경매 생성 (Admin - Manual)
```sql
-- Supabase SQL Editor에서 실행

-- 1. 경매 생성
INSERT INTO challenge_auctions (
  title,
  description,
  quarter,
  start_date,
  end_date,
  status,
  platform_commission_rate
) VALUES (
  '2025 Q1 Challenge Winners Auction',
  '1st place winners from Q1 challenges',
  '2025-Q1',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active',
  0.10
) RETURNING id;

-- 결과: auction_id 복사 (예: 'abc-123-def')
```

```sql
-- 2. 1등 작품 조회
SELECT 
  ce.*,
  a.title as artwork_title,
  a.images
FROM challenge_entries ce
JOIN artworks a ON ce.artwork_id = a.id
WHERE ce.is_winner = true
AND ce.final_rank = 1;

-- 결과: 1등 작품 확인
```

```sql
-- 3. 경매 아이템 추가
INSERT INTO auction_items (
  auction_id,
  challenge_entry_id,
  artwork_id,
  artist_id,
  starting_price,
  current_price,
  reserve_price,
  buyout_price
) 
SELECT
  'abc-123-def', -- 위에서 복사한 auction_id
  ce.id,
  ce.artwork_id,
  ce.author_id,
  COALESCE(ce.auction_reserve_price, 100), -- 작가가 설정한 최소 금액
  COALESCE(ce.auction_reserve_price, 100),
  COALESCE(ce.auction_reserve_price, 100),
  COALESCE(ce.auction_reserve_price, 100) * 5 -- Buy Now = 5배
FROM challenge_entries ce
WHERE ce.is_winner = true
AND ce.final_rank = 1
AND ce.challenge_id = 'your-challenge-id'; -- 실제 challenge_id로 변경

-- 결과: auction_items 1개 추가됨
```

---

### Step 6: 경매 확인 (User)
```
앱에서 경매 화면 이동:
Profile → Auctions (또는 별도 메뉴)
```

**예상 화면**:
```
┌─────────────────────────────┐
│ 2025 Q1 Challenge Winners   │
│ Live Auction                │
├─────────────────────────────┤
│ [Artwork Image]             │
│ "Frozen Lake"               │
│ by @artist_jane             │
│                             │
│ Current Bid: $100           │
│ Bids: 0                     │
│ Time Left: 6d 23h           │
│                             │
│ [Place Bid] [Buy Now $500]  │
└─────────────────────────────┘
```

---

### Step 7: 입찰 테스트
```
[Place Bid] 클릭

입력:
- Bid Amount: $120 (현재가 + $10 이상)

확인:
- "Your bid of $120 has been placed!"
- Current Bid: $120으로 업데이트
- Bids: 1
```

**다른 사용자로 입찰**:
```
입력:
- Bid Amount: $150

결과:
- 이전 입찰자는 알림 (선택)
- Current Bid: $150
- Highest Bidder: 새로운 사용자
```

---

### Step 8: Buy Now 테스트
```
[Buy Now $500] 클릭

확인 팝업:
"Are you sure you want to buy "Frozen Lake" for $500?"

[Buy Now] 클릭

결과:
- 즉시 낙찰
- is_sold = true
- sold_price = $500
- buyer_id = 현재 사용자
- 작가: $450 (90%)
- 플랫폼: $50 (10%)
```

---

### Step 9: 경매 종료 (7일 후 또는 Manual)
```sql
-- Manual 종료 (테스트용)
UPDATE challenge_auctions
SET status = 'ended'
WHERE id = 'abc-123-def';

-- 낙찰 처리
SELECT finalize_auction_item('auction-item-id');

-- 결과:
-- 최고 입찰자에게 낙찰
-- 작가에게 90% 수익
-- 플랫폼에게 10% 수수료
```

---

## 🔧 Quick Test Script

전체 과정을 빠르게 테스트하려면:

```sql
-- 1. 챌린지 생성 (이미 완료)
-- 2. 작품 업로드 (이미 완료)
-- 3. 투표 추가 (테스트용)
INSERT INTO challenge_votes (challenge_id, entry_id, voter_id)
VALUES
  ('your-challenge-id', 'entry-1-id', 'user-1-id'),
  ('your-challenge-id', 'entry-1-id', 'user-2-id'),
  ('your-challenge-id', 'entry-1-id', 'user-3-id');

-- 4. 투표 수 업데이트
UPDATE challenge_entries
SET votes_count = (
  SELECT COUNT(*) FROM challenge_votes
  WHERE entry_id = challenge_entries.id
)
WHERE challenge_id = 'your-challenge-id';

-- 5. 우승자 발표
SELECT announce_challenge_winner('your-challenge-id');

-- 6. 경매 생성 (위 Step 5 참조)
-- 7. 입찰 테스트 (앱에서 진행)
```

---

## 📊 확인 사항

### Database 체크리스트
- [ ] `challenge_entries.is_winner = true`
- [ ] `challenge_entries.final_rank = 1`
- [ ] `challenge_entries.auction_reserve_price` 설정됨
- [ ] `challenge_auctions` 생성됨
- [ ] `auction_items` 추가됨
- [ ] `auction_items.starting_price = auction_reserve_price`
- [ ] `auction_bids` 입찰 기록
- [ ] `auction_items.is_sold = true` (낙찰 후)

### UI 체크리스트
- [ ] 챌린지 작품이 메인 페이지에서 숨겨짐
- [ ] Entries에서 투표 가능
- [ ] 1계정 1작품만 투표
- [ ] 경매 화면 표시
- [ ] 입찰 실시간 업데이트
- [ ] Buy Now 즉시 구매
- [ ] 낙찰 알림

---

## 🚨 주의사항

1. **실제 결제 없음**: 현재는 시뮬레이션만
2. **수동 경매 생성**: 자동화 전까지 SQL로 생성
3. **테스트 계정**: 여러 계정 필요 (투표, 입찰)
4. **시간 제한**: 7일 경매 기간 (테스트 시 단축 가능)

---

## 💡 자동화 계획 (향후)

### Admin UI 추가
```
Admin Dashboard → Auction Management
- [Create Quarterly Auction] 버튼
- 1등 작품 자동 조회
- 경매 자동 생성
- 시작/종료 관리
```

### Cron Job (Scheduled)
```javascript
// 매 분기말 자동 실행
export const createQuarterlyAuction = async () => {
  const winners = await getQuarterlyWinners();
  const auction = await createAuction();
  for (const winner of winners) {
    await addAuctionItem(auction.id, winner);
  }
};
```

---

완료! 🎉

이제 전체 챌린지 → 경매 시스템을 테스트할 수 있습니다!

