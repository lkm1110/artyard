/**
 * 네이티브 환경 (iOS/Android)에서 OAuth 처리
 */

import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// WebBrowser 세션 완료 처리 (iOS에서 필요)
WebBrowser.maybeCompleteAuthSession();

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
    // 모바일: 개발에서는 exp scheme, 프로덕션에서는 artyard scheme
    if (__DEV__ && Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri;
      nativeRedirectUri = `exp://${hostUri}/auth-callback`;
      console.log('🔧 개발 환경, exp scheme 사용:', nativeRedirectUri);
    } else {
      nativeRedirectUri = 'artyard://auth-callback';
      console.log('🏗️ 프로덕션 환경, artyard scheme 사용:', nativeRedirectUri);
    }
  } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // 웹: 현재 도메인 사용  
    nativeRedirectUri = window.location.origin;
    console.log('🌐 웹 환경 감지, window.location.origin 사용:', nativeRedirectUri);
  } else {
    // 기본값: Supabase 콜백
    nativeRedirectUri = `${supabaseUrl}/auth/v1/callback`;
  }
  
  console.log('🔍 Creating OAuth URL for provider:', provider);
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔄 Redirect URI:', nativeRedirectUri);
  console.log('📱 Platform:', Platform.OS);
  console.log('🔧 __DEV__:', __DEV__);
  console.log('🔧 Constants.expoConfig?.hostUri:', Constants.expoConfig?.hostUri);
  console.log('🔧 typeof window:', typeof window);
  
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
 * 네이티브 Google OAuth (Expo AuthSession 사용)
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

    // 네이티브에서는 AuthSession 사용
    console.log('📱 Using Expo AuthSession for Google OAuth...');
    
    // 1. Redirect URI 생성 (Expo Go에서는 exp:// scheme 사용)
    const redirectUri = __DEV__ 
      ? AuthSession.makeRedirectUri({
          scheme: undefined, // Expo Go의 기본 exp:// scheme 사용
          path: 'auth-callback',
        })
      : AuthSession.makeRedirectUri({
          scheme: 'artyard',
          path: 'auth-callback',
        });
    
    console.log('🔗 AuthSession Redirect URI:', redirectUri);
    console.log('🔍 __DEV__:', __DEV__);
    
    // 2. Supabase OAuth URL 생성
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });
    
    if (error || !data?.url) {
      console.error('❌ OAuth URL 생성 실패:', error);
      return { data: null, error: error || new Error('No OAuth URL generated') };
    }
    
    console.log('🌐 OAuth URL:', data.url);
    console.log('🔗 Expected redirect back to:', redirectUri);
    
    // 3. AuthSession으로 브라우저 열기 (자동으로 앱으로 돌아옴)
    console.log('⏳ Opening browser with AuthSession...');
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );
      
      console.log('📱 AuthSession result type:', result.type);
      console.log('📱 AuthSession full result:', JSON.stringify(result));
      
      if (result.type === 'success' && result.url) {
        console.log('✅ OAuth 성공! Callback URL:', result.url);
        
        // URL에서 code 추출
        try {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          
          if (error) {
            console.error('❌ OAuth 에러:', error, errorDescription);
            return { data: null, error: new Error(`OAuth error: ${error} - ${errorDescription}`) };
          }
          
          if (!code) {
            console.error('❌ Authorization code가 없습니다');
            return { data: null, error: new Error('No authorization code received') };
          }
          
          console.log('🔑 Authorization code 받음:', code.substring(0, 20) + '...');
          
          // Code를 세션으로 교환 (타임아웃 없음 - onAuthStateChange가 처리)
          console.log('🔄 [Google] exchangeCodeForSession 호출 시작...');
          console.log('⏰ [Google] 시작 시간:', new Date().toISOString());
          const startTime = Date.now();

          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);
          console.log('⏱️ [Google] exchangeCodeForSession 완료! 소요 시간:', duration, '초');
          console.log('⏰ [Google] 종료 시간:', new Date().toISOString());

          if (sessionError) {
            console.error('❌ [Google] 세션 교환 실패:', sessionError);
            console.error('❌ [Google] Error code:', sessionError.code);
            console.error('❌ [Google] Error message:', sessionError.message);
            return { data: null, error: sessionError };
          }
          
          if (!sessionData || !sessionData.session) {
            console.error('❌ [Google] 세션 데이터가 없습니다');
            return { data: null, error: new Error('No session data received') };
          }
          
          console.log('🎉 [Google] 로그인 성공!', sessionData.user?.email);
          console.log('✅ [Google] Session ID:', sessionData.session.access_token.substring(0, 20) + '...');
          
          // ⚠️ authStore.initialize() 제거 - SIGNED_IN 이벤트가 자동으로 처리
          // 중복 호출을 방지하여 더 빠르고 부드러운 로그인 경험 제공
          console.log('✅ [Google] onAuthStateChange가 자동으로 처리합니다.');
          
          return { data: sessionData, error: null };
          
        } catch (urlError) {
          console.error('❌ URL 파싱 에러:', urlError);
          return { data: null, error: urlError as Error };
        }
      }
      
      // dismiss, cancel, locked 등
      console.error('❌ OAuth 실패 또는 취소:', result.type);
      
      if (result.type === 'dismiss') {
        console.error('🚫 브라우저가 OAuth 완료 전에 닫혔습니다');
        console.error('💡 Supabase Redirect URL에 다음 URL이 등록되어 있는지 확인하세요:');
        console.error('   ', redirectUri);
      }
      
      return { data: null, error: new Error(`OAuth ${result.type}`) };
      
    } catch (browserError) {
      console.error('❌ AuthSession 에러:', browserError);
      return { data: null, error: browserError as Error };
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

    // 네이티브에서는 AuthSession 사용
    console.log('📱 Using Expo AuthSession for Facebook OAuth...');
    
    // 1. Expo Go용 redirect URI 생성 (exp:// scheme)
    const expRedirectUri = __DEV__ 
      ? AuthSession.makeRedirectUri({
          scheme: undefined, // Expo Go의 기본 exp:// scheme 사용
          path: 'auth-callback',
        })
      : 'artyard://auth-callback';
    
    console.log('🔗 Expo Redirect URI:', expRedirectUri);
    
    // 2. Supabase OAuth URL 생성 (exp:// URI로 redirect)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: expRedirectUri, // exp:// URL로 변경!
        skipBrowserRedirect: true,
      },
    });
    
    if (error || !data?.url) {
      console.error('❌ Facebook OAuth URL 생성 실패:', error);
      return { data: null, error: error || new Error('No OAuth URL generated') };
    }
    
    console.log('🌐 Facebook OAuth URL:', data.url);
    console.log('🔗 Expected redirect back to:', expRedirectUri);
    
    // 3. AuthSession으로 브라우저 열기 (exp:// URL로 돌아옴)
    console.log('⏳ Opening browser with AuthSession...');
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        expRedirectUri // exp:// URL 사용!
      );
      
      console.log('📱 AuthSession result type:', result.type);
      console.log('📱 AuthSession full result:', JSON.stringify(result));
      
      if (result.type === 'success' && result.url) {
        console.log('✅ Facebook OAuth 성공! Callback URL:', result.url);
        
        // URL에서 code 추출
        try {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          
          if (error) {
            console.error('❌ Facebook OAuth 에러:', error, errorDescription);
            return { data: null, error: new Error(`OAuth error: ${error} - ${errorDescription}`) };
          }
          
          if (!code) {
            console.error('❌ Authorization code 없음');
            return { data: null, error: new Error('No authorization code received') };
          }
          
          console.log('🔑 Authorization code 받음:', code.substring(0, 20) + '...');
          console.log('🔄 [Facebook] exchangeCodeForSession 호출 시작...');
          
          // 타임아웃 Promise 생성 (10초)
          const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
            setTimeout(() => reject(new Error('exchangeCodeForSession timeout (10s)')), 10000);
          });
          
          // exchangeCodeForSession과 타임아웃 경쟁
          let sessionData, sessionError;
          try {
            const result = await Promise.race([
              supabase.auth.exchangeCodeForSession(code),
              timeoutPromise
            ]);
            sessionData = result.data;
            sessionError = result.error;
          } catch (timeoutError: any) {
            console.error('❌ [Facebook] exchangeCodeForSession 타임아웃!');
            console.error('❌ [Facebook] 타임아웃 에러:', timeoutError.message);
            console.log('⚠️ [Facebook] 타임아웃이지만 onAuthStateChange가 처리할 것입니다.');
            return { data: null, error: timeoutError };
          }
          
          if (sessionError) {
            console.error('❌ [Facebook] 세션 교환 실패:', sessionError);
            console.error('❌ [Facebook] Error code:', sessionError.code);
            console.error('❌ [Facebook] Error message:', sessionError.message);
            console.error('❌ [Facebook] Error details:', JSON.stringify(sessionError));
            return { data: null, error: sessionError };
          }
          
          if (!sessionData || !sessionData.session) {
            console.error('❌ [Facebook] 세션 데이터가 없습니다');
            return { data: null, error: new Error('No session data received') };
          }
          
          console.log('🎉 [Facebook] 로그인 성공!', sessionData.user?.email);
          console.log('✅ [Facebook] Session ID:', sessionData.session.access_token.substring(0, 20) + '...');
          console.log('✅ [Facebook] onAuthStateChange가 자동으로 처리합니다.');
          
          return { data: sessionData, error: null };
        } catch (urlError) {
          console.error('❌ [Facebook] URL 파싱 실패:', urlError);
          return { data: null, error: urlError as Error };
        }
      } else if (result.type === 'cancel') {
        console.log('❌ [Facebook] 사용자가 취소함');
        return { data: null, error: new Error('User cancelled') };
      } else {
        console.error('❌ [Facebook] AuthSession 실패:', result.type);
        return { data: null, error: new Error(`AuthSession failed: ${result.type}`) };
      }
    } catch (browserError) {
      console.error('❌ [Facebook] 브라우저 열기 실패:', browserError);
      return { data: null, error: browserError as Error };
    }
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 네이티브 Apple OAuth (Expo AuthSession 사용)
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

    // 네이티브에서는 AuthSession 사용
    console.log('📱 Using Expo AuthSession for Apple OAuth...');
    
    // 1. Redirect URI 생성 (Expo Go에서는 exp:// scheme 사용)
    const redirectUri = __DEV__ 
      ? AuthSession.makeRedirectUri({
          scheme: undefined, // Expo Go의 기본 exp:// scheme 사용
          path: 'auth-callback',
        })
      : AuthSession.makeRedirectUri({
          scheme: 'artyard',
          path: 'auth-callback',
        });
    
    console.log('🔗 AuthSession Redirect URI:', redirectUri);
    console.log('🔍 __DEV__:', __DEV__);
    
    // 2. Supabase OAuth URL 생성
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });
    
    if (error || !data?.url) {
      console.error('❌ Apple OAuth URL 생성 실패:', error);
      return { data: null, error: error || new Error('No OAuth URL generated') };
    }
    
    console.log('🌐 Apple OAuth URL:', data.url);
    console.log('🔗 Expected redirect back to:', redirectUri);
    
    // 3. AuthSession으로 브라우저 열기 (자동으로 앱으로 돌아옴)
    console.log('⏳ Opening browser with AuthSession...');
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );
      
      console.log('📱 AuthSession result type:', result.type);
      console.log('📱 AuthSession full result:', JSON.stringify(result));
      
      if (result.type === 'success' && result.url) {
        console.log('✅ Apple OAuth 성공! Callback URL:', result.url);
        
        // URL에서 code 추출
        try {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          
          if (error) {
            console.error('❌ Apple OAuth 에러:', error, errorDescription);
            return { data: null, error: new Error(`OAuth error: ${error} - ${errorDescription}`) };
          }
          
          if (!code) {
            console.error('❌ Authorization code가 없습니다');
            return { data: null, error: new Error('No authorization code received') };
          }
          
          console.log('🔑 Authorization code 받음:', code.substring(0, 20) + '...');
          
          // Code를 세션으로 교환
          console.log('🔄 [Apple] exchangeCodeForSession 호출 시작...');
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            console.error('❌ [Apple] 세션 교환 실패:', sessionError);
            console.error('❌ [Apple] Error code:', sessionError.code);
            console.error('❌ [Apple] Error message:', sessionError.message);
            console.error('❌ [Apple] Error details:', JSON.stringify(sessionError));
            return { data: null, error: sessionError };
          }
          
          if (!sessionData || !sessionData.session) {
            console.error('❌ [Apple] 세션 데이터가 없습니다');
            return { data: null, error: new Error('No session data received') };
          }
          
          console.log('🎉 [Apple] 로그인 성공!', sessionData.user?.email);
          console.log('✅ [Apple] Session ID:', sessionData.session.access_token.substring(0, 20) + '...');
          
          // ⚠️ authStore.initialize() 제거 - SIGNED_IN 이벤트가 자동으로 처리
          // 중복 호출을 방지하여 더 빠르고 부드러운 로그인 경험 제공
          console.log('✅ [Apple] onAuthStateChange가 자동으로 처리합니다.');
          
          return { data: sessionData, error: null };
          
        } catch (urlError) {
          console.error('❌ URL 파싱 에러:', urlError);
          return { data: null, error: urlError as Error };
        }
      }
      
      // dismiss, cancel, locked 등
      console.error('❌ Apple OAuth 실패 또는 취소:', result.type);
      
      if (result.type === 'dismiss') {
        console.error('🚫 브라우저가 OAuth 완료 전에 닫혔습니다');
        console.error('💡 Supabase Redirect URL에 다음 URL이 등록되어 있는지 확인하세요:');
        console.error('   ', redirectUri);
      }
      
      return { data: null, error: new Error(`OAuth ${result.type}`) };
      
    } catch (browserError) {
      console.error('❌ AuthSession 에러:', browserError);
      return { data: null, error: browserError as Error };
    }
    
  } catch (error) {
    console.error('❌ Apple OAuth error:', error);
    return { data: null, error: error as Error };
  }
};
