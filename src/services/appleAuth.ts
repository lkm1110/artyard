/**
 * Apple 로그인 서비스 (실제 구현)
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Apple 로그인 가능 여부 확인
 */
export const isAppleAuthenticationAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('Apple 인증 가능 여부 확인 오류:', error);
    return false;
  }
};

/**
 * Apple 로그인 (네이티브 - 실제 구현)
 */
export const signInWithApple = async () => {
  try {
    console.log('🍎 Apple 로그인 시작 (실제)');
    
    if (Platform.OS !== 'ios') {
      throw new Error('Apple 로그인은 iOS에서만 지원됩니다.');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
    }

    // Apple 인증 요청
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple 인증 성공:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
    });

    // identityToken이 없으면 오류
    if (!credential.identityToken) {
      throw new Error('Apple 인증 토큰을 받을 수 없습니다.');
    }

    // Supabase에 Apple ID Token으로 로그인
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: credential.nonce,
    });

    if (error) {
      console.error('Supabase Apple 로그인 오류:', error);
      throw new Error(`Apple 로그인 실패: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Apple 로그인 후 사용자 정보를 받을 수 없습니다.');
    }

    console.log('✅ Apple 로그인 성공:', data.user.email);
    return { user: data.user, session: data.session };

  } catch (error: any) {
    console.error('❌ Apple 로그인 실패:', error);
    
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Apple 로그인이 취소되었습니다.');
    }
    
    if (error.message?.includes('network')) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }
    
    throw new Error(error.message || 'Apple 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Apple 로그인 (웹 - Sign in with Apple JS)
 */
export const signInWithAppleWeb = async () => {
  try {
    console.log('🍎 Apple 로그인 시작 (웹)');
    
    // 웹에서는 Apple의 Sign in with Apple JS SDK 사용
    if (typeof window === 'undefined') {
      throw new Error('웹 환경이 아닙니다.');
    }

    // Apple JS SDK 로드 확인
    if (!(window as any).AppleID) {
      // Apple JS SDK 동적 로드
      await loadAppleSDK();
    }

    const AppleID = (window as any).AppleID;
    
    // Apple 로그인 설정
    AppleID.auth.init({
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.artyard.app.web', // Service ID
      scope: 'name email',
      redirectURI: 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback',
      state: 'artyard-apple-auth',
      usePopup: true,
    });

    // Apple 로그인 실행
    const data = await AppleID.auth.signIn();
    
    console.log('Apple 웹 인증 성공:', data);

    // ID Token을 Supabase에 전달
    const { data: supabaseData, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: data.authorization.id_token,
    });

    if (error) {
      console.error('Supabase Apple 웹 로그인 오류:', error);
      throw new Error(`Apple 웹 로그인 실패: ${error.message}`);
    }

    console.log('✅ Apple 웹 로그인 성공');
    return { user: supabaseData.user, session: supabaseData.session };

  } catch (error: any) {
    console.error('❌ Apple 웹 로그인 실패:', error);
    
    if (error.error === 'popup_closed_by_user') {
      throw new Error('Apple 로그인이 취소되었습니다.');
    }
    
    throw new Error(error.message || 'Apple 웹 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Apple JS SDK 동적 로드
 */
const loadAppleSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).AppleID) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Apple SDK 로드 실패'));
    
    document.head.appendChild(script);
  });
};