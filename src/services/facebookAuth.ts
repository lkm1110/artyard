/**
 * Facebook 로그인 서비스 (실제 구현)
 */

import * as Facebook from 'expo-facebook';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Facebook 로그인 (네이티브 - 실제 구현)
 */
export const signInWithFacebook = async () => {
  try {
    console.log('📘 Facebook 로그인 시작 (실제)');
    
    // Facebook SDK 초기화
    await Facebook.initializeAsync({
      appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID!,
      appName: 'ArtYard',
    });

    console.log('Facebook SDK 초기화 완료');

    // Facebook 로그인 요청
    const result = await Facebook.logInWithReadPermissionsAsync({
      permissions: ['public_profile', 'email'],
    });

    if (result.type !== 'success') {
      if (result.type === 'cancel') {
        throw new Error('Facebook 로그인이 취소되었습니다.');
      }
      throw new Error('Facebook 로그인에 실패했습니다.');
    }

    console.log('Facebook 로그인 성공:', result);

    // Facebook Graph API로 사용자 정보 가져오기
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${result.token}&fields=id,name,email,picture.type(large)`
    );
    
    const userData = await response.json();
    console.log('Facebook 사용자 정보:', userData);

    // Supabase에 Facebook 액세스 토큰으로 로그인
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${process.env.EXPO_PUBLIC_DEV_URL || 'http://localhost:8085'}/auth/callback`,
        scopes: 'email',
      },
    });

    if (error) {
      console.error('Supabase Facebook 로그인 오류:', error);
      
      // 대안: 수동으로 사용자 생성/로그인
      return await createFacebookUser(userData, result.token);
    }

    console.log('✅ Facebook 로그인 성공');
    return { user: data.user, session: data.session };

  } catch (error: any) {
    console.error('❌ Facebook 로그인 실패:', error);
    throw new Error(error.message || 'Facebook 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Facebook 로그인 (웹 - 실제 구현)
 */
export const signInWithFacebookWeb = async () => {
  try {
    console.log('📘 Facebook 로그인 시작 (웹)');
    
    // 웹에서는 Supabase OAuth 사용
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Supabase Facebook 웹 로그인 오류:', error);
      throw new Error(`Facebook 웹 로그인 실패: ${error.message}`);
    }

    console.log('✅ Facebook 웹 로그인 리다이렉트 시작');
    return data;

  } catch (error: any) {
    console.error('❌ Facebook 웹 로그인 실패:', error);
    throw new Error(error.message || 'Facebook 웹 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Facebook 사용자 수동 생성/로그인 (대안)
 */
const createFacebookUser = async (userData: any, accessToken: string) => {
  try {
    console.log('Facebook 사용자 수동 생성 시도');
    
    const email = userData.email || `facebook_${userData.id}@artyard.app`;
    const tempPassword = `FB_${userData.id}_ArtYard2024!`;
    
    // 1. 기존 사용자 로그인 시도
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });
    
    if (!signInError && signInData.user) {
      console.log('✅ 기존 Facebook 사용자 로그인 성공');
      return { user: signInData.user, session: signInData.session };
    }
    
    // 2. 새 사용자 생성
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: userData.name,
          avatar_url: userData.picture?.data?.url,
          provider: 'facebook',
          facebook_id: userData.id,
        },
      },
    });
    
    if (signUpError) {
      throw new Error(`Facebook 사용자 생성 실패: ${signUpError.message}`);
    }
    
    console.log('✅ Facebook 사용자 생성 성공');
    return { user: signUpData.user, session: signUpData.session };
    
  } catch (error: any) {
    console.error('❌ Facebook 사용자 수동 생성 실패:', error);
    throw error;
  }
};

/**
 * Facebook 로그아웃
 */
export const signOutFromFacebook = async () => {
  try {
    if (Platform.OS !== 'web') {
      await Facebook.logOutAsync();
    }
    console.log('✅ Facebook 로그아웃 완료');
  } catch (error) {
    console.error('❌ Facebook 로그아웃 오류:', error);
  }
};