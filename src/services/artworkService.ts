/**
 * 작품 관련 API 서비스
 */

import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';
import type { Artwork, PaginatedResponse } from '../types';
import AIOrchestrationService from './ai/aiOrchestrationService';

/**
 * 작품 목록 가져오기 (페이지네이션)
 */
export const getArtworks = async (
  page: number = 1, 
  limit: number = 10,
  filter?: {
    material?: string;
    price?: string;
    search?: string;
    priceRange?: { min: number; max: number };
    sizeRange?: { min: number; max: number };
    categories?: string[];
  }
): Promise<PaginatedResponse<Artwork>> => {
  try {
    // 사용자 정보 가져오기 (네트워크 실패 시 authStore fallback)
    let currentUserId: string | undefined;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    } catch (authError) {
      // 네트워크 실패 시 authStore에서 가져오기
      const authState = useAuthStore.getState();
      currentUserId = authState.session?.user?.id || authState.user?.id;
      console.log('⚠️ getUser() 실패, authStore 사용:', currentUserId);
    }

    // 챌린지 작품 ID 목록 가져오기 (메인 페이지에서 제외)
    const { data: challengeEntries } = await supabase
      .from('challenge_entries')
      .select('artwork_id');
    
    const challengeArtworkIds = challengeEntries?.map(entry => entry.artwork_id).filter(Boolean) || [];

    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `, { count: 'exact' })
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    
    // 챌린지 작품 제외 (올바른 Supabase 문법 사용)
    if (challengeArtworkIds.length > 0) {
      // PostgREST 문법: not.in.(value1,value2,...)
      query = query.not('id', 'in', `(${challengeArtworkIds.join(',')})`);
    }

    // 필터 적용
    if (filter?.material) {
      query = query.eq('material', filter.material);
    }
    if (filter?.price) {
      query = query.eq('price', filter.price);
    }
    if (filter?.search) {
      query = query.or(`title.ilike.%${filter.search}%, description.ilike.%${filter.search}%`);
    }
    
    // 카테고리 필터 (복수 선택 가능)
    if (filter?.categories && filter.categories.length > 0) {
      query = query.in('category', filter.categories);
    }
    
    // 가격 범위 필터 (price가 문자열이므로 CAST 필요)
    if (filter?.priceRange) {
      const { min, max } = filter.priceRange;
      if (min > 0) {
        query = query.gte('price::numeric', min);
      }
      if (max < 100000000) {
        query = query.lte('price::numeric', max);
      }
    }
    
    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // 크기 범위 필터 (클라이언트 사이드 - OR 조건)
    let filteredData = data || [];
    if (filter?.sizeRange) {
      const { min, max } = filter.sizeRange;
      filteredData = filteredData.filter(artwork => {
        if (!artwork.size) return false;
        
        // size 형식: "50×70cm" 또는 "50 x 70 cm" 등에서 숫자 추출
        const numbers = artwork.size.match(/\d+/g);
        if (!numbers || numbers.length === 0) return false;
        
        // 추출된 숫자 중 하나라도 범위 내면 포함 (OR 조건)
        return numbers.some(num => {
          const size = parseInt(num);
          return size >= min && size <= max;
        });
      });
    }

    // 사용자별 좋아요/북마크 상태 조회
    let processedData = filteredData;
    if (currentUserId && processedData.length > 0) {
      const artworkIds = processedData.map(artwork => artwork.id);
      
      // 좋아요 상태 조회
      const { data: likes } = await supabase
        .from('likes')
        .select('artwork_id')
        .eq('user_id', currentUserId)
        .in('artwork_id', artworkIds);
      
      // 북마크 상태 조회
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('artwork_id')
        .eq('user_id', currentUserId)
        .in('artwork_id', artworkIds);
      
      const likedArtworkIds = new Set(likes?.map(like => like.artwork_id) || []);
      const bookmarkedArtworkIds = new Set(bookmarks?.map(bookmark => bookmark.artwork_id) || []);
      
      processedData = processedData.map(artwork => ({
        ...artwork,
        is_liked: likedArtworkIds.has(artwork.id),
        is_bookmarked: bookmarkedArtworkIds.has(artwork.id),
      }));
    }

    // 크기 필터를 적용했다면 실제 필터링된 개수 반환
    const actualCount = filter?.sizeRange ? filteredData.length : (count || 0);
    
    return {
      data: processedData,
      count: actualCount,
      page,
      has_more: actualCount > page * limit,
    };
  } catch (error: any) {
    console.error('❌ 작품 목록 가져오기 오류:', error);
    console.error('❌ 에러 상세:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    
    // 네트워크 에러 시 빈 배열 반환 (앱이 멈추지 않도록)
    console.warn('⚠️ 에러 발생으로 빈 배열 반환');
    return {
      data: [],
      count: 0,
      page,
      has_more: false,
    };
  }
};

/**
 * 특정 작품 상세 정보 가져오기
 */
export const getArtworkDetail = async (artworkId: string, userId?: string): Promise<Artwork> => {
  try {
    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .eq('id', artworkId)
      .eq('is_hidden', false)
      .single();

    const { data, error } = await query;

    if (error) throw error;

    if (!data) {
      throw new Error('작품을 찾을 수 없습니다.');
    }

    // 사용자별 좋아요/북마크 상태 확인
    if (userId) {
      try {
        const [likeResult, bookmarkResult] = await Promise.all([
          supabase
            .from('likes')
            .select('*')
            .eq('artwork_id', artworkId)
            .eq('user_id', userId)
            .maybeSingle()
            .then(res => ({ ...res, error: null })) // 406 에러 완전 무시
            .catch(() => ({ data: null, error: null })),
          supabase
            .from('bookmarks')
            .select('*')
            .eq('artwork_id', artworkId)
            .eq('user_id', userId)
            .maybeSingle()
            .then(res => ({ ...res, error: null })) // 406 에러 완전 무시
            .catch(() => ({ data: null, error: null })),
        ]);

        data.is_liked = !!likeResult.data;
        data.is_bookmarked = !!bookmarkResult.data;
      } catch (err) {
        // 에러 무시 - 기본값 사용
        data.is_liked = false;
        data.is_bookmarked = false;
      }
    }

    return data;
  } catch (error) {
    console.error('작품 상세 정보 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 작품 업로드
 */
export const uploadArtwork = async (artworkData: {
  title: string;
  description: string;
  material: string;
  category?: string;
  size: string;
  year: number;
  edition: string;
  price: string;
  images: string[]; // 업로드된 이미지 URL들
  location_country?: string;
  location_state?: string;
  location_city?: string;
  location_full?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Artwork> => {
  try {
    // Rate limiting 체크
    const { enforceRateLimit } = await import('../utils/rateLimiter');
    enforceRateLimit('ARTWORK_UPLOAD');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('artworks')
      .insert({
        ...artworkData,
        author_id: user.id,
      })
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .single();

    if (error) throw error;

    // AI 시스템에 업로드 분석 요청 (비동기로 실행)
    try {
      await AIOrchestrationService.analyzeContentUpload(
        user.id,
        data.id,
        {
          title: artworkData.title,
          description: artworkData.description,
          imageUrls: artworkData.images,
          material: artworkData.material,
          price: artworkData.price,
          metadata: {
            size: artworkData.size,
            year: artworkData.year,
            edition: artworkData.edition,
            location: {
              country: artworkData.location_country,
              state: artworkData.location_state,
              city: artworkData.location_city,
              full: artworkData.location_full,
              coordinates: {
                lat: artworkData.latitude,
                lng: artworkData.longitude
              }
            }
          }
        },
        'artwork_upload'
      );
    } catch (error) {
      console.warn('AI 시스템 분석 실패 (업로드는 정상 완료):', error);
    }

    return data;
  } catch (error) {
    console.error('작품 업로드 오류:', error);
    console.error('오류 상세 정보:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
};

/**
 * 작품 좋아요 토글
 */
export const toggleArtworkLike = async (artworkId: string): Promise<boolean> => {
  console.log('🔄 toggleArtworkLike called for:', artworkId);
  
  try {
    console.log('🔐 Getting current user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ No user logged in');
      throw new Error('로그인이 필요합니다.');
    }
    
    console.log('✅ User authenticated:', user.id);

    // 현재 좋아요 상태 확인
    console.log('🔍 Checking existing like status...');
    let existingLike = null;
    
    try {
      const result = await supabase
        .from('likes')
        .select('*')
        .eq('artwork_id', artworkId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      existingLike = result.data;
      // 에러 완전 무시
    } catch (err) {
      // 모든 에러 무시 (406 포함)
      console.log('⚠️ Like check error (ignored):', err);
    }
    
    console.log('📊 Existing like found:', !!existingLike);

    if (existingLike) {
      // 좋아요 제거
      console.log('➖ Removing existing like...');
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('artwork_id', artworkId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Error deleting like:', deleteError);
        throw deleteError;
      }
      console.log('✅ Like deleted successfully');

      console.log('📉 Like removed from DB, NOT updating likes_count (DB trigger will handle it)');

      // AI 시스템에 사용자 행동 알림
      try {
        await AIOrchestrationService.handleUserAction(
          user.id,
          'unlike',
          artworkId,
          { timestamp: new Date().toISOString() },
          'artwork_interaction'
        );
      } catch (error) {
        console.warn('AI 시스템 연동 실패:', error);
      }

      return false; // 좋아요 제거됨
    } else {
      // 좋아요 추가
      console.log('➕ Adding new like...');
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          artwork_id: artworkId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('❌ Error inserting like:', insertError);
        throw insertError;
      }
      console.log('✅ Like inserted successfully');

      console.log('📈 Like added to DB, NOT updating likes_count (DB trigger will handle it)');

      // AI 시스템에 사용자 행동 알림
      try {
        await AIOrchestrationService.handleUserAction(
          user.id,
          'like',
          artworkId,
          { timestamp: new Date().toISOString() },
          'artwork_interaction'
        );
      } catch (error) {
        console.warn('AI 시스템 연동 실패:', error);
      }

      return true; // 좋아요 추가됨
    }
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    throw error;
  }
};

/**
 * 작품 북마크 토글
 */
export const toggleArtworkBookmark = async (artworkId: string): Promise<boolean> => {
  console.log('🔄 toggleArtworkBookmark called for:', artworkId);
  
  try {
    console.log('🔐 Getting current user...');
    
    // 타임아웃 추가
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 10000)
    );
    
    const { data: { user }, error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;
    
    console.log('📊 Auth response received:', { user: !!user, error: !!authError });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ No user logged in');
      throw new Error('로그인이 필요합니다.');
    }
    
    console.log('✅ User authenticated:', user.id);

    // 현재 북마크 상태 확인
    console.log('🔍 Checking existing bookmark status...');
    let existingBookmark = null;
    
    try {
      const result = await supabase
        .from('bookmarks')
        .select('*')
        .eq('artwork_id', artworkId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      existingBookmark = result.data;
      // 에러 완전 무시
    } catch (err) {
      // 모든 에러 무시 (406 포함)
      console.log('⚠️ Bookmark check error (ignored):', err);
    }
    
    console.log('📊 Existing bookmark found:', !!existingBookmark);

    if (existingBookmark) {
      // 북마크 제거
      console.log('➖ Removing existing bookmark...');
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('artwork_id', artworkId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error deleting bookmark:', error);
        throw error;
      }
      console.log('✅ Bookmark deleted successfully');
      
      // AI 시스템에 사용자 행동 알림
      try {
        await AIOrchestrationService.handleUserAction(
          user.id,
          'unbookmark',
          artworkId,
          { timestamp: new Date().toISOString() },
          'artwork_interaction'
        );
      } catch (error) {
        console.warn('AI 시스템 연동 실패:', error);
      }
      
      return false; // 북마크 제거됨
    } else {
      // 북마크 추가
      console.log('➕ Adding new bookmark...');
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          artwork_id: artworkId,
          user_id: user.id,
        });

      if (error) {
        console.error('❌ Error inserting bookmark:', error);
        throw error;
      }
      console.log('✅ Bookmark inserted successfully');
      
      // AI 시스템에 사용자 행동 알림
      try {
        await AIOrchestrationService.handleUserAction(
          user.id,
          'bookmark',
          artworkId,
          { timestamp: new Date().toISOString() },
          'artwork_interaction'
        );
      } catch (error) {
        console.warn('AI 시스템 연동 실패:', error);
      }
      
      return true; // 북마크 추가됨
    }
  } catch (error) {
    console.error('💥 북마크 토글 오류:', error);
    console.error('💥 오류 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

/**
 * 작품 수정
 */
export const updateArtwork = async (
  artworkId: string,
  updateData: {
    title?: string;
    description?: string;
    material?: string;
    size?: string;
    year?: number;
    edition?: string;
    price?: string;
  }
): Promise<Artwork> => {
  try {
    console.log('🔄 작품 수정 시작:', { artworkId, updateData });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 작품 소유자 확인
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('author_id')
      .eq('id', artworkId)
      .single();

    if (fetchError) throw fetchError;
    
    if (artwork.author_id !== user.id) {
      throw new Error('자신의 작품만 수정할 수 있습니다.');
    }

      // 작품 업데이트
      const { data, error } = await supabase
        .from('artworks')
        .update({
          ...updateData,
        })
        .eq('id', artworkId)
        .select(`
          *,
          author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
        `)
        .single();

    if (error) throw error;

    console.log('✅ 작품 수정 완료:', data.id);
    return data;
  } catch (error) {
    console.error('💥 작품 수정 오류:', error);
    throw error;
  }
};

/**
 * 작품 삭제 (소프트 삭제)
 */
export const deleteArtwork = async (artworkId: string): Promise<void> => {
  try {
    console.log('🗑️ 작품 삭제 서비스 시작:', artworkId);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ 인증 오류:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ 사용자 인증 실패');
      throw new Error('로그인이 필요합니다.');
    }

    console.log('✅ 사용자 인증 성공:', user.id);

    // 작품 소유자 확인
    console.log('🔍 작품 소유자 확인 중...');
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('author_id, title, is_hidden')
      .eq('id', artworkId)
      .single();

    if (fetchError) {
      console.error('❌ 작품 조회 오류:', fetchError);
      throw fetchError;
    }

    if (!artwork) {
      console.error('❌ 작품을 찾을 수 없음');
      throw new Error('작품을 찾을 수 없습니다.');
    }

    console.log('📊 작품 정보:', {
      artworkId,
      title: artwork.title,
      authorId: artwork.author_id,
      currentUserId: user.id,
      isHidden: artwork.is_hidden,
      isOwner: artwork.author_id === user.id
    });
    
    if (artwork.author_id !== user.id) {
      console.error('❌ 권한 없음 - 작품 소유자가 아님');
      throw new Error('자신의 작품만 삭제할 수 있습니다.');
    }

    console.log('✅ 권한 확인 완료 - 소프트 삭제 진행');

    // 소프트 삭제 (is_hidden = true)
    const { error: updateError } = await supabase
      .from('artworks')
      .update({
        is_hidden: true,
      })
      .eq('id', artworkId);

    if (updateError) {
      console.error('❌ 작품 업데이트 오류:', updateError);
      console.error('❌ 업데이트 오류 상세:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }

    console.log('✅ 작품 삭제 완료:', artwork.title);
    console.log('📊 삭제 결과: is_hidden = true로 설정됨');

  } catch (error) {
    console.error('💥 작품 삭제 서비스 오류:', error);
    console.error('💥 오류 상세 정보:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    throw error;
  }
};

