/**
 * 작품 추천 알고리즘
 * 좋아요, 북마크, 팔로우, 검색 등 다양한 데이터 기반
 */

import { supabase } from './supabase';
import type { Artwork } from '../types';

interface UserPreferences {
  favoriteTypes: string[]; // 선호 작품 유형
  favoriteArtists: string[]; // 선호 작가
  priceRange: { min: number; max: number }; // 선호 가격대
  interactionScore: Record<string, number>; // 작품별 관심도
}

/**
 * 사용자 선호도 분석
 */
export async function analyzeUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    // 1. 좋아요한 작품 분석
    const { data: likedArtworks } = await supabase
      .from('likes')
      .select(`
        artwork:artworks(id, material, price, author_id)
      `)
      .eq('user_id', userId)
      .limit(100);

    // 2. 북마크한 작품 분석
    const { data: bookmarkedArtworks } = await supabase
      .from('bookmarks')
      .select(`
        artwork:artworks(id, material, price, author_id)
      `)
      .eq('user_id', userId)
      .limit(100);

    // 3. 팔로우한 작가
    const { data: followedArtists } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    // 4. 검색 기록 (있다면)
    // TODO: 검색 기록 테이블 추가 시 구현

    // 데이터 집계
    const typeCount: Record<string, number> = {};
    const artistCount: Record<string, number> = {};
    const prices: number[] = [];

    // 좋아요 데이터 처리 (가중치: 2)
    likedArtworks?.forEach((item: any) => {
      const artwork = item.artwork;
      if (!artwork) return;

      typeCount[artwork.material] = (typeCount[artwork.material] || 0) + 2;
      artistCount[artwork.author_id] = (artistCount[artwork.author_id] || 0) + 2;
      
      const price = parseFloat(artwork.price);
      if (!isNaN(price)) {
        prices.push(price);
      }
    });

    // 북마크 데이터 처리 (가중치: 3 - 더 강한 관심)
    bookmarkedArtworks?.forEach((item: any) => {
      const artwork = item.artwork;
      if (!artwork) return;

      typeCount[artwork.material] = (typeCount[artwork.material] || 0) + 3;
      artistCount[artwork.author_id] = (artistCount[artwork.author_id] || 0) + 3;
      
      const price = parseFloat(artwork.price);
      if (!isNaN(price)) {
        prices.push(price);
        prices.push(price); // 북마크는 가중치 2배
        prices.push(price);
      }
    });

    // 팔로우 작가 (가중치: 5 - 매우 강한 관심)
    followedArtists?.forEach((follow) => {
      artistCount[follow.following_id] = (artistCount[follow.following_id] || 0) + 5;
    });

    // 선호 작품 유형 (상위 3개)
    const favoriteTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    // 선호 작가 (상위 10명)
    const favoriteArtists = Object.entries(artistCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([artistId]) => artistId);

    // 선호 가격대 (중앙값 기준 ±50%)
    const priceRange = calculatePriceRange(prices);

    return {
      favoriteTypes,
      favoriteArtists,
      priceRange,
      interactionScore: {},
    };
  } catch (error) {
    console.error('Failed to analyze preferences:', error);
    // 기본값 반환
    return {
      favoriteTypes: [],
      favoriteArtists: [],
      priceRange: { min: 0, max: 1000000 },
      interactionScore: {},
    };
  }
}

/**
 * 선호 가격대 계산
 */
function calculatePriceRange(prices: number[]): { min: number; max: number } {
  if (prices.length === 0) {
    return { min: 0, max: 1000000 };
  }

  prices.sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  
  return {
    min: Math.max(0, median * 0.5), // 중앙값의 50%
    max: median * 1.5, // 중앙값의 150%
  };
}

