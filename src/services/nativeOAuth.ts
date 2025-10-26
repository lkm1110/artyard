/**
 * 네이티브 환경 (iOS/Android)에서 OAuth 처리
 */

import { Platform, Linking } from 'react-native';
import { supabase } from './supabase';

// OAuth 제공자별 설정
const OAUTH_CONFIGS = {
  google: {
    redirectUri: 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback',
  },
  facebook: {
    redirectUri: 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback',
  },
  kakao: {
    redirectUri: 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback',
  },
  apple: {
    redirectUri: 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback',
  },
};

/**
 * Supabase OAuth URL 직접 생성 (네이티브 Deep Link 포함)
 */
const createSupabaseOAuthUrl = (provider: string, options?: { scope?: string }) => {
  // 하드코딩된 Supabase URL 사용
  const supabaseUrl = 'https://bkvycanciimgyftdtqpx.supabase.co';
  
  // 네이티브 앱에서는 OAuth 완료 후 앱으로 돌아와야 함
  let nativeRedirectUri: string;
  
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // 모바일: Deep Link 사용
    nativeRedirectUri = 'artyard://auth-callback';
  } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // 웹: 현재 도메인 사용
    nativeRedirectUri = window.location.origin;
  } else {
    // 기본값: Supabase 콜백
    nativeRedirectUri = `${supabaseUrl}/auth/v1/callback`;
  }
  
  console.log('🔍 Creating OAuth URL for provider:', provider);
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔄 Redirect URI:', nativeRedirectUri);
  console.log('📱 Platform:', Platform.OS);
  
  const params = new URLSearchParams({
    provider: provider,
    redirect_to: nativeRedirectUri,
  });

  // 카카오의 경우 scope 파라미터 추가
  if (provider === 'kakao' && options?.scope) {
    params.append('scopes', options.scope);
  }

  const fullUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
  console.log('📝 Generated OAuth URL:', fullUrl);
  console.log('🎯 Expected redirect after OAuth:', nativeRedirectUri);
  
  return fullUrl;
};

/**
 * 네이티브 Google OAuth
 */
export const signInWithGoogleNative = async () => {
  try {
    console.log('🔍 Starting Google OAuth (Native)...');
    
    if (Platform.OS === 'web') {
      // 웹에서는 기존 Supabase 방식 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: OAUTH_CONFIGS.google.redirectUri,
          skipBrowserRedirect: false,
        },
      });
      return { data, error };
    }

    // 네이티브에서는 OAuth URL을 직접 생성해서 브라우저로 열기
    console.log('📱 Opening Google OAuth in Safari...');
    
    const oauthUrl = createSupabaseOAuthUrl('google');
    console.log('🌐 OAuth URL:', oauthUrl);
    
    // Safari에서 OAuth 페이지 열기
    const canOpen = await Linking.canOpenURL(oauthUrl);
    if (canOpen) {
      await Linking.openURL(oauthUrl);
      console.log('✅ Safari opened with Google OAuth URL');
      return { data: { url: oauthUrl }, error: null };
    } else {
      throw new Error('Cannot open OAuth URL');
    }
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 네이티브 Kakao OAuth
 */
export const signInWithKakaoNative = async () => {
  try {
    console.log('🍊 Starting Kakao OAuth (Native)...');
    
    if (Platform.OS === 'web') {
      // 웹에서는 기존 Supabase 방식 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: OAUTH_CONFIGS.kakao.redirectUri,
          queryParams: {
            scope: 'profile_nickname profile_image',
          },
          skipBrowserRedirect: false,
        },
      });
      return { data, error };
    }

    // 네이티브에서는 OAuth URL을 직접 생성해서 브라우저로 열기
    console.log('📱 Opening Kakao OAuth in Safari...');
    
    const oauthUrl = createSupabaseOAuthUrl('kakao', { 
      scope: 'profile_nickname profile_image' 
    });
    console.log('🌐 Kakao OAuth URL:', oauthUrl);
    
    // Safari에서 OAuth 페이지 열기
    const canOpen = await Linking.canOpenURL(oauthUrl);
    if (canOpen) {
      await Linking.openURL(oauthUrl);
      console.log('✅ Safari opened with Kakao OAuth URL');
      return { data: { url: oauthUrl }, error: null };
    } else {
      throw new Error('Cannot open Kakao OAuth URL');
    }
  } catch (error) {
    console.error('❌ Kakao OAuth error:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 네이티브 Facebook OAuth
 */
export const signInWithFacebookNative = async () => {
  try {
    console.log('📘 Starting Facebook OAuth (Native)...');
    
    if (Platform.OS === 'web') {
      // 웹에서는 기존 Supabase 방식 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: OAUTH_CONFIGS.facebook.redirectUri,
          skipBrowserRedirect: false,
        },
      });
      return { data, error };
    }

    // 네이티브에서는 OAuth URL을 직접 생성해서 브라우저로 열기
    console.log('📱 Opening Facebook OAuth in Safari...');
    
    const oauthUrl = createSupabaseOAuthUrl('facebook');
    console.log('🌐 Facebook OAuth URL:', oauthUrl);
    
    // Safari에서 OAuth 페이지 열기
    const canOpen = await Linking.canOpenURL(oauthUrl);
    if (canOpen) {
      await Linking.openURL(oauthUrl);
      console.log('✅ Safari opened with Facebook OAuth URL');
      return { data: { url: oauthUrl }, error: null };
    } else {
      throw new Error('Cannot open Facebook OAuth URL');
    }
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 네이티브 Apple OAuth
 */
export const signInWithAppleNative = async () => {
  try {
    console.log('🍎 Starting Apple OAuth (Native)...');
    
    if (Platform.OS === 'web') {
      // 웹에서는 기존 Supabase 방식 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: OAUTH_CONFIGS.apple.redirectUri,
          skipBrowserRedirect: false,
        },
      });
      return { data, error };
    }

    // 네이티브에서는 OAuth URL을 직접 생성해서 브라우저로 열기
    console.log('📱 Opening Apple OAuth in Safari...');
    
    const oauthUrl = createSupabaseOAuthUrl('apple');
    console.log('🌐 Apple OAuth URL:', oauthUrl);
    
    // Safari에서 OAuth 페이지 열기
    const canOpen = await Linking.canOpenURL(oauthUrl);
    if (canOpen) {
      await Linking.openURL(oauthUrl);
      console.log('✅ Safari opened with Apple OAuth URL');
      return { data: { url: oauthUrl }, error: null };
    } else {
      throw new Error('Cannot open Apple OAuth URL');
    }
  } catch (error) {
    console.error('❌ Apple OAuth error:', error);
    return { data: null, error: error as Error };
  }
};
