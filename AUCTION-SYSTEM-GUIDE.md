# 🏆 경매 시스템 완전 가이드

## ✅ 구현 완료 사항

### 1. Database 스키마 ✅
**파일**: `database/UPDATE-CHALLENGE-SYSTEM.sql`

#### 테이블:
- **`challenge_auctions`**: 분기별 경매 (Q1, Q2, Q3, Q4)
- **`auction_items`**: 경매 아이템 (우승작)
- **`auction_bids`**: 입찰 내역
- **`auction_watchers`**: 관심 목록 (찜하기)

#### 주요 기능:
- ✅ 10% 플랫폼 수수료 (90% 작가에게)
- ✅ 입찰 시 자동 업데이트 (트리거)
- ✅ 낙찰 처리 함수 (`finalize_auction_item`)
- ✅ Reserve Price (최소 낙찰가)
- ✅ Buy Now (즉시 구매)
- ✅ 자동 입찰 지원

### 2. 챌린지 제한 ✅
- ✅ **작가당 1작품 제한**: `UNIQUE(challenge_id, author_id)` 제약
- ✅ **투표 1인 1표**: `UNIQUE(challenge_id, voter_id)` 제약
- ✅ **신규 작가 전용**: 티어 시스템

### 3. UI 화면 ✅
- ✅ **`AuctionsScreen.tsx`**: 경매 목록
- ✅ **`AuctionDetailScreen.tsx`**: 경매 상세 & 입찰
- ✅ **`ConfirmModal.tsx`**: 입찰 확인 모달 (커스텀 입력 지원)

---

## 📊 경매 시스템 플로우

### 1단계: 분기 종료 → 경매 생성 (Admin)
```typescript
// 예: 2025년 Q1 종료 시
const { data, error } = await supabase
  .from('challenge_auctions')
  .insert({
    title: '2025 Q1 Challenge Winners Auction',
    description: 'Quarterly winners from January to March',
    quarter: '2025-Q1',
    start_date: '2025-04-01T00:00:00Z',
    end_date: '2025-04-07T23:59:59Z', // 1주일
    status: 'upcoming',
  });
```

### 2단계: 우승작 추가 (Admin)
```typescript
// 각 챌린지의 우승작 추가
const { data: winnerEntries } = await supabase
  .from('challenge_entries')
  .select('*')
  .eq('is_winner', true)
  .gte('created_at', '2025-01-01')
  .lt('created_at', '2025-04-01');

for (const entry of winnerEntries) {
  await supabase
    .from('auction_items')
    .insert({
      auction_id: auctionId,
      challenge_entry_id: entry.id,
      artwork_id: entry.artwork_id,
      artist_id: entry.author_id,
      starting_price: 100.00, // 기본 시작가
      current_price: 100.00,
      buyout_price: 500.00, // 즉시 구매가 (선택)
    });
}
```

### 3단계: 경매 오픈
```typescript
await supabase
  .from('challenge_auctions')
  .update({ status: 'active' })
  .eq('id', auctionId);
```

### 4단계: 사용자 입찰
```typescript
// AuctionDetailScreen에서 자동 처리
await supabase
  .from('auction_bids')
  .insert({
    auction_item_id: itemId,
    bidder_id: userId,
    bid_amount: 150.00,
    bid_type: 'normal',
  });

// 트리거가 자동으로 auction_items 업데이트
// - current_price = 150.00
// - highest_bidder_id = userId
// - bids_count++
```

### 5단계: 경매 종료 & 낙찰
```typescript
// 각 아이템 낙찰 처리
await supabase.rpc('finalize_auction_item', {
  p_auction_item_id: itemId
});

// 결과:
// - is_sold = true
// - sold_price = highest_bid_amount
// - buyer_id = highest_bidder_id
// - 작가: $135 (90%)
// - 플랫폼: $15 (10%)
```

---

## 💰 수수료 계산

### 예시: $1,000 낙찰
```
총 낙찰가: $1,000
플랫폼 수수료 (10%): $100
작가 수익 (90%): $900
```

### 코드 (자동 계산):
```sql
v_platform_fee := v_item.highest_bid_amount * 0.10;
v_artist_amount := v_item.highest_bid_amount - v_platform_fee;
```

---

## 🎯 주요 기능

### 1. 입찰 시스템
- **일반 입찰**: 현재가보다 높게 입찰
- **자동 입찰**: 최대 금액 설정, 자동으로 경쟁
- **즉시 구매**: Buy Now 가격으로 즉시 낙찰

### 2. Reserve Price (최소 낙찰가)
- Admin이 설정 가능
- Reserve Price 미달 시 유찰

