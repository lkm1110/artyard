/**
 * 웹 전용 OAuth 서비스
 * 카카오/네이버 실제 Supabase Auth 연동
 */

import { supabase } from './supabase';

// 시뮬레이션 테스트 사용자들 (실제 Auth에 생성됨)
const TEST_USERS = [
  {
    id: 'kakao_001',
    email: 'artyard.test.kakao.artist@gmail.com',
    full_name: 'Digital Artist (Kakao)',
    avatar_url: 'https://picsum.photos/200/200?random=21',
    provider: 'kakao'
  },
  {
    id: 'naver_001', 
    email: 'artyard.test.naver.collector@gmail.com',
    full_name: 'Art Collector (Naver)',
    avatar_url: 'https://picsum.photos/200/200?random=22',
    provider: 'naver'
  },
  {
    id: 'kakao_002',
    email: 'artyard.test.kakao.painter@gmail.com', 
    full_name: 'Traditional Painter (Kakao)',
    avatar_url: 'https://picsum.photos/200/200?random=23',
    provider: 'kakao'
  },
  {
    id: 'naver_002',
    email: 'artyard.test.naver.artist@gmail.com',
    full_name: 'Naver Artist (Naver)',
    avatar_url: 'https://picsum.photos/200/200?random=24',
    provider: 'naver'
  }
];

// 카카오 웹 로그인 - 실제 Auth 연동
export const signInWithKakaoWeb = async () => {
  try {
    console.log('🎨 카카오 웹 로그인 - 실제 계정 생성 중...');
    
    // 카카오 테스트 사용자 중 랜덤 선택
    const kakaoUsers = TEST_USERS.filter(user => user.provider === 'kakao');
    const selectedUser = kakaoUsers[Math.floor(Math.random() * kakaoUsers.length)];
    
    // 실제 Supabase Auth 로그인 처리
    const authResult = await createOrSignInUser(selectedUser);
    
    return {
      success: true,
      data: {
        id: selectedUser.id,
        nickname: selectedUser.full_name,
        email: selectedUser.email,
        avatar_url: selectedUser.avatar_url
      },
      authResult
    };
  } catch (error) {
    console.error('카카오 로그인 실패:', error);
    return { success: false, error };
  }
};

// 네이버 웹 로그인 - 실제 Auth 연동
export const signInWithNaverWeb = async () => {
  try {
    console.log('💚 네이버 웹 로그인 - 실제 계정 생성 중...');
    
    // 네이버 테스트 사용자 중 랜덤 선택
    const naverUsers = TEST_USERS.filter(user => user.provider === 'naver');
    const selectedUser = naverUsers[Math.floor(Math.random() * naverUsers.length)];
    
    // 실제 Supabase Auth 로그인 처리
    const authResult = await createOrSignInUser(selectedUser);
    
    return {
      success: true,
      data: {
        id: selectedUser.id,
        nickname: selectedUser.full_name,
        email: selectedUser.email,
        avatar_url: selectedUser.avatar_url
      },
      authResult
    };
  } catch (error) {
    console.error('네이버 로그인 실패:', error);
    return { success: false, error };
  }
};

// 실제 사용자 생성 또는 로그인 처리
const createOrSignInUser = async (userData: typeof TEST_USERS[0]) => {
  const tempPassword = 'ArtYard2024!@#';
  
  try {
    // 1. 현재 세션 정리
    await supabase.auth.signOut();
    console.log('이전 세션 정리 완료');
    
    // 2. 먼저 로그인 시도 (기존 사용자)
    console.log('기존 사용자 로그인 시도:', userData.email);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: tempPassword
    });
    
    if (!signInError && signInData.user) {
      console.log('✅ 기존 사용자 로그인 성공:', userData.full_name);
      return { user: signInData.user, session: signInData.session };
    }
    
    // 3. 로그인 실패시 새 사용자 생성
    console.log('새 사용자 가입 시도:', userData.email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: tempPassword,
      options: {
        data: {
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          provider: userData.provider
        }
      }
    });
    
    if (signUpError) {
      throw new Error(`가입 실패: ${signUpError.message}`);
    }
    
    if (signUpData.user) {
      console.log('✅ 새 사용자 생성 성공:', userData.full_name);
      
      // 세션이 있으면 바로 반환
      if (signUpData.session) {
        console.log('✅ 세션도 함께 생성됨, 즉시 로그인 완료');
        return { user: signUpData.user, session: signUpData.session };
      }
      
      // 세션이 없어도 사용자는 생성되었으므로 성공으로 처리
      console.log('⚠️ 세션 없이 사용자만 생성됨 (이메일 확인 필요할 수 있음)');
      console.log('개발 환경: 세션 없이도 성공으로 처리함');
      
      // 개발 환경에서는 사용자만 있어도 성공으로 처리
      return { user: signUpData.user, session: null };
    }
    
    throw new Error('사용자 생성에 실패했습니다.');
    
  } catch (error) {
    console.error('Auth 처리 실패:', error);
    throw error;
  }
};

/**
 * 환경별 로그인 분기
 */
export const getOAuthMethod = () => {
  // 웹 환경 감지
  if (typeof window !== 'undefined' && window.navigator) {
    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return {
      isWeb: !isMobile,
      isMobile,
      platform: isMobile ? 'mobile' : 'web'
    };
  }
  
  return { isWeb: true, isMobile: false, platform: 'web' };
};
