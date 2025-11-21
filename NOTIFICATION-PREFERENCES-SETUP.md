# 알림 설정 기능 - 데이터베이스 설정

## 문제
```
ERROR  Error loading notification preferences: 
{"code": "42703", "message": "column profiles.notification_preferences does not exist"}
```

`profiles` 테이블에 `notification_preferences` 컬럼이 없어서 알림 설정을 저장/불러올 수 없습니다.

## 해결 방법

### 1. Supabase SQL Editor 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (`bkvycanciimgyftdtqpx`)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. SQL 실행

**New Query** 버튼 클릭 후, 아래 SQL을 복사해서 붙여넣고 **Run** 버튼 클릭:

```sql
-- Add notification_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_follower": true,
  "new_like": true,
  "new_comment": true,
  "purchase": true,
  "sale": true,
  "payment_received": true,
  "challenge_started": true,
  "challenge_ending_soon": true,
  "voting_started": true,
  "auction_bid": true,
  "auction_won": true,
  "auction_lost": true,
  "system_updates": true,
  "newsletter": false
}'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences stored as JSON';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences 
ON profiles USING gin (notification_preferences);
```

### 3. 확인

다음 쿼리로 컬럼이 제대로 추가되었는지 확인:

```sql
-- 컬럼 확인
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'notification_preferences';

-- 실제 데이터 확인
SELECT 
  id,
  handle,
  notification_preferences
FROM profiles
LIMIT 5;
```

## 기본 설정값

모든 사용자는 다음 기본값으로 시작합니다:

### 소셜 알림 (기본: 켜짐)
- ✅ `new_follower`: 새 팔로워
- ✅ `new_like`: 좋아요
- ✅ `new_comment`: 댓글

### 거래 알림 (기본: 켜짐)
- ✅ `purchase`: 구매
- ✅ `sale`: 판매
- ✅ `payment_received`: 결제 수령

### 챌린지 & 경매 (기본: 켜짐)
- ✅ `challenge_started`: 새 챌린지 시작
- ✅ `challenge_ending_soon`: 챌린지 종료 임박
- ✅ `voting_started`: 투표 시작
- ✅ `auction_bid`: 경매 입찰
- ✅ `auction_won`: 경매 낙찰
- ✅ `auction_lost`: 경매 낙찰 실패

### 시스템 알림
- ✅ `system_updates`: 시스템 업데이트 (기본: 켜짐)
- ❌ `newsletter`: 뉴스레터 (기본: 꺼짐)

## 데이터 구조

```typescript
interface NotificationPreferences {
  // 소셜
  new_follower: boolean;
  new_like: boolean;
  new_comment: boolean;
  
  // 거래
  purchase: boolean;
  sale: boolean;
  payment_received: boolean;
  
  // 챌린지 & 경매
  challenge_started: boolean;
  challenge_ending_soon: boolean;
  voting_started: boolean;
  auction_bid: boolean;
  auction_won: boolean;
  auction_lost: boolean;
  
  // 시스템
  system_updates: boolean;
  newsletter: boolean;
}
```

## 사용 예시

### 설정 불러오기
```typescript
const { data } = await supabase
  .from('profiles')
  .select('notification_preferences')
  .eq('id', userId)
  .single();

const preferences = data?.notification_preferences || DEFAULT_PREFERENCES;
```

### 설정 저장하기
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ 
    notification_preferences: {
      ...preferences,
      new_like: false  // 좋아요 알림 끄기
    }
  })
  .eq('id', userId);
```

## 성능 최적화

GIN (Generalized Inverted Index) 인덱스가 자동으로 생성되어 JSONB 필드 검색이 빠릅니다:

```sql
CREATE INDEX idx_profiles_notification_preferences 
ON profiles USING gin (notification_preferences);
```

## 문제 해결

### 에러: "column already exists"
이미 컬럼이 존재합니다. 건너뛰어도 됩니다.

### 에러: "permission denied"
RLS 정책을 확인하세요. `profiles` 테이블에 대한 UPDATE 권한이 필요합니다.

### 기존 사용자 설정이 null인 경우
기본값이 자동으로 적용되지 않은 경우:

```sql
UPDATE profiles 
SET notification_preferences = '{
  "new_follower": true,
  "new_like": true,
  "new_comment": true,
  "purchase": true,
  "sale": true,
  "payment_received": true,
  "challenge_started": true,
  "challenge_ending_soon": true,
  "voting_started": true,
  "auction_bid": true,
  "auction_won": true,
  "auction_lost": true,
  "system_updates": true,
  "newsletter": false
}'::jsonb
WHERE notification_preferences IS NULL;
```

## 완료 후

1. ✅ SQL 실행 완료
2. ✅ 앱 재시작 또는 새로고침
3. ✅ Settings → Notification Settings 접속
4. ✅ 알림 설정 변경 테스트

에러가 사라지고 정상적으로 작동해야 합니다! 🎉