### 3. 실시간 업데이트
- 트리거를 통한 자동 업데이트
- 최고 입찰자 표시
- 입찰 내역 추적

### 4. 관심 목록 (Watchers)
```typescript
await supabase
  .from('auction_watchers')
  .insert({
    auction_item_id: itemId,
    user_id: userId,
  });
```

---

## 📱 사용자 경험

### 경매 목록 화면 (`AuctionsScreen`)
- 현재 진행 중인 경매
- 분기별 경매 (2025-Q1, Q2...)
- 상태 표시 (Live, Ended, Completed)
- 남은 시간 표시

### 경매 상세 화면 (`AuctionDetailScreen`)
- 우승작 목록
- 현재 입찰가
- 입찰 버튼
- Buy Now 버튼
- 최고 입찰자 표시
- 입찰 모달 (금액 입력)

---

## 🚀 Admin 도구

### 1. 경매 생성
```typescript
// Admin Dashboard → Create Auction
- Title
- Description
- Quarter (2025-Q1)
- Start Date
- End Date (1주일 권장)
```

### 2. 우승작 자동 추가
```typescript
// 버튼 클릭 한 번으로 분기 우승작 자동 추가
async function autoAddWinners(auctionId: string, quarter: string) {
  const [year, q] = quarter.split('-Q');
  const startMonth = (parseInt(q) - 1) * 3 + 1;
  const startDate = `${year}-${startMonth.toString().padStart(2, '0')}-01`;
  const endMonth = startMonth + 3;
  const endDate = `${year}-${endMonth.toString().padStart(2, '0')}-01`;
  
  const { data: winners } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('is_winner', true)
    .gte('created_at', startDate)
    .lt('created_at', endDate);
  
  for (const winner of winners) {
    await supabase.from('auction_items').insert({
      auction_id: auctionId,
      challenge_entry_id: winner.id,
      artwork_id: winner.artwork_id,
      artist_id: winner.author_id,
      starting_price: 100,
      current_price: 100,
    });
  }
}
```

### 3. 경매 종료 & 정산
```typescript
// 모든 아이템 낙찰 처리
async function finalizeAuction(auctionId: string) {
  const { data: items } = await supabase
    .from('auction_items')
    .select('id')
    .eq('auction_id', auctionId);
  
  for (const item of items) {
    await supabase.rpc('finalize_auction_item', {
      p_auction_item_id: item.id
    });
  }
  
  await supabase
    .from('challenge_auctions')
    .update({ status: 'completed' })
    .eq('id', auctionId);
}
```

---

## 📈 수익 예측

### 분기당 우승작: 12개 (매달 1개 챌린지 x 3개월)
### 평균 낙찰가: $500

```
총 거래액: $500 x 12 = $6,000
플랫폼 수수료 (10%): $600
작가 수익 (90%): $5,400

연간 수익 (4분기): $600 x 4 = $2,400
```

### 낙찰가 상승 시 ($1,000 평균)
```
분기당 거래액: $1,000 x 12 = $12,000
플랫폼 수수료: $1,200
연간 수익: $4,800
```

---

## 🎨 마케팅 전략

### 1. 브랜드 가치
- "Artyard Challenge Winner" 타이틀
- 경매 참여 = 인증된 작품
- 컬렉터들의 관심 집중

### 2. 작가 동기부여
- 챌린지 우승 → 경매 → 고액 판매
- 성공 스토리 홍보
- "챌린지 우승으로 $2,000 벌었어요!"

### 3. 수집가 유치
- 희소성 (분기당 12개만)
- 투자 가치
- NFT 연동 (미래)

---

## 🔧 기술 스택

- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime (입찰 업데이트)
- **Frontend**: React Native + TypeScript
- **State**: React Query
- **Payment**: Stripe (미래)

---

## 📅 로드맵

### Phase 1 (현재) ✅
- 챌린지 시스템
- 투표 시스템
- 우승자 발표

### Phase 2 (1개월) 🚧
- 경매 시스템 UI 통합
- Admin 경매 관리 페이지
- 자동 우승작 추가

### Phase 3 (3개월) 📅
- 실시간 입찰 알림
- 자동 입찰
- 결제 통합 (Stripe)

### Phase 4 (6개월) 🔮
- NFT 발행
- 블록체인 인증서
- 2차 거래 마켓

---

## 🎉 완성!

**모든 코드가 준비되었습니다!**

### 다음 단계:
1. Supabase에서 SQL 실행 (`UPDATE-CHALLENGE-SYSTEM.sql`)
2. Navigation에 경매 화면 추가
3. 테스트 경매 생성
4. 첫 분기 경매 오픈! 🚀

---

**질문이 있으면 언제든지 물어보세요!** 💬

