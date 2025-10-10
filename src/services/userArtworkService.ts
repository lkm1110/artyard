/**
 * 사용자 작품 관련 서비스
 */

import { supabase } from './supabase';
import type { Artwork } from '../types';

/**
 * 사용자가 업로드한 작품들 가져오기
 */
export const getUserArtworks = async (): Promise<Artwork[]> => {
  try {
    console.log('🎨 사용자 작품들 조회 시작...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ 사용자 작품 조회 인증 오류:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ 사용자 작품 조회: 로그인된 사용자가 없습니다');
      throw new Error('로그인이 필요합니다.');
    }

    console.log('✅ 사용자 작품 조회 인증 완료:', user.id);

    // 사용자가 업로드한 작품들 가져오기
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department, is_verified_school)
      `)
      .eq('author_id', user.id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 사용자 작품 조회 오류:', error);
      throw error;
    }

    console.log('🎨 사용자 작품 수:', artworks?.length || 0);

    const processedArtworks = artworks?.map((artwork: any) => ({
      ...artwork,
      is_bookmarked: false, // 북마크 상태는 별도 조회 필요 (여기서는 기본값)
      is_liked: false, // 좋아요 상태는 별도 조회 필요 (여기서는 기본값)
    })) || [];

    console.log('✅ 사용자 작품들 조회 완료:', processedArtworks.length, '개');
    return processedArtworks;
  } catch (error) {
    console.error('💥 사용자 작품 조회 실패:', error);
    throw error;
  }
};
