/**
 * Supabase 클라이언트 설정 및 서비스
 */

import { createClient } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import { storage } from '../utils/storage';

// 환경 변수에서 설정값 가져오기
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Supabase 클라이언트 생성 (크로스 플랫폼 세션 저장 설정 포함)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      async getItem(key: string) {
        try {
          return await storage.getItem(key);
        } catch {
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          await storage.setItem(key, value);
        } catch {
          // 실패시 무시
        }
      },
      async removeItem(key: string) {
        try {
          await storage.removeItem(key);
        } catch {
          // 실패시 무시
        }
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // 웹에서 OAuth 콜백 처리를 위해 활성화
    flowType: 'pkce', // PKCE 플로우 사용으로 보안 강화
  },
});

/**
 * OAuth 리다이렉트 URI 생성 (플랫폼별 처리)
 */
export const getRedirectUri = (provider?: string) => {
  // Apple과 Kakao OAuth는 개발 환경에서도 Supabase를 통해 처리
  if ((provider === 'apple' || provider === 'kakao') && typeof window !== 'undefined' && typeof document !== 'undefined') {
    const supabaseRedirectUri = 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback';
    console.log(`🔗 ${provider} 로그인 - Supabase 리다이렉트 URI:`, supabaseRedirectUri);
    return supabaseRedirectUri;
  }
  
  // 웹 환경에서는 현재 도메인 사용 (document 존재로 웹 환경 확실히 체크)
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 개발 환경 감지
    const isDev = hostname === 'localhost' || hostname.includes('172.30.1.') || hostname.includes('192.168.');
    
    if (isDev) {
      // 개발 환경: 항상 172.30.1.66:8085 사용 (모바일 웹 호환)
      const webRedirectUri = `${protocol}//172.30.1.66:8085/auth`;
      console.log('🌐 웹 개발 환경 리다이렉트 URI:', webRedirectUri);
      return webRedirectUri;
    } else {
      // 프로덕션 환경: 현재 도메인 사용
      const prodRedirectUri = `${window.location.origin}/auth`;
      console.log('🌐 웹 프로덕션 환경 리다이렉트 URI:', prodRedirectUri);
      return prodRedirectUri;
    }
  }
  
  // React Native 환경에서는 커스텀 스킴 사용
  const scheme = process.env.EXPO_PUBLIC_REDIRECT_SCHEME || 'artyard';
  const nativeRedirectUri = makeRedirectUri({ scheme, path: 'auth' });
  console.log('📱 React Native 리다이렉트 URI:', { scheme, nativeRedirectUri });
  return nativeRedirectUri;
};

/**
 * Google 소셜 로그인
 */
export const signInWithGoogle = async () => {
  try {
    const redirectUri = getRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 로그아웃
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { error: error as Error };
  }
};

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return { user: null, error: error as Error };
  }
};

/**
 * 현재 세션 가져오기
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('세션 가져오기 오류:', error);
    return { session: null, error: error as Error };
  }
};

