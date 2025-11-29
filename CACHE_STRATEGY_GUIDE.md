# 📦 캐시 전략 가이드

## 🎯 캐시 전략 종류

### 1. Static (정적 데이터)
```typescript
staleTime: 24시간
gcTime: 7일
```

**사용 예시**:
- 앱 설정
- 카테고리 목록
- 이용약관
- 챌린지 규칙

**특징**: 거의 변하지 않으므로 오래 캐시

---

### 2. Normal (일반 데이터) - 기본값
```typescript
staleTime: 5분
gcTime: 30분
```

**사용 예시**:
- 작품 상세
- 사용자 프로필 (다른 사용자)
- 댓글 목록

**특징**: 대부분의 데이터에 적용

---

### 3. Realtime (실시간 데이터)
```typescript
staleTime: 0
gcTime: 5분
```

**사용 예시**:
- 알림 목록
- 메시지 (채팅)
- 좋아요/북마크 상태
- 팔로워 카운트

**특징**: 항상 최신 데이터 필요

---

### 4. Profile (프로필 데이터)
```typescript
staleTime: 10분
gcTime: 1시간
```

**사용 예시**:
- 내 프로필
- 내 작품 목록
- 내 정산 정보

**특징**: 본인 데이터는 자주 안 바뀜

---

### 5. Feed (피드 데이터)
```typescript
staleTime: 2분
gcTime: 15분
```

**사용 예시**:
- 작품 피드 (홈)
- 검색 결과
- 챌린지 목록

**특징**: 새 컨텐츠가 자주 추가됨

---

## 📝 사용 방법

### 기본 (Normal 전략)

```typescript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['artwork', artworkId],
  queryFn: () => getArtworkDetail(artworkId),
  // 기본 전략 자동 적용
});
```

### 커스텀 전략 적용

```typescript
import { useQuery } from '@tanstack/react-query';
import { CACHE_STRATEGIES } from '../utils/queryClient';

// Static (정적 데이터)
const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: getCategories,
  ...CACHE_STRATEGIES.static, // 24시간 캐시
});

// Realtime (실시간 데이터)
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: getNotifications,
  ...CACHE_STRATEGIES.realtime, // 항상 최신
});

// Profile (프로필)
const { data: myProfile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => getProfile(userId),
  ...CACHE_STRATEGIES.profile, // 10분 캐시
});

// Feed (피드)
const { data: artworks } = useQuery({
  queryKey: ['artworks', page],
  queryFn: () => getArtworks(page),
  ...CACHE_STRATEGIES.feed, // 2분 캐시
});
```

---

## 🔄 캐시 무효화

### 수동 무효화

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// 특정 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['artworks'] });

// 모든 작품 관련 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['artworks'] });

// 특정 작품만 무효화
queryClient.invalidateQueries({ queryKey: ['artwork', artworkId] });
```

### Mutation 후 자동 무효화

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const uploadMutation = useMutation({
  mutationFn: uploadArtwork,
  onSuccess: () => {
    // 작품 목록 새로고침
    queryClient.invalidateQueries({ queryKey: ['artworks'] });
  },
});
```

---

## 📊 실제 적용 예시

### HomeScreen (작품 피드)

```typescript
// src/screens/HomeScreen.tsx
import { CACHE_STRATEGIES } from '../utils/queryClient';

const { data: artworks } = useInfiniteQuery({
  queryKey: ['artworks', filter],
  queryFn: ({ pageParam }) => getArtworks(pageParam, 20, filter),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  ...CACHE_STRATEGIES.feed, // 2분 캐시
});
```

### ArtworkDetailScreen (작품 상세)

```typescript
// src/screens/ArtworkDetailScreen.tsx
import { CACHE_STRATEGIES } from '../utils/queryClient';

const { data: artwork } = useQuery({
  queryKey: ['artwork', artworkId],
  queryFn: () => getArtworkDetail(artworkId),
  ...CACHE_STRATEGIES.normal, // 5분 캐시
});

const { data: comments } = useQuery({
  queryKey: ['comments', artworkId],
  queryFn: () => getComments(artworkId),
  ...CACHE_STRATEGIES.realtime, // 항상 최신 (댓글은 실시간성 중요)
});
```

