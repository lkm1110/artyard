/**
 * Supabase 클라이언트 설정 및 서비스
 */

import { createClient } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// app.json의 extra에서 설정값 가져오기
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bkvycanciimgyftdtqpx.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY';

console.log('🔍 [Supabase] URL:', supabaseUrl);
console.log('🔍 [Supabase] Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// 크로스 플랫폼 Storage 설정
const createStorage = () => {
  if (Platform.OS === 'web') {
    // 웹 환경에서는 localStorage 사용
    return {
      async getItem(key: string) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(key);
          }
          return null;
        } catch {
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch {
          // 실패시 무시
        }
      },
      async removeItem(key: string) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch {
          // 실패시 무시
        }
      },
    };
  } else {
    // 네이티브 환경에서는 AsyncStorage 직접 사용
    return {
      async getItem(key: string) {
        try {
          return await AsyncStorage.getItem(key);
        } catch {
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          await AsyncStorage.setItem(key, value);
        } catch {
          // 실패시 무시
        }
      },
      async removeItem(key: string) {
        try {
          await AsyncStorage.removeItem(key);
        } catch {
          // 실패시 무시
        }
      },
    };
  }
};

// Supabase 클라이언트 생성 (올바른 비동기 Storage 사용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // 웹에서만 활성화
    flowType: 'pkce', // PKCE 플로우 사용으로 보안 강화
  },
});

/**
 * OAuth 리다이렉트 URI 생성 (항상 Supabase 콜백 사용)
 */
export const getRedirectUri = (provider?: string) => {
  console.log(`🔍 OAuth 플랫폼 감지: ${Platform.OS}, provider: ${provider}`);
  
  // ⭐ OAuth는 개발/프로덕션 관계없이 항상 Supabase 콜백 URL 사용
  // 이유: 네이티브 앱은 localhost로 돌아올 수 없고, 웹에서도 통일성을 위해 Supabase 사용
  const supabaseRedirectUri = 'https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback';
  
  console.log(`🔄 OAuth 리다이렉트 URI (${Platform.OS}):`, supabaseRedirectUri);
  console.log(`📍 이유: OAuth는 항상 Supabase 콜백 사용 (localhost 사용 안함)`);
  
  return supabaseRedirectUri;
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

