/**
 * 인증 상태 관리 스토어 (Zustand)
 */

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { AuthState, Profile } from '../types';

interface AuthStore extends AuthState {
  // 액션
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Profile | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// ✅ onAuthStateChange 리스너 중복 방지 플래그
let authListenerRegistered = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // 상태
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isFirstTime: null,

  // 액션
  initialize: async () => {
    try {
      console.log('📱 [initialize] 인증 초기화 시작...');
      set({ isLoading: true });

      // 현재 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [initialize] 세션 확인 오류:', error);
        set({ 
          user: null, 
          session: null, 
          isLoading: false, 
          isAuthenticated: false 
        });
        return;
      }

      // ✅ onAuthStateChange 리스너를 한 번만 등록 (중복 방지)
      if (!authListenerRegistered) {
        console.log('✅ [initialize] onAuthStateChange 리스너 등록 (한 번만!)');
        authListenerRegistered = true;
        
        supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            console.log('🔔 [AUTH] 인증 상태 변경:', event, session?.user?.email);

            // ⚠️ SIGNED_IN 이벤트는 스킵! (새 세션이 제대로 전파되지 않음)
            // OAuth 직후 SIGNED_IN이 발생하지만 프로필 조회가 느림 (10초 타임아웃)
            // 대신 앱이 새로고침되면 INITIAL_SESSION이 발생하고 프로필 조회가 빠름 (1초 이내)
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('⚠️ [SIGNED_IN] 이벤트 스킵 - 세션을 저장하고 앱 새로고침 대기');
              console.log('💡 다음 INITIAL_SESSION 이벤트에서 프로필을 불러옵니다');
              
              // 세션만 저장하고 프로필 조회는 스킵
              set({
                session,
                isLoading: false,
                isAuthenticated: false, // 아직 프로필 없음
              });
              return; // 프로필 조회 스킵!
            }
            
            if (event === 'INITIAL_SESSION' && session?.user) {
              console.log(`🔑 [${event}] 이벤트 발생:`, session.user.email);
              console.log('👤 User ID:', session.user.id);
              console.log('📧 Email:', session.user.email);
              console.log('🔍 프로필 조회 시작...');
              
              let profile = null;
              
              try {
                // 로그인시 프로필 정보 가져오기
                console.log(`⏳ [${event}] 프로필 조회 중...`);
                console.log(`⏰ [${event}] 프로필 조회 시작 시간:`, new Date().toISOString());
                console.log(`🔍 [${event}] 세션 User ID:`, session.user.id);
                const startTime = Date.now();
                
                // 프로필 조회 (타임아웃 10초)
                const profilePromise = supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
                  setTimeout(() => {
                    const elapsed = Date.now() - startTime;
                    reject({
                      code: 'PROFILE_TIMEOUT',
                      message: `Profile fetch timeout after ${elapsed}ms`,
                      hint: 'Database is too slow or RLS policy is blocking access'
                    });
                  }, 10000); // 10초 타임아웃
                });
                
                let fetchedProfile, profileError;
                try {
                  const result = await Promise.race([profilePromise, timeoutPromise]);
                  fetchedProfile = result.data;
                  profileError = result.error;
                } catch (timeoutError: any) {
                  console.error(`❌ [${event}] 프로필 조회 타임아웃!`, timeoutError);
                  profileError = timeoutError;
                }
                
                const elapsedTime = Date.now() - startTime;
                console.log(`⏱️ [${event}] 프로필 조회 완료 (${elapsedTime}ms)`);

                // 프로필 조회 에러 로그
                if (profileError) {
                  if (profileError.code === 'PROFILE_TIMEOUT') {
                    console.error('⏰ [AUTH] 프로필 조회 타임아웃 (10초)');
                    console.error('⚠️ [AUTH] 데이터베이스가 너무 느립니다!');
                    console.error('💡 [AUTH] 해결 방법:');
                    console.error('   1. database/OPTIMIZE-PROFILES-RLS.sql을 Supabase에서 실행');
                    console.error('   2. RLS 정책 확인 (profiles 테이블)');
                    console.error('   3. 네트워크 연결 확인');
                    console.error('📊 [AUTH] User ID:', session.user.id);
                    console.error('📊 [AUTH] Email:', session.user.email);
                  } else if (profileError.code === 'PGRST116') {
                    console.log('ℹ️ [AUTH] 프로필이 없음 (새 사용자) - 생성합니다');
                  } else {
                    console.error('❌ [AUTH] 프로필 조회 에러:', profileError.code, profileError.message);
                    console.error('💡 네트워크 문제이거나 데이터베이스 RLS 정책 문제일 수 있습니다.');
                  }
                } else if (fetchedProfile) {
                  profile = fetchedProfile;
                  console.log('✅ [AUTH] 프로필 조회 성공:', profile.handle);
                  console.log('✅ [AUTH] 프로필 ID:', profile.id);
                }

                // 프로필이 없으면 새로 생성
                if (!profile && session.user) {
                  console.log('⚠️  [AUTH] 프로필이 없어서 새로 생성합니다:', session.user.id);
                  console.log('📧 Email:', session.user.email);
                  
                  try {
                    const newProfile = {
                      id: session.user.id,
                      handle: session.user.user_metadata?.full_name || 
                             session.user.email?.split('@')[0] || 
                             'artist_' + session.user.id.slice(0, 8),
                      school: 'Art University', // 기본값
                      department: 'Fine Arts', // 기본값
                      bio: 'New artist in the ArtYard community!',
                      avatar_url: session.user.user_metadata?.avatar_url || null,
                      is_verified_school: false,
                    };

                    const createStartTime = Date.now();
                    
                    // 프로필 생성 (타임아웃 없음)
                    const { data: createdProfile, error: createError } = await supabase
                      .from('profiles')
                      .insert([newProfile])
                      .select()
                      .single();
                    
                    const createElapsed = Date.now() - createStartTime;
                    console.log(`⏱️ [AUTH] 프로필 생성 완료 (${createElapsed}ms)`);

                    if (createError) {
                      console.error('❌ [AUTH] 프로필 생성 오류:', createError.code, createError.message);
                      console.error('❌ [AUTH] 생성 오류 상세:', JSON.stringify(createError));
                      console.log('생성하려던 프로필:', newProfile);
                    } else if (createdProfile) {
                      profile = createdProfile;
                      console.log('✅ [AUTH] 프로필 생성 성공:', profile?.handle);
                    }
                  } catch (createException) {
                    console.error('❌ [AUTH] 프로필 생성 예외:', createException);
                  }
                }
              } catch (profileFetchError: any) {
                console.error('❌ [AUTH] 프로필 처리 중 예외 발생:', profileFetchError);
                console.error('❌ [AUTH] 예외 메시지:', profileFetchError.message);
                console.error('❌ [AUTH] 예외 타입:', profileFetchError.constructor.name);
              }

