/**
 * OAuth 콜백 핸들러 컴포넌트
 * 웹에서 OAuth 완료 후 인증 상태를 처리
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export const AuthCallbackHandler: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // 웹 환경에서만 실행
    if (Platform.OS !== 'web') return;

    const handleAuthCallback = async () => {
      try {
        // URL에서 해시 체크 (OAuth 콜백 감지)
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          
          console.log('🔍 현재 URL 정보:');
          console.log('  - Hash:', window.location.hash);
          console.log('  - Search:', window.location.search);
          console.log('  - Hash Params:', Object.fromEntries(hashParams));
          console.log('  - Search Params:', Object.fromEntries(searchParams));
          
          // OAuth 관련 파라미터가 있는지 확인 (hash 또는 search 파라미터)
          const hasAccessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const hasError = hashParams.get('error') || searchParams.get('error');
          const hasCode = hashParams.get('code') || searchParams.get('code');
          
          if (hasAccessToken || hasError || hasCode) {
            console.log('🔄 OAuth 콜백 감지 - 인증 상태 새로고침 중...');
            console.log('  - Access Token:', !!hasAccessToken);
            console.log('  - Error:', hasError);
            console.log('  - Code:', hasCode);
            
            // 잠시 기다린 후 인증 상태 다시 초기화
            setTimeout(async () => {
              console.log('🔄 인증 상태 재초기화 시작...');
              await initialize();
              
              // 현재 세션 상태 확인
              const { data: { session }, error } = await supabase.auth.getSession();
              console.log('📊 콜백 후 세션 상태:', { session: !!session, user: session?.user?.id, error });
              
              // URL 파라미터 제거 (깔끔하게)
              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              
              console.log('✅ OAuth 콜백 처리 완료');
            }, 1500); // 1.5초로 증가
          }
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 오류:', error);
      }
    };

    // 즉시 실행
    handleAuthCallback();

    // popstate 이벤트 리스너 (뒤로가기/앞으로가기 감지)
    const handlePopState = () => {
      handleAuthCallback();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [initialize]);

  return null; // 렌더링하지 않음
};
