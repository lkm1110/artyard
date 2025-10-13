/**
 * 프로필 관련 API 서비스
 */

import { supabase } from './supabase';
import type { Profile } from '../types';

/**
 * 프로필 업데이트
 */
export const updateProfile = async (
  userId: string, 
  profileData: Partial<Profile>
): Promise<Profile> => {
  try {
    console.log('🔄 프로필 업데이트 시작:', { 
      userId, 
      profileData: {
        handle: profileData.handle,
        school: profileData.school,
        department: profileData.department,
        bio: profileData.bio?.substring(0, 50) + (profileData.bio?.length > 50 ? '...' : '')
      }
    });

    // 업데이트할 데이터 준비
    const updateData = {
      handle: profileData.handle?.trim(),
      school: profileData.school?.trim() || null,
      department: profileData.department?.trim() || null,
      bio: profileData.bio?.trim() || null,
    };

    console.log('📝 실제 업데이트 데이터:', updateData);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ 프로필 업데이트 실패:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        updateData
      });
      
      // 구체적인 오류 메시지 생성
      let userFriendlyMessage = 'Failed to update profile.';
      
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.message.includes('handle')) {
          userFriendlyMessage = 'This nickname is already taken by another user.';
        } else {
          userFriendlyMessage = 'This information is already in use.';
        }
      } else if (error.code === '23514') {
        // Check constraint violation
        userFriendlyMessage = 'Invalid profile information. Please check your inputs.';
      } else if (error.code === '42501') {
        // Insufficient privilege
        userFriendlyMessage = 'You do not have permission to update this profile.';
      } else if (error.message.includes('handle')) {
        userFriendlyMessage = 'Invalid nickname format.';
      } else if (error.message.includes('Row Level Security')) {
        userFriendlyMessage = 'Access denied. Please try logging in again.';
      }
      
      // 사용자 친화적 오류 객체 생성
      const friendlyError = new Error(userFriendlyMessage);
      friendlyError.originalError = error;
      friendlyError.code = error.code;
      
      throw friendlyError;
    }

    console.log('✅ 프로필 업데이트 성공:', {
      id: data.id,
      handle: data.handle,
      school: data.school,
      department: data.department
    });
    
    // 닉네임이 변경된 경우 로그 추가
    if (profileData.handle && data.handle) {
      console.log(`🎭 닉네임 변경: "${data.handle}"`);
      console.log('📚 데이터베이스 구조상 기존 게시물들의 작가 정보가 자동으로 업데이트됩니다.');
      console.log('📝 artworks 테이블이 author_id로 profiles를 참조하므로 JOIN 시 실시간 반영');
    }

    return data;
  } catch (error) {
    console.error('💥 프로필 업데이트 오류:', {
      message: error.message,
      code: error.code,
      originalError: error.originalError,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * 사용자 프로필 가져오기
 */
export const getProfile = async (userId: string): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ 프로필 조회 실패:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('💥 프로필 조회 오류:', error);
    throw error;
  }
};

/**
 * 닉네임 중복 체크 (타임아웃 및 오류 처리 강화)
 */
export const checkHandleAvailability = async (
  handle: string, 
  currentUserId?: string
): Promise<boolean> => {
  try {
    console.log('🔍 닉네임 중복 체크 시작:', { handle, currentUserId });

    // 타임아웃 처리 (5초)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('닉네임 중복 체크 타임아웃')), 5000);
    });

    let query = supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle);

    // 현재 사용자의 기존 닉네임은 제외
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await Promise.race([
      query,
      timeoutPromise
    ]);

    if (error) {
      console.error('❌ 닉네임 중복 체크 실패:', error);
      
      // RLS 오류거나 권한 문제일 경우 임시로 허용
      if (error.code === 'PGRST301' || error.code === '42501' || error.message?.includes('RLS')) {
        console.log('⚠️ RLS/권한 문제로 중복 체크 스킵 - 임시 허용');
        return true; // 임시로 사용 가능으로 처리
      }
      
      throw error;
    }

    console.log('✅ 닉네임 중복 체크 완료:', { handle, available: data.length === 0 });

    // 데이터가 없으면 사용 가능
    return data.length === 0;
  } catch (error: any) {
    console.error('💥 닉네임 중복 체크 오류:', error);
    
    // 타임아웃이나 네트워크 오류일 경우 임시로 허용
    if (error.message?.includes('타임아웃') || error.message?.includes('timeout')) {
      console.log('⚠️ 타임아웃으로 인한 중복 체크 스킵 - 임시 허용');
      return true; // 임시로 사용 가능으로 처리
    }
    
    throw error;
  }
};
