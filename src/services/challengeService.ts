/**
 * Challenge 관리 서비스
 */

import { supabase } from './supabase';
import {
  Challenge,
  ChallengeEntry,
  ChallengeStatus,
  JoinChallengeRequest,
} from '../types/complete-system';

/**
 * Challenge 목록 조회
 */
export const getChallenges = async (
  status?: ChallengeStatus
): Promise<Challenge[]> => {
  try {
    let query = supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles!challenges_created_by_fkey(*)
      `)
      .order('end_date', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('Challenge 조회 오류:', error);
    throw error;
  }
};

/**
 * 활성 Challenge 조회
 */
export const getActiveChallenges = async (): Promise<Challenge[]> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles!challenges_created_by_fkey(*)
      `)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('활성 Challenge 조회 오류:', error);
    throw error;
  }
};

/**
 * Challenge 상세 조회
 */
export const getChallengeDetail = async (id: string): Promise<Challenge> => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles!challenges_created_by_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Challenge를 찾을 수 없습니다');
    
    return data;
    
  } catch (error: any) {
    console.error('Challenge 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * Challenge 참여 작품 조회
 */
export const getChallengeEntries = async (
  challengeId: string,
  sortBy: 'recent' | 'popular' = 'popular'
): Promise<ChallengeEntry[]> => {
  try {
    let query = supabase
      .from('challenge_entries')
      .select(`
        *,
        artwork:artworks(*),
        author:profiles!challenge_entries_author_id_fkey(*)
      `)
      .eq('challenge_id', challengeId);
    
    if (sortBy === 'popular') {
      query = query.order('votes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('Challenge 참여 작품 조회 오류:', error);
    throw error;
  }
};

/**
 * Challenge 참여
 */
export const joinChallenge = async (
  request: JoinChallengeRequest
): Promise<ChallengeEntry> => {
  try {
    console.log('🏆 Challenge 참여 시작:', request);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 1. Challenge 확인
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', request.challenge_id)
      .single();
    
    if (challengeError || !challenge) {
      throw new Error('Challenge를 찾을 수 없습니다');
    }
    
    // 2. Challenge 상태 확인
    if (challenge.status !== 'active') {
      throw new Error('현재 진행 중인 Challenge가 아닙니다');
    }
    
    // 3. 기간 확인
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    
    if (now > endDate) {
      throw new Error('Challenge가 종료되었습니다');
    }
    
    // 4. 작품 확인
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', request.artwork_id)
      .eq('author_id', user.id)
      .single();
    
    if (artworkError || !artwork) {
      throw new Error('자신의 작품만 참여시킬 수 있습니다');
    }
    
    // 5. 이미 참여했는지 확인
    const { data: existingEntry } = await supabase
      .from('challenge_entries')
      .select('id')
      .eq('challenge_id', request.challenge_id)
      .eq('artwork_id', request.artwork_id)
      .single();
    
    if (existingEntry) {
      throw new Error('이미 참여한 작품입니다');
    }
    
    // 6. 참여 개수 확인
    const { data: myEntries } = await supabase
      .from('challenge_entries')
      .select('id')
      .eq('challenge_id', request.challenge_id)
      .eq('author_id', user.id);
    
    if (myEntries && myEntries.length >= challenge.max_entries_per_user) {
      throw new Error(`최대 ${challenge.max_entries_per_user}개까지 참여할 수 있습니다`);
    }
    
    // 7. 참여 등록
    const { data: entry, error: entryError } = await supabase
      .from('challenge_entries')
      .insert({
        challenge_id: request.challenge_id,
        artwork_id: request.artwork_id,
        author_id: user.id,
        description: request.description,
        is_winner: false,
        votes_count: 0,
      })
      .select(`
        *,
        artwork:artworks(*),
        author:profiles!challenge_entries_author_id_fkey(*)
      `)
      .single();
    
    if (entryError || !entry) {
      console.error('Challenge 참여 실패:', entryError);
      throw new Error('참여 등록 실패');
    }
    
    console.log('✅ Challenge 참여 완료:', entry.id);
    return entry;
    
  } catch (error: any) {
    console.error('❌ Challenge 참여 오류:', error);
    throw error;
  }
};

/**
 * Challenge 참여 취소
 */
export const leaveChallengeEntry = async (entryId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { error } = await supabase
      .from('challenge_entries')
      .delete()
      .eq('id', entryId)
      .eq('author_id', user.id);
    
    if (error) throw error;
    
    return true;
    
  } catch (error: any) {
    console.error('Challenge 참여 취소 오류:', error);
    throw error;
  }
};

/**
 * Challenge 참여 작품에 투표 (좋아요)
 */
export const voteChallengeEntry = async (
  artworkId: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // likes 테이블 사용 (기존 좋아요 시스템 재사용)
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('artwork_id', artworkId)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      // 이미 좋아요 했으면 취소
      await supabase
        .from('likes')
        .delete()
        .eq('artwork_id', artworkId)
        .eq('user_id', user.id);
      
      return false;
    } else {
      // 좋아요 추가
      await supabase
        .from('likes')
        .insert({
          artwork_id: artworkId,
          user_id: user.id,
        });
      
      return true;
    }
    
  } catch (error: any) {
    console.error('투표 오류:', error);
    throw error;
  }
};

/**
 * 내 Challenge 참여 목록
 */
export const getMyChallengeEntries = async (): Promise<ChallengeEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { data, error } = await supabase
      .from('challenge_entries')
      .select(`
        *,
        challenge:challenges(*),
        artwork:artworks(*)
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('내 Challenge 참여 조회 오류:', error);
    throw error;
  }
};

/**
 * Challenge 우승자 선정 (관리자만)
 */
export const selectWinners = async (
  challengeId: string,
  winnerEntryIds: string[]
): Promise<boolean> => {
  try {
    // 1. 모든 우승자 플래그 초기화
    await supabase
      .from('challenge_entries')
      .update({ is_winner: false })
      .eq('challenge_id', challengeId);
    
    // 2. 우승자 설정
    for (const entryId of winnerEntryIds) {
      await supabase
        .from('challenge_entries')
        .update({ is_winner: true })
        .eq('id', entryId);
    }
    
    // 3. Challenge 상태 변경
    await supabase
      .from('challenges')
      .update({ status: 'ended' })
      .eq('id', challengeId);
    
    // 4. 우승자들에게 알림
    const { data: winners } = await supabase
      .from('challenge_entries')
      .select('*, author:profiles!challenge_entries_author_id_fkey(*), challenge:challenges(*)')
      .in('id', winnerEntryIds);
    
    if (winners) {
      for (const winner of winners) {
        await supabase.from('notifications').insert({
          user_id: winner.author_id,
          type: 'challenge_winner',
          title: '🏆 축하합니다! Challenge에서 우승하셨습니다!',
          message: `"${winner.challenge.title}" Challenge에서 우승하셨습니다!`,
          link: `/challenges/${challengeId}`,
        });
      }
    }
    
    return true;
    
  } catch (error: any) {
    console.error('우승자 선정 오류:', error);
    throw error;
  }
};

/**
 * Challenge 통계
 */
export const getChallengeStats = async (challengeId: string) => {
  try {
    const { data: entries } = await supabase
      .from('challenge_entries')
      .select('votes_count, author_id')
      .eq('challenge_id', challengeId);
    
    if (!entries) return null;
    
    const totalVotes = entries.reduce((sum, e) => sum + (e.votes_count || 0), 0);
    const participants = new Set(entries.map(e => e.author_id)).size;
    
    return {
      total_entries: entries.length,
      total_votes: totalVotes,
      participants,
      average_votes: entries.length > 0 ? Math.round(totalVotes / entries.length) : 0,
    };
    
  } catch (error: any) {
    console.error('Challenge 통계 오류:', error);
    throw error;
  }
};

