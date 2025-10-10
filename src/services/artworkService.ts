/**
 * 작품 관련 API 서비스
 */

import { supabase } from './supabase';
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
  }
): Promise<PaginatedResponse<Artwork>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `, { count: 'exact' })
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

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

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // 사용자별 좋아요/북마크 상태 조회
    let processedData = data || [];
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

    return {
      data: processedData,
      count: count || 0,
      page,
      has_more: (count || 0) > page * limit,
    };
  } catch (error) {
    console.error('작품 목록 가져오기 오류:', error);
    throw error;
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
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*')
          .eq('artwork_id', artworkId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('bookmarks')
          .select('*')
          .eq('artwork_id', artworkId)
          .eq('user_id', userId)
          .single(),
      ]);

      data.is_liked = !likeResult.error;
      data.is_bookmarked = !bookmarkResult.error;
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
    const { data: existingLike, error: selectError } = await supabase
      .from('likes')
      .select('*')
      .eq('artwork_id', artworkId)
      .eq('user_id', user.id)
      .single();
      
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error checking like status:', selectError);
      throw selectError;
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

      // 좋아요 수 감소
      console.log('📉 Decrementing likes count...');
      const { error: updateError } = await supabase.rpc('decrement_likes_count', {
        artwork_id: artworkId
      });

      if (updateError) {
        console.error('⚠️ 좋아요 수 업데이트 오류:', updateError);
      } else {
        console.log('✅ Likes count decremented');
      }

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

      // 좋아요 수 증가
      console.log('📈 Incrementing likes count...');
      const { error: updateError } = await supabase.rpc('increment_likes_count', {
        artwork_id: artworkId
      });

      if (updateError) {
        console.error('⚠️ 좋아요 수 업데이트 오류:', updateError);
      } else {
        console.log('✅ Likes count incremented');
      }

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
    const { data: existingBookmark, error: selectError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('artwork_id', artworkId)
      .eq('user_id', user.id)
      .single();
      
    console.log('📊 Bookmark query result:', { 
      found: !!existingBookmark, 
      error: selectError?.code,
      errorMessage: selectError?.message 
    });
      
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error checking bookmark status:', selectError);
      throw selectError;
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

