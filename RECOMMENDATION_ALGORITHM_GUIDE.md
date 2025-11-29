# 🤖 작품 추천 알고리즘 가이드

**구현 완료!** ✅

---

## 🎯 추천 알고리즘 종류

### 1. **개인화 추천** (Personalized)

**데이터 소스**:
- ❤️ 좋아요한 작품 (가중치: 2)
- 🔖 북마크한 작품 (가중치: 3)
- 👤 팔로우한 작가 (가중치: 5)
- 🔍 검색 기록 (향후 추가)

**점수 계산**:
```
선호 작품 유형: +30점
선호 작가: +50점
선호 가격대: +20점
인기도: +10점
최신성: +15점
댓글 활성도: +5점
───────────────────
총점: 최대 130점
```

**예시**:
```
사용자 A:
- Painting 좋아요 10개
- Photography 좋아요 5개
- @artist123 팔로우
- 평균 구매 가격: $100

추천:
1. @artist123의 Painting 작품 (80점)
2. 다른 작가의 Painting ($80-150) (60점)
3. @artist123의 Photography (55점)
```

---

### 2. **협업 필터링** (Collaborative Filtering)

**로직**: "비슷한 취향의 사용자가 좋아한 작품"

```sql
1. 내가 좋아요한 작품: [A, B, C]
2. 작품 A를 좋아요한 다른 사용자: [User1, User2, User3]
3. User1, User2, User3이 좋아요한 다른 작품: [D, E, F, G]
4. D, E, F, G 중 많이 추천된 순으로 반환
```

**특징**:
- 예상 못한 발견 (Serendipity)
- 취향이 비슷한 커뮤니티 형성
- 데이터가 많을수록 정확도 ↑

---

### 3. **유사 작품 추천** (Similar Artworks)

작품 상세 페이지에서 사용:

**점수 계산**:
```
같은 작가: +50점
같은 유형: +30점
비슷한 가격 (±30%): +20점
인기도: +10점
```

**예시**:
```
현재 작품: "Sunset" (Painting, $100, @artist123)

추천:
1. @artist123의 다른 Painting (80점)
2. 다른 작가의 Painting $70-130 (50점)
3. @artist123의 Photography (50점)
```

---

### 4. **트렌딩 작품** (Trending)

**기준**: 최근 7일간 좋아요가 많은 작품

```sql
SELECT * FROM artworks
WHERE likes.created_at > NOW() - INTERVAL '7 days'
ORDER BY likes_count DESC
```

**용도**: 
- 신규 사용자 (데이터 없을 때)
- 홈 피드 상단
- "지금 인기" 섹션

---

### 5. **통합 추천** (Smart Mix) ⭐ 추천

**3개 알고리즘을 믹스**:

```
개인화 10개 (가중치: 3)
협업 필터링 10개 (가중치: 2)
트렌딩 10개 (가중치: 1)
───────────────────────
중복 제거 → 점수 순 정렬 → 상위 20개
```

**효과**:
- 개인 맞춤 + 새로운 발견 + 인기 작품
- 균형잡힌 추천
- 사용자 만족도 ↑

---

## 📊 데이터 요구사항

### 필수 데이터 (이미 있음!)

```sql
✅ likes (좋아요)
✅ bookmarks (북마크)
✅ follows (팔로우)
✅ artworks (작품 정보)
✅ profiles (작가 정보)
```

### 선택 데이터 (향후)

```sql
⚠️ searches (검색 기록) - 추가 권장
⚠️ artwork_views (조회 기록) - 이미 있음!
⚠️ purchase_history (구매 기록) - transactions 활용
```

---

## 🚀 사용 방법

### HomeScreen (피드)

```typescript
// src/screens/HomeScreen.tsx
import { getSmartRecommendations } from '../services/recommendationService';

const [recommendedArtworks, setRecommendedArtworks] = useState([]);

useEffect(() => {
  loadRecommendations();
}, []);

const loadRecommendations = async () => {
  if (user) {
    // 로그인 사용자: 개인화 추천
    const artworks = await getSmartRecommendations(user.id, 20);
    setRecommendedArtworks(artworks);
  } else {
    // 비로그인: 인기 작품
    const artworks = await getTrendingArtworks('week', 20);
    setRecommendedArtworks(artworks);
  }
};

// 렌더링
<FlatList
  data={recommendedArtworks}
  renderItem={({ item }) => <ArtworkCard artwork={item} />}
  ListHeaderComponent={<Text>For You 🎯</Text>}
/>
```

### ArtworkDetailScreen (유사 작품)

```typescript
// src/screens/ArtworkDetailScreen.tsx
import { getSimilarArtworks } from '../services/recommendationService';

const [similarArtworks, setSimilarArtworks] = useState([]);

useEffect(() => {
  loadSimilarArtworks();
}, [artworkId]);

const loadSimilarArtworks = async () => {
  const artworks = await getSimilarArtworks(artworkId, user?.id, 8);
  setSimilarArtworks(artworks);
};

// 렌더링
<View style={styles.similarSection}>
  <Text style={styles.sectionTitle}>Similar Artworks</Text>
  <ScrollView horizontal>
    {similarArtworks.map(artwork => (
      <ArtworkCard key={artwork.id} artwork={artwork} />
    ))}
  </ScrollView>
</View>
```

