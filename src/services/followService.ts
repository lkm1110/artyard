/**
 * 아티스트 팔로우 시스템 서비스
 */

import { supabase } from './supabase';
import { Follow, FollowStats, ExtendedProfile, Notification } from '../types/advanced';

/**
 * 사용자 팔로우
 */
export const followUser = async (followingId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    if (user.id === followingId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다.');
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // 중복 키 오류
        throw new Error('이미 팔로우 중입니다.');
      }
      throw error;
    }

    console.log('✅ 팔로우 성공:', data);
    return { success: true };

  } catch (error: any) {
    console.error('❌ 팔로우 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 언팔로우
 */
export const unfollowUser = async (followingId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;

    console.log('✅ 언팔로우 성공');
    return { success: true };

  } catch (error: any) {
    console.error('❌ 언팔로우 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 팔로우 상태 확인
 */
export const getFollowStatus = async (userId: string): Promise<FollowStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 팔로워 수 조회
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // 팔로잉 수 조회
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // 현재 사용자가 해당 사용자를 팔로우하는지 확인
    let isFollowing = false;
    if (user && user.id !== userId) {
      try {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();
        
        isFollowing = !!data;
      } catch (err) {
        // 406 에러 무시
        isFollowing = false;
      }
    }

    return {
      follower_count: followerCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing,
    };

  } catch (error) {
    console.error('팔로우 상태 조회 오류:', error);
    return {
      follower_count: 0,
      following_count: 0,
      is_following: false,
    };
  }
};

/**
 * 사용자의 팔로워 목록 조회
 */
export const getFollowers = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ followers: ExtendedProfile[]; total: number; hasMore: boolean }> => {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        *,
        follower:profiles!follows_follower_id_fkey(
          id, handle, avatar_url, school, department, is_verified_school
        )
      `, { count: 'exact' })
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const followers = (data || []).map(follow => follow.follower).filter(Boolean) as ExtendedProfile[];
    
    return {
      followers,
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };

  } catch (error) {
    console.error('팔로워 목록 조회 오류:', error);
    return { followers: [], total: 0, hasMore: false };
  }
};

/**
 * 사용자의 팔로잉 목록 조회
 */
export const getFollowing = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ following: ExtendedProfile[]; total: number; hasMore: boolean }> => {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        *,
        following:profiles!follows_following_id_fkey(
          id, handle, avatar_url, school, department, is_verified_school
        )
      `, { count: 'exact' })
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const following = (data || []).map(follow => follow.following).filter(Boolean) as ExtendedProfile[];
    
    return {
      following,
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };

  } catch (error) {
    console.error('팔로잉 목록 조회 오류:', error);
    return { following: [], total: 0, hasMore: false };
  }
};

/**
 * 팔로우 중인 아티스트들의 최신 작품 조회
 */
export const getFollowingArtworks = async (
  page: number = 1,
  limit: number = 10
): Promise<{ artworks: any[]; total: number; hasMore: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const offset = (page - 1) * limit;

    // 팔로우 중인 아티스트들의 작품 조회
    const { data, error, count } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(
          id, handle, avatar_url, school, department, is_verified_school
        )
      `, { count: 'exact' })
      .in('author_id', 
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
      )
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      artworks: data || [],
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };

  } catch (error) {
    console.error('팔로잉 작품 조회 오류:', error);
    return { artworks: [], total: 0, hasMore: false };
  }
};

/**
 * 알림 목록 조회
 */
export const getNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };

  } catch (error) {
    console.error('알림 조회 오류:', error);
    return { notifications: [], total: 0, hasMore: false };
  }
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    console.log('✅ 알림 읽음 처리 완료');
    return true;

  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    return false;
  }
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    console.log('✅ 모든 알림 읽음 처리 완료');
    return true;

  } catch (error) {
    console.error('❌ 모든 알림 읽음 처리 실패:', error);
    return false;
  }
};

/**
 * 읽지 않은 알림 수 조회
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return count || 0;

  } catch (error) {
    console.error('읽지 않은 알림 수 조회 오류:', error);
    return 0;
  }
};
