/**
 * 사용자 관련 서비스
 */

import { supabase } from './supabase';
import { Profile, Artwork, SaleStatus, PaginatedResponse } from '../types';

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 사용자를 찾을 수 없음
        return null;
      }
      throw error;
    }

    return data;

  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error);
    return null;
  }
};

/**
 * 사용자의 작품 목록 조회
 */
export const getUserArtworks = async (
  userId: string,
  page: number = 1,
  limit: number = 12,
  saleStatus?: SaleStatus
): Promise<{ artworks: Artwork[]; hasMore: boolean; total: number }> => {
  try {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(
          id, handle, avatar_url, school, department, is_verified_school
        )
      `, { count: 'exact' })
      .eq('author_id', userId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    // 판매 상태 필터 적용
    if (saleStatus) {
      query = query.eq('sale_status', saleStatus);
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 현재 사용자의 좋아요/북마크 상태 추가
    const { data: { user } } = await supabase.auth.getUser();
    let processedArtworks = data || [];

    if (user && processedArtworks.length > 0) {
      const artworkIds = processedArtworks.map(artwork => artwork.id);
      
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

      processedArtworks = processedArtworks.map(artwork => ({
        ...artwork,
        is_liked: likedIds.has(artwork.id),
        is_bookmarked: bookmarkedIds.has(artwork.id),
      }));
    }

    return {
      artworks: processedArtworks,
      hasMore: (count || 0) > page * limit,
      total: count || 0,
    };

  } catch (error) {
    console.error('사용자 작품 목록 조회 오류:', error);
    return {
      artworks: [],
      hasMore: false,
      total: 0,
    };
  }
};

/**
 * 작품 판매 상태 업데이트
 */
export const updateArtworkSaleStatus = async (
  artworkId: string,
  saleStatus: SaleStatus,
  buyerId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 작품 소유자 확인
    const { data: artwork } = await supabase
      .from('artworks')
      .select('author_id')
      .eq('id', artworkId)
      .single();

    if (!artwork || artwork.author_id !== user.id) {
      throw new Error('작품을 수정할 권한이 없습니다.');
    }

    const updateData: any = {
      sale_status: saleStatus,
    };

    // 판매 완료 시 추가 정보 설정
    if (saleStatus === 'sold') {
      updateData.sold_at = new Date().toISOString();
      if (buyerId) {
        updateData.buyer_id = buyerId;
      }
    } else {
      // 다른 상태로 변경 시 판매 관련 정보 초기화
      updateData.sold_at = null;
      updateData.buyer_id = null;
    }

    const { error } = await supabase
      .from('artworks')
      .update(updateData)
      .eq('id', artworkId);

    if (error) throw error;

    console.log('✅ 작품 판매 상태 업데이트 성공:', saleStatus);
    return { success: true };

  } catch (error: any) {
    console.error('❌ 작품 판매 상태 업데이트 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 통계 조회
 */
export const getUserStats = async (userId: string) => {
  try {
    const [artworksResult, followersResult, followingResult] = await Promise.all([
      // 작품 수 및 판매 통계
      supabase
        .from('artworks')
        .select('sale_status', { count: 'exact' })
        .eq('author_id', userId)
        .eq('is_hidden', false),
      
      // 팔로워 수
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      
      // 팔로잉 수
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    // 판매 상태별 작품 수 계산
    const artworks = artworksResult.data || [];
    const saleStats = {
      total: artworks.length,
      available: artworks.filter(a => a.sale_status === 'available').length,
      sold: artworks.filter(a => a.sale_status === 'sold').length,
      reserved: artworks.filter(a => a.sale_status === 'reserved').length,
      not_for_sale: artworks.filter(a => a.sale_status === 'not_for_sale').length,
    };

    return {
      artworks: saleStats,
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
    };

  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    return {
      artworks: { total: 0, available: 0, sold: 0, reserved: 0, not_for_sale: 0 },
      followers: 0,
      following: 0,
    };
  }
};

/**
 * 인기 아티스트 조회
 */
export const getPopularArtists = async (limit: number = 10): Promise<Profile[]> => {
  try {
    // 팔로워 수가 많은 아티스트 순으로 조회
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        followers:follows!follows_following_id_fkey(count)
      `)
      .limit(limit);

    if (error) throw error;

    // 팔로워 수로 정렬
    const sortedArtists = (data || []).sort((a, b) => {
      const aFollowers = a.followers?.[0]?.count || 0;
      const bFollowers = b.followers?.[0]?.count || 0;
      return bFollowers - aFollowers;
    });

    return sortedArtists;

  } catch (error) {
    console.error('인기 아티스트 조회 오류:', error);
    return [];
  }
};

/**
 * 사용자 검색
 */
export const searchUsers = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Profile>> => {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .or(`handle.ilike.%${query}%,school.ilike.%${query}%,department.ilike.%${query}%`)
      .order('handle')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      has_more: (count || 0) > page * limit,
    };

  } catch (error) {
    console.error('사용자 검색 오류:', error);
    return {
      data: [],
      count: 0,
      page,
      has_more: false,
    };
  }
};