---

## 🔧 알고리즘 튜닝

### 가중치 조정

```typescript
// src/services/recommendationService.ts

// 더 공격적인 개인화 (선호 유형 강조)
if (preferences.favoriteTypes.includes(artwork.material)) {
  score += 50; // 30 → 50으로 증가
}

// 신작 강조
if (daysOld < 7) score += 25; // 15 → 25로 증가
```

### 다양성 추가 (Diversity)

```typescript
// 같은 작가가 너무 많이 추천되지 않도록
const artistCount: Record<string, number> = {};

scoredArtworks.forEach(artwork => {
  const count = artistCount[artwork.author_id] || 0;
  if (count > 2) {
    artwork.recommendationScore *= 0.5; // 페널티
  }
  artistCount[artwork.author_id] = count + 1;
});
```

---

## 📈 성능 최적화

### 1. 캐싱

```typescript
// 추천 결과 캐시 (5분)
const { data } = useQuery({
  queryKey: ['recommendations', userId],
  queryFn: () => getSmartRecommendations(userId),
  ...CACHE_STRATEGIES.feed, // 2분 캐시
});
```

### 2. 백그라운드 계산

```typescript
// 앱 시작 시 미리 계산
useEffect(() => {
  if (user) {
    // Prefetch
    queryClient.prefetchQuery({
      queryKey: ['recommendations', user.id],
      queryFn: () => getSmartRecommendations(user.id),
    });
  }
}, [user]);
```

### 3. 인덱스 추가

```sql
-- 추천 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_likes_user_created 
ON likes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artworks_type_likes 
ON artworks(material, likes_count DESC);

CREATE INDEX IF NOT EXISTS idx_artworks_author_created 
ON artworks(author_id, created_at DESC);
```

---

## 🎯 A/B 테스트 아이디어

### 테스트 1: 추천 알고리즘

**Group A**: 개인화 추천만  
**Group B**: 통합 추천 (개인화 + 협업 + 트렌딩)  

**측정**: 클릭률, 좋아요율, 구매 전환율

### 테스트 2: 추천 위치

**Group A**: 피드 상단  
**Group B**: 피드 중간 (10개마다)  

**측정**: 스크롤 깊이, 추천 클릭률

---

## 🔮 향후 개선 방향

### 1단계 (현재) - 기본 추천
```
✅ 선호 유형 기반
✅ 팔로우 작가 기반
✅ 협업 필터링
✅ 트렌딩
```

### 2단계 (3개월 후) - 고급 추천
```
- 검색 기록 활용
- 조회 시간 추적 (긴 조회 = 높은 관심)
- 구매 이력 활용
- 시간대별 추천 (아침/저녁)
```

### 3단계 (6개월 후) - AI 추천
```
- 이미지 유사도 (ML 모델)
- 색상 팔레트 기반
- 스타일 분석
- 자연어 처리 (description)
```

---

## 📊 예상 효과

### Before (추천 없음)
```
사용자 체류 시간: 5분
좋아요율: 2%
구매 전환율: 0.5%
```

### After (추천 적용)
```
사용자 체류 시간: 12분 (+140%)
좋아요율: 5% (+150%)
구매 전환율: 1.2% (+140%)
```

**참고**: Instagram, Pinterest 수치 기반 추정

---

## 🛠️ 설치 및 사용

### 1. DB 함수 실행

```sql
-- Supabase SQL Editor
database/recommendation-helper-functions.sql
```

### 2. 서비스 import

```typescript
// src/screens/HomeScreen.tsx
import { getSmartRecommendations } from '../services/recommendationService';

const artworks = await getSmartRecommendations(userId, 20);
```

### 3. 완료!

---

## 💡 추천 알고리즘 비밀

**Netflix/YouTube 스타일**:
```
70% - 개인 맞춤 (좋아요/북마크 기반)
20% - 새로운 발견 (협업 필터링)
10% - 인기 작품 (트렌딩)
```

**Instagram/TikTok 스타일**:
```
50% - 팔로우 작가
30% - 유사 작품
20% - 트렌딩
```

**ArtYard 현재**:
```
50% - 개인화 (선호 유형/작가)
30% - 협업 필터링
20% - 트렌딩

→ 균형잡힌 추천! ⭐
```

---

## 🎉 결론

**네, 가능합니다!** 

이미 필요한 데이터가 모두 있고,  
알고리즘도 구현 완료했습니다!

**파일**:
- ✅ `src/services/recommendationService.ts`
- ✅ `database/recommendation-helper-functions.sql`

**다음 단계**:
1. DB 함수 실행 (1분)
2. HomeScreen에 적용 (10분)
3. 완료! 🚀

**개선 순서**:
```
출시: 인기 작품만
1주 후: 개인화 추천 추가
1개월 후: 협업 필터링 추가
3개월 후: 통합 추천 (Smart Mix)
6개월 후: AI/ML 추천
```

---

**천천히 점진적으로 개선하면 됩니다!** 📈

