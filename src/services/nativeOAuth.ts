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
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          // MFA Number Matching 우회 시도
          auth_type: 'reauthenticate',
        },
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
      
      // ✅ success 또는 dismiss 모두 처리 (URL이 있으면 code 추출 시도)
      if (result.url) {
        console.log('🔗 [Google] Callback URL 발견:', result.url);
        console.log('ℹ️ [Google] result.type:', result.type);
        
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
            console.log('ℹ️ URL에 code가 없음 - 사용자가 취소했을 가능성');
            return { 
              data: null, 
              error: { 
                message: 'OAUTH_CANCELLED',
                type: result.type 
              } as any
            };
          }
          
          console.log('🔑 Authorization code 받음:', code.substring(0, 20) + '...');
          console.log('✅ [Google] code 추출 성공! (result.type: ' + result.type + ')');
          
          // Code를 세션으로 교환
          console.log('🔄 [Google] exchangeCodeForSession 호출 시작...');
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ [Google] 세션 교환 실패:', sessionError);
            return { data: null, error: sessionError };
          }
          
          if (!sessionData || !sessionData.session) {
            console.error('❌ [Google] 세션 데이터가 없습니다');
            return { data: null, error: new Error('No session data received') };
          }
          
          console.log('🎉 [Google] 로그인 성공!', sessionData.user?.email);
          return { data: sessionData, error: null };
          
        } catch (urlError) {
          console.error('❌ URL 파싱 에러:', urlError);
          return { data: null, error: urlError as Error };
        }
      }
      
      // URL이 없는 경우 - 진짜 취소
      console.log('ℹ️ [Google] URL 없음 - OAuth 취소됨:', result.type);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('👤 [Google] 사용자가 로그인을 취소했습니다');
        return { 
          data: null, 
          error: { 
            message: 'OAUTH_CANCELLED',
            type: result.type 
          } as any
        };
      }
      
      if (result.type === 'locked') {
        console.error('🔒 [Google] 브라우저가 잠겨있습니다');
        return { data: null, error: new Error('Browser is locked') };
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
          
          // 타임아웃 Promise 생성 (60초 - 느린 네트워크 고려)
          const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
            setTimeout(() => reject(new Error('exchangeCodeForSession timeout (60s). Network may be slow.')), 60000);
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
            console.log('⚠️ [Facebook] 타임아웃 발생! 백그라운드에서 세션 확인을 시도합니다...');
            
            // 🔄 백그라운드에서 세션 확인 재시도 (서버에 세션이 생성되었을 수 있음)
            setTimeout(async () => {
              try {
                console.log('🔍 [Facebook] 백그라운드 세션 확인 중...');
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                
                if (retrySession) {
                  console.log('✅ [Facebook] 백그라운드 세션 발견! 로그인 처리 중...');
                  const { initialize } = await import('../store/authStore').then(m => m.useAuthStore.getState());
                  await initialize();
                  console.log('🎉 [Facebook] 백그라운드 로그인 성공!');
                } else {
                  console.log('❌ [Facebook] 백그라운드에서도 세션을 찾을 수 없습니다.');
                }
              } catch (retryError) {
                console.error('❌ [Facebook] 백그라운드 세션 확인 실패:', retryError);
              }
            }, 3000);
            
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
          
          // ✅ 명시적으로 authStore 초기화 (프로필 즉시 로드)
          console.log('🔄 [Facebook] authStore 초기화 시작...');
          const { initialize } = await import('../store/authStore').then(m => m.useAuthStore.getState());
          await initialize();
          console.log('✅ [Facebook] authStore 초기화 완료 - 로그인 즉시 반영!');
          
          return { data: sessionData, error: null };
        } catch (urlError) {
          console.error('❌ [Facebook] URL 파싱 실패:', urlError);
          return { data: null, error: urlError as Error };
        }
      }
      
      // dismiss, cancel, locked 등
      console.log('ℹ️ [Facebook] OAuth 취소됨:', result.type);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('👤 [Facebook] 사용자가 로그인을 취소했습니다');
        return { 
          data: null, 
          error: { 
            message: 'OAUTH_CANCELLED',
            type: result.type 
          } as any
        };
      }
      
      console.error('❌ [Facebook] AuthSession 실패:', result.type);
      return { data: null, error: new Error(`AuthSession failed: ${result.type}`) };
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
          
          // Code를 세션으로 교환 (타임아웃 60초 - 느린 네트워크 고려)
          console.log('🔄 [Apple] exchangeCodeForSession 호출 시작...');
          console.log('⏳ [Apple] 타임아웃: 60초 (네트워크 지연 고려)');
          
          // 타임아웃 Promise 생성 (60초)
          const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
            setTimeout(() => reject(new Error('Token exchange timeout (60s). Network may be slow.')), 60000);
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
            console.error('❌ [Apple] exchangeCodeForSession 타임아웃!');
            console.error('❌ [Apple] 타임아웃 에러:', timeoutError.message);
            console.log('⚠️ [Apple] 타임아웃 발생! 백그라운드에서 세션 확인을 시도합니다...');
            
            // 🔄 백그라운드에서 세션 확인 재시도 (서버에 세션이 생성되었을 수 있음)
            setTimeout(async () => {
              try {
                console.log('🔍 [Apple] 백그라운드 세션 확인 중...');
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                
                if (retrySession) {
                  console.log('✅ [Apple] 백그라운드 세션 발견! 로그인 처리 중...');
                  const { initialize } = await import('../store/authStore').then(m => m.useAuthStore.getState());
                  await initialize();
                  console.log('🎉 [Apple] 백그라운드 로그인 성공!');
                } else {
                  console.log('❌ [Apple] 백그라운드에서도 세션을 찾을 수 없습니다.');
                }
              } catch (retryError) {
                console.error('❌ [Apple] 백그라운드 세션 확인 실패:', retryError);
              }
            }, 3000);
            
            return { data: null, error: timeoutError };
          }
          
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
          
          // ✅ 명시적으로 authStore 초기화 (프로필 즉시 로드)
          console.log('🔄 [Apple] authStore 초기화 시작...');
          const { initialize } = await import('../store/authStore').then(m => m.useAuthStore.getState());
          await initialize();
          console.log('✅ [Apple] authStore 초기화 완료 - 로그인 즉시 반영!');
          
          return { data: sessionData, error: null };
          
        } catch (urlError) {
          console.error('❌ URL 파싱 에러:', urlError);
          return { data: null, error: urlError as Error };
        }
      }
      
      // dismiss, cancel, locked 등
      console.log('ℹ️ [Apple] OAuth 취소됨:', result.type);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('👤 [Apple] 사용자가 로그인을 취소했습니다');
        return { 
          data: null, 
          error: { 
            message: 'OAUTH_CANCELLED',
            type: result.type 
          } as any
        };
      }
      
      if (result.type === 'locked') {
        console.error('🔒 [Apple] 브라우저가 잠겨있습니다');
        return { data: null, error: new Error('Browser is locked') };
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
