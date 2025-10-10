/**
 * 고급 필터링 시스템 서비스
 */

import { supabase } from './supabase';
import { AdvancedFilter, AdvancedSearchResult, ExtendedArtwork, ArtworkStyle, ColorAnalysis } from '../types/advanced';

/**
 * 고급 필터를 적용한 작품 검색
 */
export const searchArtworksAdvanced = async (
  filter: AdvancedFilter,
  page: number = 1,
  limit: number = 10
): Promise<AdvancedSearchResult> => {
  const startTime = Date.now();
  
  try {
    const offset = (page - 1) * limit;
    
    // 기본 쿼리 구성
    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(
          id, handle, avatar_url, school, department, is_verified_school
        )
      `, { count: 'exact' })
      .eq('is_hidden', false);

    // 가격 범위 필터
    if (filter.priceRange) {
      const { min, max } = filter.priceRange;
      // price 컬럼에서 숫자만 추출하여 비교
      query = query
        .gte('price_numeric', min)
        .lte('price_numeric', max);
    }

    // 크기 범위 필터
    if (filter.sizeRange) {
      if (filter.sizeRange.width) {
        query = query
          .gte('width_cm', filter.sizeRange.width.min)
          .lte('width_cm', filter.sizeRange.width.max);
      }
      if (filter.sizeRange.height) {
        query = query
          .gte('height_cm', filter.sizeRange.height.min)
          .lte('height_cm', filter.sizeRange.height.max);
      }
    }

    // 연도 범위 필터
    if (filter.yearRange) {
      query = query
        .gte('year', filter.yearRange.min)
        .lte('year', filter.yearRange.max);
    }

    // 재료 필터
    if (filter.materials && filter.materials.length > 0) {
      query = query.in('material', filter.materials);
    }

    // 정렬 적용
    switch (filter.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price_numeric', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price_numeric', { ascending: false });
        break;
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'trending':
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    const { data: artworks, error, count } = await query;

    if (error) throw error;

    let filteredArtworks = artworks || [];

    // 스타일 필터 (별도 쿼리로 처리)
    if (filter.styles && filter.styles.length > 0) {
      const artworkIds = filteredArtworks.map(artwork => artwork.id);
      
      const { data: styleRelations } = await supabase
        .from('artwork_style_relations')
        .select('artwork_id')
        .in('style_id', filter.styles)
        .in('artwork_id', artworkIds);

      const filteredIds = new Set(styleRelations?.map(rel => rel.artwork_id) || []);
      filteredArtworks = filteredArtworks.filter(artwork => filteredIds.has(artwork.id));
    }

    // 색상 필터 (별도 쿼리로 처리)
    if (filter.colors && filter.colors.length > 0) {
      const artworkIds = filteredArtworks.map(artwork => artwork.id);
      
      const { data: colorMatches } = await supabase
        .from('artwork_colors')
        .select('artwork_id')
        .in('color_hex', filter.colors)
        .in('artwork_id', artworkIds)
        .eq('is_dominant', true);

      const colorFilteredIds = new Set(colorMatches?.map(color => color.artwork_id) || []);
      filteredArtworks = filteredArtworks.filter(artwork => colorFilteredIds.has(artwork.id));
    }

    // 현재 사용자의 좋아요/북마크 상태 추가
    const { data: { user } } = await supabase.auth.getUser();
    if (user && filteredArtworks.length > 0) {
      const artworkIds = filteredArtworks.map(artwork => artwork.id);
      
      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('likes')
          .select('artwork_id')
          .eq('user_id', user.id)
          .in('artwork_id', artworkIds),
        supabase
          .from('bookmarks')
          .select('artwork_id')
          .eq('user_id', user.id)
          .in('artwork_id', artworkIds)
      ]);

      const likedIds = new Set(likesResult.data?.map(like => like.artwork_id) || []);
      const bookmarkedIds = new Set(bookmarksResult.data?.map(bookmark => bookmark.artwork_id) || []);

      filteredArtworks = filteredArtworks.map(artwork => ({
        ...artwork,
        is_liked: likedIds.has(artwork.id),
        is_bookmarked: bookmarkedIds.has(artwork.id),
      }));
    }

    const searchTime = Date.now() - startTime;

    return {
      artworks: filteredArtworks as ExtendedArtwork[],
      total_count: count || 0,
      page,
      has_more: (count || 0) > page * limit,
      filters_applied: filter,
      search_time_ms: searchTime,
    };

  } catch (error) {
    console.error('고급 검색 오류:', error);
    return {
      artworks: [],
      total_count: 0,
      page,
      has_more: false,
      filters_applied: filter,
      search_time_ms: Date.now() - startTime,
    };
  }
};

/**
 * 모든 작품 스타일 조회
 */
export const getArtworkStyles = async (): Promise<ArtworkStyle[]> => {
  try {
    const { data, error } = await supabase
      .from('artwork_styles')
      .select('*')
      .order('name');

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('작품 스타일 조회 오류:', error);
    return [];
  }
};

/**
 * 작품에 스타일 태그 추가
 */
export const addArtworkStyle = async (
  artworkId: string,
  styleId: string,
  confidence: number = 1.0
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('artwork_style_relations')
      .insert({
        artwork_id: artworkId,
        style_id: styleId,
        confidence_score: confidence,
      });

    if (error) {
      if (error.code === '23505') {
        console.log('이미 해당 스타일이 추가되어 있습니다.');
        return true;
      }
      throw error;
    }

    console.log('✅ 작품 스타일 추가 성공');
    return true;

  } catch (error) {
    console.error('❌ 작품 스타일 추가 실패:', error);
    return false;
  }
};

/**
 * 작품 색상 분석 및 저장
 */
export const analyzeAndSaveArtworkColors = async (
  artworkId: string,
  imageUrl: string
): Promise<ColorAnalysis | null> => {
  try {
    // 실제 구현에서는 이미지 분석 AI 서비스 사용
    // 여기서는 시뮬레이션 데이터 생성
    const mockColors = [
      { hex: '#FF6B6B', name: 'Red', percentage: 35.5 },
      { hex: '#4ECDC4', name: 'Teal', percentage: 28.2 },
      { hex: '#45B7D1', name: 'Blue', percentage: 20.1 },
      { hex: '#96CEB4', name: 'Green', percentage: 16.2 },
    ];

    // 색상 정보를 데이터베이스에 저장
    const colorInserts = mockColors.map((color, index) => ({
      artwork_id: artworkId,
      color_hex: color.hex,
      color_name: color.name,
      percentage: color.percentage,
      is_dominant: index === 0, // 첫 번째 색상을 주요 색상으로 설정
    }));

    const { error } = await supabase
      .from('artwork_colors')
      .insert(colorInserts);

    if (error) throw error;

    const analysis: ColorAnalysis = {
      dominant_colors: mockColors,
      color_harmony: 'complementary',
      brightness: 'medium',
      saturation: 'moderate',
    };

    console.log('✅ 작품 색상 분석 완료:', analysis);
    return analysis;

  } catch (error) {
    console.error('❌ 작품 색상 분석 실패:', error);
    return null;
  }
};

/**
 * 작품의 색상 정보 조회
 */
export const getArtworkColors = async (artworkId: string) => {
  try {
    const { data, error } = await supabase
      .from('artwork_colors')
      .select('*')
      .eq('artwork_id', artworkId)
      .order('percentage', { ascending: false });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('작품 색상 조회 오류:', error);
    return [];
  }
};

/**
 * 인기 색상 조회 (통계)
 */
export const getPopularColors = async (limit: number = 10) => {
  try {
    // Supabase에서 GROUP BY는 RPC로 처리해야 함
  const { data, error } = await supabase
      .rpc('get_popular_colors', { 
        limit_count: limit 
      });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('인기 색상 조회 오류:', error);
    return [];
  }
};

/**
 * 필터 옵션을 위한 통계 데이터 조회
 */
export const getFilterStatistics = async () => {
  try {
    // 가격 범위 통계
    const { data: priceStats } = await supabase
      .from('artworks')
      .select('price')
      .not('price', 'is', null)
      .neq('price', '');

    // 크기 범위 통계
    const { data: sizeStats } = await supabase
      .from('artworks')
      .select('width_cm, height_cm')
      .not('width_cm', 'is', null)
      .not('height_cm', 'is', null);

    // 연도 범위 통계
    const { data: yearStats } = await supabase
      .from('artworks')
      .select('year')
      .not('year', 'is', null)
      .order('year');

    // 재료 통계 (임시로 비활성화 - Supabase .group() 메서드 미지원)
    const materialStats: any[] = [];

    // 가격 범위 계산
    const prices = priceStats?.map(item => {
      const numericPrice = parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0');
      return numericPrice;
    }).filter(price => price > 0) || [];

    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    } : { min: 0, max: 10000, avg: 1000 };

    // 크기 범위 계산
    const widths = sizeStats?.map(item => item.width_cm).filter(Boolean) || [];
    const heights = sizeStats?.map(item => item.height_cm).filter(Boolean) || [];

    const sizeRange = {
      width: widths.length > 0 ? {
        min: Math.min(...widths),
        max: Math.max(...widths),
      } : { min: 10, max: 200 },
      height: heights.length > 0 ? {
        min: Math.min(...heights),
        max: Math.max(...heights),
      } : { min: 10, max: 200 },
    };

    // 연도 범위 계산
    const years = yearStats?.map(item => item.year).filter(Boolean) || [];
    const yearRange = years.length > 0 ? {
      min: Math.min(...years),
      max: Math.max(...years),
    } : { min: 2020, max: new Date().getFullYear() };

    return {
      priceRange,
      sizeRange,
      yearRange,
      materials: materialStats || [],
    };

  } catch (error) {
    console.error('필터 통계 조회 오류:', error);
    return {
      priceRange: { min: 0, max: 10000, avg: 1000 },
      sizeRange: {
        width: { min: 10, max: 200 },
        height: { min: 10, max: 200 },
      },
      yearRange: { min: 2020, max: new Date().getFullYear() },
      materials: [],
    };
  }
};
