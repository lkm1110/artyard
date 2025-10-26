/**
 * Supabase 클라이언트 설정 및 서비스
 */

import { createClient } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
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