              console.log('🔄 [AUTH] authStore 상태 업데이트 시작...');
              console.log('🔄 [AUTH] profile:', !!profile);
              console.log('🔄 [AUTH] session:', !!session);
              
              // ⚠️ 중요: 프로필이 있어야 인증 완료! (프로필 없으면 앱 사용 불가)
              const isAuthenticated = !!(session && profile);
              console.log('🔄 [AUTH] isAuthenticated:', isAuthenticated);
              
              if (!profile && session) {
                console.error('⚠️ [AUTH] 프로필을 불러오지 못했습니다');
                console.error('⚠️ [AUTH] 네트워크를 확인하거나 다시 시도해주세요');
              }
              
              // Zustand set 사용
              set({
                user: profile,
                session,
                isAuthenticated, // 세션 + 프로필이 있어야 인증 완료
                isLoading: false,
              });
              
              console.log('✅ [AUTH] authStore 상태 업데이트 완료!');
              console.log('✅ [AUTH] 현재 상태 - isAuthenticated:', get().isAuthenticated);
              console.log('✅ [AUTH] 현재 상태 - user:', get().user?.handle || 'null');
            } else if (event === 'SIGNED_OUT') {
              console.log('🔑 SIGNED_OUT 이벤트 발생');
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('❌ [onAuthStateChange] 최상위 에러 발생:', error);
            console.error('❌ [onAuthStateChange] 에러 스택:', (error as Error).stack);
          }
        });
      } else {
        console.log('⚠️ [initialize] 리스너가 이미 등록되어 있습니다 - 스킵');
      }

      if (session?.user) {
        console.log('✅ [initialize] 세션 발견:', session.user.email);
        
        // 리스너가 이미 등록된 경우 (두 번째 initialize 호출)
        // INITIAL_SESSION 이벤트가 발생하지 않으므로 직접 프로필 조회!
        if (authListenerRegistered) {
          console.log('⚠️ [initialize] 리스너 이미 등록됨 - 직접 프로필 조회 시작!');
          
          try {
            set({ isLoading: true });
            
            console.log('⏳ [initialize] 프로필 조회 중...');
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('❌ [initialize] 프로필 조회 실패:', profileError);
              set({
                session,
                user: null,
                isLoading: false,
                isAuthenticated: false,
              });
            } else if (profile) {
              console.log('✅ [initialize] 프로필 조회 성공:', profile.handle);
              set({
                session,
                user: profile,
                isLoading: false,
                isAuthenticated: true,
              });
            }
          } catch (error) {
            console.error('❌ [initialize] 프로필 조회 예외:', error);
            set({
              session,
              user: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } else {
          // 첫 번째 initialize 호출 - INITIAL_SESSION 이벤트 대기
          console.log('⏳ [initialize] INITIAL_SESSION 이벤트가 프로필을 불러올 것입니다...');
          
          set({
            session,
            isLoading: true, // INITIAL_SESSION 이벤트 대기 중
            isAuthenticated: false, // 프로필 로드 후 true로 변경됨
          });
          
          console.log('✅ [initialize] 세션 확인 완료 - INITIAL_SESSION 이벤트 대기 중...');
        }
      } else {
        console.log('❌ [initialize] 세션 없음 - 로그인 필요');
        set({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('❌ [initialize] 인증 초기화 오류:', error);
      set({ 
        user: null, 
        session: null, 
        isLoading: false, 
        isAuthenticated: false 
      });
    }
  },

  signOut: async () => {
    try {
      console.log('🔓 [signOut] 로그아웃 시작...');
      
      // 세션이 있는 경우에만 Supabase signOut 호출
      const { session } = get();
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('❌ [signOut] Supabase 로그아웃 에러:', error);
          // 에러가 있어도 로컬 상태는 초기화
        }
      } else {
        console.log('⚠️ [signOut] 세션 없음 - 로컬 상태만 초기화');
      }
      
      // 로컬 상태 초기화
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      console.log('✅ [signOut] 로그아웃 완료');
    } catch (error) {
      console.error('❌ [signOut] 로그아웃 오류:', error);
      
      // 에러가 있어도 로컬 상태는 초기화
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  },

  setSession: (session) => {
    set({ session });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
