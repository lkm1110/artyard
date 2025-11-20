/**
 * 좋아요 관련 서비스
 */

import { supabase } from './supabase';
import type { Artwork } from '../types';

/**
 * 사용자가 좋아요한 작품들 가져오기
 */
export const getUserLikes = async (): Promise<Artwork[]> => {
  try {
    console.log('❤️ 좋아요한 작품들 조회 시작...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ 좋아요 조회 인증 오류:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ 좋아요 조회: 로그인된 사용자가 없습니다');
      throw new Error('로그인이 필요합니다.');
    }

    console.log('✅ 좋아요 조회 인증 완료:', user.id);

    // 사용자의 좋아요와 함께 작품 정보 가져오기
    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        created_at,
        artwork:artworks!likes_artwork_id_fkey(
          *,
          author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department, is_verified_school)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 좋아요 조회 오류:', error);
      throw error;
    }

    console.log('❤️ 좋아요한 작품 수:', likes?.length || 0);

    // 좋아요 데이터를 작품 배열로 변환
    const artworks = likes
      ?.map((like: any) => like.artwork)
      .filter((artwork: any) => artwork && !artwork.is_hidden) // null이거나 숨겨진 작품 제외
      .map((artwork: any) => ({
        ...artwork,
        is_liked: true, // 이 페이지의 모든 작품은 좋아요됨
      })) || [];

    console.log('✅ 좋아요한 작품들 조회 완료:', artworks.length, '개');
    return artworks;
  } catch (error) {
    console.error('💥 좋아요 조회 실패:', error);
    throw error;
  }
};