### ProfileScreen (프로필)

```typescript
// src/screens/ProfileScreen.tsx
import { CACHE_STRATEGIES } from '../utils/queryClient';

const { data: profile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => getProfile(userId),
  ...CACHE_STRATEGIES.profile, // 10분 캐시
});
```

### NotificationsScreen (알림)

```typescript
// src/screens/NotificationsScreen.tsx
import { CACHE_STRATEGIES } from '../utils/queryClient';

const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: getNotifications,
  ...CACHE_STRATEGIES.realtime, // 항상 최신
});
```

---

## 💡 최적화 팁

### 1. Prefetching (미리 로드)

```typescript
// 작품 상세 화면으로 이동 전 미리 로드
const queryClient = useQueryClient();

const handleArtworkPress = (artworkId: string) => {
  // 데이터 미리 가져오기
  queryClient.prefetchQuery({
    queryKey: ['artwork', artworkId],
    queryFn: () => getArtworkDetail(artworkId),
  });
  
  // 화면 이동
  navigation.navigate('ArtworkDetail', { artworkId });
};
```

### 2. Optimistic Updates (낙관적 업데이트)

```typescript
// 좋아요 즉시 반영 (서버 응답 기다리지 않음)
const likeMutation = useMutation({
  mutationFn: toggleLike,
  onMutate: async (artworkId) => {
    // 현재 캐시 취소
    await queryClient.cancelQueries({ queryKey: ['artwork', artworkId] });
    
    // 이전 값 저장
    const previous = queryClient.getQueryData(['artwork', artworkId]);
    
    // 낙관적 업데이트
    queryClient.setQueryData(['artwork', artworkId], (old: any) => ({
      ...old,
      is_liked: !old.is_liked,
      likes_count: old.is_liked ? old.likes_count - 1 : old.likes_count + 1,
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(['artwork', variables.artworkId], context.previous);
  },
});
```

### 3. 선택적 Refetch

```typescript
// 화면 포커스 시에만 새로고침 (중요한 데이터)
const { data } = useQuery({
  queryKey: ['my-earnings'],
  queryFn: getMyEarnings,
  ...CACHE_STRATEGIES.profile,
  refetchOnWindowFocus: true, // 화면 돌아올 때 새로고침
});
```

---

## 🎯 권장 사항

| 데이터 유형 | 전략 | 이유 |
|------------|------|------|
| 내 프로필 | profile | 자주 안 바뀜 |
| 다른 사용자 프로필 | normal | 가끔 바뀜 |
| 작품 피드 | feed | 새 작품 자주 추가 |
| 작품 상세 | normal | 가끔 수정 |
| 댓글 | realtime | 실시간성 중요 |
| 알림 | realtime | 실시간 확인 필요 |
| 챌린지 목록 | feed | 새 챌린지 추가 |
| 카테고리 | static | 거의 안 바뀜 |
| 검색 결과 | feed | 실시간 반영 |

---

## 🔍 디버깅

### React Query Devtools (개발 환경)

```typescript
// App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function App() {
  return (
    <>
      <YourApp />
      {__DEV__ && <ReactQueryDevtools />}
    </>
  );
}
```

### 캐시 상태 확인

```typescript
const queryClient = useQueryClient();

// 모든 쿼리 확인
console.log(queryClient.getQueryCache().getAll());

// 특정 쿼리 확인
console.log(queryClient.getQueryData(['artwork', artworkId]));
```

---

**캐시 전략을 잘 활용하면**:
- ✅ 로딩 속도 ↑
- ✅ 네트워크 요청 ↓
- ✅ Supabase 비용 ↓
- ✅ 사용자 경험 ↑