/**
 * 개인화된 작품 추천
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20
): Promise<Artwork[]> {
  try {
    // 1. 사용자 선호도 분석
    const preferences = await analyzeUserPreferences(userId);

    console.log('🎯 User Preferences:', {
      types: preferences.favoriteTypes,
      artistsCount: preferences.favoriteArtists.length,
      priceRange: preferences.priceRange,
    });

    // 2. 이미 본 작품 제외 (좋아요, 북마크, 자신의 작품)
    const { data: seenArtworkIds } = await supabase.rpc('get_seen_artworks', {
      user_id_input: userId,
    });

    const excludeIds = seenArtworkIds?.map((item: any) => item.artwork_id) || [];

    // 3. 추천 쿼리 구성
    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .eq('is_hidden', false)
      .neq('author_id', userId); // 자신의 작품 제외

    // 이미 본 작품 제외
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // 4. 추천 점수 계산을 위한 데이터 가져오기
    const { data: artworks, error } = await query.limit(100); // 후보 100개

    if (error) throw error;
    if (!artworks || artworks.length === 0) {
      return [];
    }

    // 5. 각 작품에 점수 부여
    const scoredArtworks = artworks.map((artwork) => {
      let score = 0;

      // 선호 작품 유형 (+30점)
      if (preferences.favoriteTypes.includes(artwork.material)) {
        const rank = preferences.favoriteTypes.indexOf(artwork.material);
        score += 30 - (rank * 5); // 1순위: 30점, 2순위: 25점, 3순위: 20점
      }

      // 선호 작가 (+50점)
      if (preferences.favoriteArtists.includes(artwork.author_id)) {
        const rank = preferences.favoriteArtists.indexOf(artwork.author_id);
        score += 50 - (rank * 2); // 1순위: 50점, 10순위: 32점
      }

      // 선호 가격대 (+20점)
      const price = parseFloat(artwork.price);
      if (!isNaN(price)) {
        if (price >= preferences.priceRange.min && price <= preferences.priceRange.max) {
          score += 20;
        }
      }

      // 인기도 (+10점)
      score += Math.min(10, artwork.likes_count * 0.5); // 좋아요 20개 = 10점

      // 최신성 (+15점)
      const daysOld = (Date.now() - new Date(artwork.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 15; // 7일 이내 신작
      else if (daysOld < 30) score += 10; // 30일 이내
      else if (daysOld < 90) score += 5; // 90일 이내

      // 댓글 활성도 (+5점)
      score += Math.min(5, artwork.comments_count * 0.5);

      return {
        ...artwork,
        recommendationScore: score,
      };
    });

    // 6. 점수 순으로 정렬
    scoredArtworks.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // 7. 상위 작품 반환
    return scoredArtworks.slice(0, limit);
    
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    // 실패 시 인기 작품 반환 (Fallback)
    return getPopularArtworks(limit);
  }
}

/**
 * 인기 작품 (Fallback)
 */
