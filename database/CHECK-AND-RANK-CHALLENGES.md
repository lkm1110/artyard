# 종료된 챌린지 순위 매기기 가이드

## 문제
종료된 챌린지에 금/은/동 테두리가 표시되지 않음

## 원인
`challenge_entries` 테이블의 `final_rank` 컬럼이 NULL 상태

## 해결 방법

### 1단계: 현재 상태 확인
```sql
-- 종료된 챌린지 확인
SELECT 
  c.id,
  c.title,
  c.status,
  c.end_date,
  COUNT(ce.id) as entries_count
FROM challenges c
LEFT JOIN challenge_entries ce ON c.id = ce.challenge_id
WHERE c.end_date < NOW()
GROUP BY c.id, c.title, c.status, c.end_date
ORDER BY c.end_date DESC;

-- final_rank가 NULL인지 확인
SELECT 
  c.title,
  ce.id as entry_id,
  ce.votes_count,
  ce.final_rank
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
WHERE c.end_date < NOW()
ORDER BY c.end_date DESC, ce.votes_count DESC
LIMIT 20;
```

### 2단계: 순위 매기기 함수 실행

**Option A: 모든 종료된 챌린지 한 번에 순위 매기기**
```sql
-- AUTO-RANK-CHALLENGE-WINNERS.sql 파일의 함수들을 먼저 실행하고
SELECT * FROM rank_all_ended_challenges();
```

**Option B: 특정 챌린지만 순위 매기기**
```sql
-- 특정 챌린지 ID로 순위 매기기
SELECT rank_challenge_winners('여기에-챌린지-UUID-입력');
```

### 3단계: 결과 확인
```sql
-- Top 3 확인
SELECT 
  c.title as challenge,
  a.title as artwork,
  p.handle as artist,
  ce.votes_count as votes,
  ce.final_rank as rank
FROM challenges c
JOIN challenge_entries ce ON c.id = ce.challenge_id
LEFT JOIN artworks a ON ce.artwork_id = a.id
LEFT JOIN profiles p ON ce.author_id = p.id
WHERE c.end_date < NOW()
  AND ce.final_rank IS NOT NULL
ORDER BY c.end_date DESC, ce.final_rank ASC
LIMIT 10;
```

## 예상 결과

순위 매기기 후:
- 1등: `final_rank = 1` → 금색 테두리
- 2등: `final_rank = 2` → 은색 테두리
- 3등: `final_rank = 3` → 동색 테두리
- 4-10등: `final_rank = 4~10` → 일반 테두리

## 트러블슈팅

### 만약 함수가 없다면?
```sql
-- AUTO-RANK-CHALLENGE-WINNERS.sql 파일 전체를 먼저 실행하세요
-- 파일 위치: database/AUTO-RANK-CHALLENGE-WINNERS.sql
```

### 수동으로 순위 매기기 (함수 없이)
```sql
-- 특정 챌린지의 순위 매기기
WITH ranked_entries AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY votes_count DESC, created_at ASC) as rank
  FROM challenge_entries
  WHERE challenge_id = '여기에-챌린지-UUID'
)
UPDATE challenge_entries ce
SET final_rank = re.rank
FROM ranked_entries re
WHERE ce.id = re.id;
```

## 앱에서 확인하기

순위 매기기 후 앱을 새로고침하면:
1. 종료된 챌린지 상세 페이지 진입
2. Winner 섹션: 1등에 금색 테두리 (4px)
3. Top 10 섹션: 2등 은색, 3등 동색 테두리 (3px)
4. All Entries: 순위 순서대로 정렬, 1-3등 메달 테두리

