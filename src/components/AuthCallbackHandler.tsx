/**
 * OAuth 콜백 핸들러 컴포넌트
 * 웹에서 OAuth 완료 후 인증 상태를 처리
 */

import React, { useEffect } from 'react';
import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { debugLog } from './DebugLogger';
import { storage } from '../utils/storage';

// JWT 토큰 디코딩 헬퍼 (네트워크 없이 사용자 정보 추출)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    debugLog('❌ JWT 디코딩 실패: ' + error, 'error');
    return null;
  }
};

export const AuthCallbackHandler: React.FC = () => {
  const { initialize, setSession, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 웹 환경에서의 OAuth 콜백 처리
    const handleWebAuthCallback = async () => {
      if (Platform.OS !== 'web') return;
      
      try {
        // URL에서 해시 체크 (OAuth 콜백 감지)
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          
          console.log('🔍 현재 URL 정보:');
          console.log('  - Hash:', window.location.hash);
          console.log('  - Search:', window.location.search);
          
          // OAuth 관련 파라미터가 있는지 확인
          const hasAccessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const hasError = hashParams.get('error') || searchParams.get('error');
          const hasCode = hashParams.get('code') || searchParams.get('code');
          
          if (hasAccessToken || hasError || hasCode) {
            console.log('🔄 OAuth 콜백 감지 - 인증 상태 새로고침 중...');
            
            // 잠시 기다린 후 인증 상태 다시 초기화
            setTimeout(async () => {
              console.log('🔄 인증 상태 재초기화 시작...');
              await initialize();
              
              // 현재 세션 상태 확인
              const { data: { session }, error } = await supabase.auth.getSession();
              console.log('📊 콜백 후 세션 상태:', { session: !!session, user: session?.user?.id, error });
              
              // URL 파라미터 제거
              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              
              console.log('✅ OAuth 콜백 처리 완료');
            }, 1500);
          }
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 오류:', error);
      }
    };

    // 네이티브 환경에서의 Deep Link 처리
    const handleNativeAuthCallback = async () => {
      if (Platform.OS === 'web') return;

      try {
        console.log('📱 네이티브 Deep Link 리스너 설정 중...');
        
        // Deep Link URL 처리 함수
        const handleUrl = async (url: string) => {
          console.log('🔗 Received deep link URL:', url);
          debugLog('🔗 Deep Link 수신: ' + url, 'info');
          
          if (url && (url.includes('artyard://') || url.includes('auth-callback'))) {
            debugLog('🔄 OAuth 콜백 감지!', 'info');
            
            // OAuth 콜백 파라미터 파싱
            try {
              // URL에서 # 또는 ? 이후의 파라미터 추출
              let paramString = '';
              if (url.includes('#')) {
                paramString = url.split('#')[1] || '';
              } else if (url.includes('?')) {
                paramString = url.split('?')[1] || '';
              }
              
              console.log('📋 파라미터 문자열:', paramString);
              
              const params = new URLSearchParams(paramString);
              
              console.log('📋 OAuth 콜백 파라미터:');
              const paramsObj: any = {};
              for (const [key, value] of params.entries()) {
                paramsObj[key] = value;
                if (key === 'access_token' || key === 'refresh_token') {
                  console.log(`  - ${key}: ${value.substring(0, 20)}...`);
                } else {
                console.log(`  - ${key}: ${value}`);
                }
              }
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const code = params.get('code');
              const error = params.get('error');
              const type = params.get('type');
              
              if (error) {
                debugLog('❌ OAuth 에러: ' + error, 'error');
                debugLog('❌ 에러 설명: ' + params.get('error_description'), 'error');
              } else if (code) {
                // PKCE flow: code를 토큰으로 교환
                debugLog('🔑 Authorization Code 감지!', 'info');
                debugLog('🔑 Code: ' + code.substring(0, 20) + '...', 'info');
                
                try {
                  debugLog('🔄 토큰 교환 시도 중...', 'info');
                  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                  
                  if (exchangeError) {
                    debugLog('❌ Code 교환 실패: ' + exchangeError.message, 'error');
                    debugLog('❌ 에러: ' + (exchangeError.status || 'unknown'), 'error');
                    
                    // 재시도 로직
                    debugLog('🔄 3초 후 재시도...', 'warning');
                    setTimeout(async () => {
                      debugLog('🔄 재시도 중...', 'info');
                      const retry = await supabase.auth.exchangeCodeForSession(code);
                      if (retry.error) {
                        debugLog('❌ 재시도 실패: ' + retry.error.message, 'error');
                      } else if (retry.data?.session) {
                        debugLog('✅ 재시도 성공!', 'success');
                        await initialize();
                      }
                    }, 3000);
                  } else if (data?.session) {
                    debugLog('✅ 로그인 성공!', 'success');
                    debugLog('👤 ' + (data.session.user.email || 'Unknown'), 'success');
                    debugLog('🔐 ' + (data.session.user.app_metadata?.provider || 'Unknown'), 'success');
                    
                    // 세션 저장 확인
                    setTimeout(async () => {
                      const check = await supabase.auth.getSession();
                      debugLog('세션 확인: ' + (check.data.session ? '✅ 유지됨' : '❌ 사라짐'), check.data.session ? 'success' : 'error');
                    }, 1000);
                    
                    await initialize();
                    return; // 성공적으로 완료
                  } else {
                    debugLog('⚠️ 데이터 없음', 'warning');
                  }
                } catch (err: any) {
                  debugLog('❌ 예외 발생: ' + (err.message || String(err)), 'error');
                }
              } else if (accessToken && refreshToken) {
                // 직접 토큰이 전달된 경우
                debugLog('✅ Access Token 감지!', 'info');
                debugLog('Token 길이: ' + accessToken.length, 'info');
                
                // Supabase가 사용하는 올바른 키로 저장
                const supabaseStorageKey = 'sb-bkvycanciimgyftdtqpx-auth-token';
                try {
                  const sessionData = {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    expires_in: 3600,
                    token_type: 'bearer',
                    user: null, // 나중에 Supabase가 채움
                  };
                  
                  await storage.setItem(supabaseStorageKey, JSON.stringify(sessionData));
                  debugLog('💾 Supabase 키로 저장 완료!', 'success');
                  debugLog('🔑 저장 키: ' + supabaseStorageKey, 'info');
                } catch (storageError: any) {
                  debugLog('⚠️ 로컬 저장 실패: ' + storageError.message, 'warning');
                }
                
                try {
                  debugLog('🔄 세션 설정 시도 중...', 'info');
                  
                  // Supabase에 직접 세션 설정 (타임아웃 10초)
                  const sessionPromise = supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  
                  const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('세션 설정 타임아웃 (10초)')), 10000)
                  );
                  
                  const { data, error: sessionError } = await Promise.race([
                    sessionPromise,
                    timeoutPromise,
                  ]) as any;
                  
                  if (sessionError) {
                    debugLog('❌ 세션 설정 실패: ' + sessionError.message, 'error');
                    debugLog('❌ 에러 상태: ' + (sessionError.status || 'unknown'), 'error');
                    debugLog('🔓 JWT 디코딩으로 오프라인 로그인 시도...', 'warning');
                    
                    // JWT 토큰 디코딩해서 사용자 정보 추출
                    const decodedToken = decodeJWT(accessToken);
                    
                    if (decodedToken) {
                      debugLog('✅ JWT 디코딩 성공!', 'success');
                      debugLog('👤 사용자 ID: ' + decodedToken.sub, 'info');
                      debugLog('📧 이메일: ' + (decodedToken.email || 'N/A'), 'info');
                      
                      // 수동으로 세션 객체 생성
                      const manualSession = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        expires_at: decodedToken.exp,
                        expires_in: 3600,
                        token_type: 'bearer',
                        user: {
                          id: decodedToken.sub,
                          email: decodedToken.email,
                          user_metadata: decodedToken.user_metadata || {},
                          app_metadata: decodedToken.app_metadata || {},
                          aud: decodedToken.aud,
                          created_at: decodedToken.created_at || new Date().toISOString(),
                        },
                      };
                      
                      // authStore에 직접 세션 설정
                      setSession(manualSession);
                      debugLog('💾 수동 세션 설정 완료!', 'success');
                      
                      // 프로필 정보 가져오기 시도 (네트워크 있으면)
                      let profileSet = false;
                      try {
                        const { data: profile } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('id', decodedToken.sub)
                          .single();
                        
                        if (profile) {
                          setUser(profile);
                          debugLog('✅ 프로필 로드 성공!', 'success');
                          profileSet = true;
                        }
                      } catch (profileError) {
                        debugLog('⚠️ 프로필 로드 실패 - 기본 프로필 생성', 'warning');
                      }
                      
                      // 프로필을 못 가져왔으면 기본 프로필로 로그인
                      if (!profileSet) {
                        const basicProfile = {
                          id: decodedToken.sub,
                          handle: decodedToken.email?.split('@')[0] || 'user_' + decodedToken.sub.slice(0, 8),
                          school: 'Unknown',
                          department: 'Unknown',
                          bio: 'Welcome to ArtYard!',
                          avatar_url: null,
                          is_verified_school: false,
                        };
                        setUser(basicProfile);
                        debugLog('✅ 기본 프로필로 로그인!', 'success');
                      }
                      
                      setLoading(false);
                      debugLog('🎉 오프라인 로그인 완료!', 'success');
                      return;
                    } else {
                      debugLog('❌ JWT 디코딩 실패 - initialize() 시도', 'error');
                      await initialize();
                      return;
                    }
                  } else if (data?.session) {
                    debugLog('✅ 로그인 성공!', 'success');
                    debugLog('👤 ' + (data.session.user.email || 'Unknown'), 'success');
                    
                    // 세션 저장 확인
                    setTimeout(async () => {
                      const check = await supabase.auth.getSession();
                      debugLog('세션 확인: ' + (check.data.session ? '✅ 유지됨' : '❌ 사라짐'), check.data.session ? 'success' : 'error');
                    }, 1000);
                    
                    await initialize();
                    return; // 세션 설정 완료되면 바로 반환
                  } else {
                    debugLog('⚠️ 세션 데이터 없음', 'warning');
                    // 로컬 저장으로 폴백
                    debugLog('⚠️ 로컬 저장된 토큰 사용...', 'warning');
                    await initialize();
                    return;
                  }
                } catch (err: any) {
                  debugLog('❌ 예외: ' + err.message, 'error');
                  
                  if (err.message.includes('타임아웃')) {
                    debugLog('⏱️ 타임아웃 발생 - 로컬 토큰 사용', 'warning');
                  } else {
                    debugLog('⚠️ 네트워크 에러 - 로컬 토큰 사용', 'warning');
                  }
                  
                  // 로컬에 이미 저장했으므로 계속 진행
                  await initialize();
                  return;
                }
              } else {
                debugLog('⚠️ 토큰/Code 없음', 'warning');
                const paramObj = Object.fromEntries(params.entries());
                const paramStr = Object.keys(paramObj).join(', ') || 'empty';
                debugLog('파라미터 키: ' + paramStr, 'warning');
              }
            } catch (error) {
              console.log('⚠️ URL 파싱 실패:', error);
            }
            
            // 잠시 기다린 후 세션 확인
            setTimeout(async () => {
              try {
                console.log('🔄 세션 상태 확인 중...');
                await initialize();
                
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('📊 Deep link 후 세션 상태:', { session: !!session, user: session?.user?.id, error });
                
                if (session) {
                  console.log('✅ 로그인 성공! 사용자 ID:', session.user?.id);
                  console.log('👤 사용자 정보:', {
                    email: session.user?.email,
                    provider: session.user?.app_metadata?.provider
                  });
                } else {
                  console.log('❌ 로그인 실패 또는 세션 없음');
                  console.log('🔄 추가 세션 확인 시도...');
                  
                  // 추가 재시도
                  setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) {
                      console.log('✅ 재시도로 로그인 확인됨!');
                      await initialize();
                    } else {
                      console.log('❌ 재시도에도 로그인 실패');
                    }
                  }, 3000);
                }
              } catch (error) {
                console.error('❌ Deep link 세션 처리 오류:', error);
              }
            }, 2000);
          }
        };

        // 현재 URL 확인 (앱이 deep link로 시작된 경우)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🚀 앱 시작 시 deep link 감지:', initialUrl);
          await handleUrl(initialUrl);
        }

        // Deep Link 이벤트 리스너 등록
        const subscription = Linking.addEventListener('url', (event) => {
          handleUrl(event.url);
        });

        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error('네이티브 Deep Link 설정 오류:', error);
      }
    };

    // 정기적인 세션 확인 (네이티브에서 OAuth 완료 후를 위해)
    const checkSessionPeriodically = () => {
      if (Platform.OS === 'web') return;

      const interval = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('🔄 정기 세션 확인: 로그인됨');
            await initialize(); // 상태 업데이트
            clearInterval(interval); // 로그인되면 정기 확인 중단
          }
        } catch (error) {
          console.error('정기 세션 확인 오류:', error);
        }
      }, 3000); // 3초마다 확인

      // 30초 후 정기 확인 중단
      setTimeout(() => {
        clearInterval(interval);
      }, 30000);

      return () => clearInterval(interval);
    };

    // 앱 상태 변경 감지 (포그라운드 진입 시 세션 체크)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (Platform.OS === 'web') return;
      
      console.log('📱 AppState 변경:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('🔄 앱이 포그라운드로 돌아옴 - 세션 상태 확인 중...');
        
        try {
          // 잠시 기다린 후 세션 확인 (웹에서 앱으로 전환 시간 고려)
          setTimeout(async () => {
            console.log('🔍 포그라운드 세션 확인 시작...');
            
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('📊 포그라운드 세션 상태:', { 
              session: !!session, 
              user: session?.user?.id, 
              provider: session?.user?.app_metadata?.provider,
              error 
            });
            
            if (session) {
              console.log('✅ 포그라운드에서 로그인 감지! 상태 업데이트 중...');
              await initialize(); // authStore 상태 업데이트
              
              // 추가 확인
              setTimeout(() => {
                console.log('🔄 로그인 상태 재확인...');
                initialize();
              }, 2000);
            } else {
              console.log('❌ 포그라운드에서 세션 없음');
            }
          }, 1000); // 1초 후 체크
        } catch (error) {
          console.error('❌ 포그라운드 세션 확인 오류:', error);
        }
      }
    };

    // 플랫폼별 처리 실행
    if (Platform.OS === 'web') {
      handleWebAuthCallback();
      
      // popstate 이벤트 리스너
      const handlePopState = () => {
        handleWebAuthCallback();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
      }
    } else {
      // 네이티브 환경
      console.log('📱 네이티브 OAuth 처리 초기화 중...');
      
      const cleanup1 = handleNativeAuthCallback();
      const cleanup2 = checkSessionPeriodically();
      
      // AppState 리스너 추가
      console.log('📱 AppState 리스너 등록 중...');
      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      // 즉시 한 번 세션 체크
      setTimeout(() => {
        console.log('🚀 초기 세션 상태 확인...');
        handleAppStateChange('active');
      }, 500);
      
      return () => {
        cleanup1?.then(fn => fn?.());
        cleanup2?.();
        appStateSubscription?.remove();
        console.log('📱 AuthCallbackHandler 정리 완료');
      };
    }
  }, [initialize]);

  return null;
};