async function getPopularArtworks(limit: number = 20): Promise<Artwork[]> {
  const { data } = await supabase
    .from('artworks')
    .select(`
      *,
      author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
    `)
    .eq('is_hidden', false)
    .order('likes_count', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * 유사 작품 추천 (작품 상세 페이지용)
 */
export async function getSimilarArtworks(
  artworkId: string,
  userId?: string,
  limit: number = 10
): Promise<Artwork[]> {
  try {
    // 기준 작품 정보 가져오기
    const { data: baseArtwork } = await supabase
      .from('artworks')
      .select('material, price, author_id')
      .eq('id', artworkId)
      .single();

    if (!baseArtwork) return [];

    // 유사 작품 찾기
    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .eq('is_hidden', false)
      .neq('id', artworkId); // 현재 작품 제외

    // 같은 작가 작품 우선
    const { data: artworks } = await query.limit(50);

    if (!artworks) return [];

    // 점수 계산
    const scored = artworks.map((artwork) => {
      let score = 0;

      // 같은 작가 (+50점)
      if (artwork.author_id === baseArtwork.author_id) {
        score += 50;
      }

      // 같은 유형 (+30점)
      if (artwork.material === baseArtwork.material) {
        score += 30;
      }

      // 비슷한 가격 (+20점)
      const basePrice = parseFloat(baseArtwork.price);
      const artworkPrice = parseFloat(artwork.price);
      if (!isNaN(basePrice) && !isNaN(artworkPrice)) {
        const priceDiff = Math.abs(basePrice - artworkPrice) / basePrice;
        if (priceDiff < 0.3) score += 20; // 30% 이내
        else if (priceDiff < 0.5) score += 10; // 50% 이내
      }

      // 인기도 (+10점)
      score += Math.min(10, artwork.likes_count * 0.5);

      return { ...artwork, similarityScore: score };
    });

    // 점수 순 정렬
    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    return scored.slice(0, limit);
    
  } catch (error) {
    console.error('Failed to get similar artworks:', error);
    return [];
  }
}

/**
 * 트렌딩 작품 (최근 인기)
 */
export async function getTrendingArtworks(
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 20
): Promise<Artwork[]> {
  try {
    // 기간 설정
    const intervals = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
    };

    // 최근 좋아요가 많은 작품
    const { data } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department),
        recent_likes:likes!inner(created_at)
      `)
      .eq('is_hidden', false)
      .gte('likes.created_at', `now() - interval '${intervals[period]}'`)
      .order('likes_count', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Failed to get trending artworks:', error);
    return getPopularArtworks(limit);
  }
}

/**
 * 협업 필터링 (Collaborative Filtering)
 * "비슷한 취향의 사용자가 좋아한 작품"
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit: number = 20
): Promise<Artwork[]> {
  try {
    // 1. 내가 좋아요한 작품
    const { data: myLikes } = await supabase
      .from('likes')
      .select('artwork_id')
      .eq('user_id', userId);

    if (!myLikes || myLikes.length === 0) {
      return getPopularArtworks(limit);
    }

    const myArtworkIds = myLikes.map(like => like.artwork_id);

    // 2. 같은 작품을 좋아요한 다른 사용자 찾기
    const { data: similarUsers } = await supabase
      .from('likes')
      .select('user_id')
      .in('artwork_id', myArtworkIds)
      .neq('user_id', userId)
      .limit(50);

    if (!similarUsers || similarUsers.length === 0) {
      return getPopularArtworks(limit);
    }

    const similarUserIds = [...new Set(similarUsers.map(u => u.user_id))];

    // 3. 비슷한 사용자들이 좋아요한 작품 (내가 아직 안 본 것)
    const { data: recommendations } = await supabase
      .from('likes')
      .select(`
        artwork:artworks(
          *,
          author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
        )
      `)
      .in('user_id', similarUserIds)
      .not('artwork_id', 'in', `(${myArtworkIds.join(',')})`)
      .limit(100);

    if (!recommendations) return [];

    // 4. 추천 횟수로 점수 계산
    const artworkScores: Record<string, { artwork: any; count: number }> = {};

    recommendations.forEach((item: any) => {
      const artwork = item.artwork;
      if (!artwork || artwork.is_hidden) return;

      if (!artworkScores[artwork.id]) {
        artworkScores[artwork.id] = { artwork, count: 0 };
      }
      artworkScores[artwork.id].count += 1;
    });

    // 5. 많이 추천된 순으로 정렬
    const sorted = Object.values(artworkScores)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.artwork);

    return sorted;
    
  } catch (error) {
    console.error('Failed to get collaborative recommendations:', error);
    return getPopularArtworks(limit);
  }
}

/**
 * 통합 추천 (여러 알고리즘 믹스)
 */
export async function getSmartRecommendations(
  userId: string,
  limit: number = 20
): Promise<Artwork[]> {
  try {
    console.log('🤖 Smart Recommendations 생성 중...');

    // 병렬로 여러 추천 가져오기
    const [personalized, collaborative, trending] = await Promise.all([
      getPersonalizedRecommendations(userId, 10),
      getCollaborativeRecommendations(userId, 10),
      getTrendingArtworks('week', 10),
    ]);

    // 중복 제거 및 믹스
    const allRecommendations = new Map<string, Artwork>();

    // 1순위: 개인화 추천 (가중치: 3)
    personalized.forEach((artwork, index) => {
      allRecommendations.set(artwork.id, {
        ...artwork,
        finalScore: 100 - (index * 3),
      } as any);
    });

    // 2순위: 협업 필터링 (가중치: 2)
    collaborative.forEach((artwork, index) => {
      if (!allRecommendations.has(artwork.id)) {
        allRecommendations.set(artwork.id, {
          ...artwork,
          finalScore: 70 - (index * 2),
        } as any);
      }
    });

    // 3순위: 트렌딩 (가중치: 1)
    trending.forEach((artwork, index) => {
      if (!allRecommendations.has(artwork.id)) {
        allRecommendations.set(artwork.id, {
          ...artwork,
          finalScore: 40 - index,
        } as any);
      }
    });

    // 점수 순 정렬
    const sorted = Array.from(allRecommendations.values())
      .sort((a: any, b: any) => b.finalScore - a.finalScore)
      .slice(0, limit);

    console.log(`✅ ${sorted.length}개 추천 작품 생성 완료`);
    
    return sorted;
    
  } catch (error) {
    console.error('Failed to get smart recommendations:', error);
    return getPopularArtworks(limit);
  }
}

/**
 * 신규 사용자용 추천 (데이터 없을 때)
 */
export async function getNewUserRecommendations(limit: number = 20): Promise<Artwork[]> {
  // 큐레이션된 우수 작품 + 인기 작품
  const { data } = await supabase
    .from('artworks')
    .select(`
      *,
      author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
    `)
    .eq('is_hidden', false)
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

