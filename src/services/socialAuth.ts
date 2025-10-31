/**
 * 소셜 로그인 서비스 (Naver, Kakao)
 * expo-auth-session을 사용한 PKCE 방식 로그인
 */

import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// 환경 변수
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || '';
const KAKAO_CLIENT_ID = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID || '';

/**
 * 네이버 소셜 로그인
 */
export const signInWithNaver = async () => {
  try {
    const redirectUri = makeRedirectUri({ scheme: 'artyard', path: 'auth' });
    
    const request = new AuthSession.AuthRequest({
      clientId: NAVER_CLIENT_ID,
      scopes: [],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {},
    });

    const authUrl = 'https://nid.naver.com/oauth2.0/authorize';
    
    const result = await request.promptAsync({
      authorizationEndpoint: authUrl,
    });

    if (result.type === 'success') {
      const { code } = result.params;
      
      // 토큰 교환
      const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // 사용자 정보 가져오기
        const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        
        if (userData.response) {
          // Supabase에 사용자 생성 또는 로그인 처리
          await handleSocialSignIn('naver', userData.response, tokenData.access_token);
          return { success: true, error: null };
        }
      }
    }

    return { success: false, error: new Error('네이버 로그인 실패') };
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    return { success: false, error: error as Error };
  }
};

/**
 * 카카오 소셜 로그인
 */
export const signInWithKakao = async () => {
  try {
    const redirectUri = makeRedirectUri({ scheme: 'artyard', path: 'auth' });
    
    const request = new AuthSession.AuthRequest({
      clientId: KAKAO_CLIENT_ID,
      scopes: [],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {},
    });

    const authUrl = 'https://kauth.kakao.com/oauth/authorize';
    
    const result = await request.promptAsync({
      authorizationEndpoint: authUrl,
    });

    if (result.type === 'success') {
      const { code } = result.params;
      
      // 토큰 교환
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: KAKAO_CLIENT_ID,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // 사용자 정보 가져오기
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        
        if (userData.id) {
          // Supabase에 사용자 생성 또는 로그인 처리
          await handleSocialSignIn('kakao', userData, tokenData.access_token);
          return { success: true, error: null };
        }
      }
    }

    return { success: false, error: new Error('카카오 로그인 실패') };
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    return { success: false, error: error as Error };
  }
};

/**
 * 소셜 로그인 후 Supabase 처리
 */
const handleSocialSignIn = async (provider: 'naver' | 'kakao', userData: any, accessToken: string) => {
  try {
    // 로컬 세션 생성 (임시)
    const sessionData = {
      provider,
      userData,
      accessToken,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem('social_session', JSON.stringify(sessionData));
    
    // TODO: 실제 구현시에는 Supabase에 커스텀 토큰으로 로그인 처리
    // 또는 서버에서 JWT 토큰 생성하여 Supabase 로그인
    
    console.log(`${provider} 로그인 성공:`, userData);
    
  } catch (error) {
    console.error('소셜 로그인 처리 오류:', error);
    throw error;
  }
};

/**
 * 저장된 소셜 세션 확인
 */
export const getSocialSession = async () => {
  try {
    const sessionString = await AsyncStorage.getItem('social_session');
    if (sessionString) {
      return JSON.parse(sessionString);
    }
    return null;
  } catch (error) {
    console.error('소셜 세션 확인 오류:', error);
    return null;
  }
};

/**
 * 소셜 로그아웃
 */
export const signOutSocial = async () => {
  try {
    await AsyncStorage.removeItem('social_session');
  } catch (error) {
    console.error('소셜 로그아웃 오류:', error);
  }
};

