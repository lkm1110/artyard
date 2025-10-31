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

export const useAuthStore = create<AuthStore>((set, get) => ({
  // 상태
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  // 액션
  initialize: async () => {
    try {
      set({ isLoading: true });

      // 현재 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 확인 오류:', error);
        set({ 
          user: null, 
          session: null, 
          isLoading: false, 
          isAuthenticated: false 
        });
        return;
      }

      if (session?.user) {
        console.log('📱 [initialize] 세션 발견:', session.user.email);
        let profile = null;
        
        // 프로필 정보 가져오기 또는 생성 (타임아웃 15초)
        try {
          console.log('⏳ [initialize] 프로필 조회 중...');
          const startTime = Date.now();
          
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
              const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
                setTimeout(() => {
                  const elapsed = Date.now() - startTime;
                  reject({ 
                    code: 'TIMEOUT', 
                    message: `Profile fetch timeout (${elapsed}ms)`,
                    hint: 'Database might be slow or RLS policy issue'
                  });
                }, 30000); // 30초로 증가
              });
          
          const { data: fetchedProfile, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]);
          
          const elapsedTime = Date.now() - startTime;
          console.log(`⏱️ [initialize] 프로필 조회 완료 (${elapsedTime}ms)`);

          // 프로필 조회 에러 로그
          if (profileError) {
            console.error('❌ [initialize] 프로필 조회 에러:', profileError.code, profileError.message);
            console.log('User ID:', session.user.id);
            console.log('Email:', session.user.email);
            
            if (profileError.code === 'TIMEOUT') {
              console.error('💡 데이터베이스가 느립니다. database/FIX-PROFILE-TIMEOUT.sql을 Supabase에서 실행하세요!');
            }
          } else {
            profile = fetchedProfile;
            console.log('✅ [initialize] 프로필 조회 성공:', profile?.handle);
          }

          // 프로필이 없으면 새로 생성
          if (!profile && session.user) {
            console.log('⚠️ [initialize] 프로필이 없어서 새로 생성합니다:', session.user.id);
            console.log('📧 Email:', session.user.email);
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

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

            if (createError) {
              console.error('❌ [initialize] 프로필 생성 오류:', createError.code, createError.message);
              console.log('생성하려던 프로필:', newProfile);
            } else {
              profile = createdProfile;
              console.log('✅ [initialize] 프로필 생성 성공:', profile?.handle, profile?.email);
            }
          }
        } catch (profileError: any) {
          console.error('❌ [initialize] 프로필 처리 예외:', profileError);
          console.error('❌ [initialize] 에러 메시지:', profileError.message);
          console.error('❌ [initialize] 에러 코드:', profileError.code);
          console.error('❌ [initialize] 전체 에러:', JSON.stringify(profileError));
        }

        console.log('🔐 [initialize] 인증 상태 설정:', {
          hasSession: !!session,
          hasProfile: !!profile,
          handle: profile?.handle,
          email: session.user.email,
        });

        // ⚠️ 중요: 세션이 있으면 인증됨 (프로필은 선택사항)
        set({
          user: profile,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        });
        
        console.log('✅ [initialize] 완료 - isAuthenticated:', !!session);
      } else {
        console.log('❌ [initialize] 세션 없음');
        set({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }

      // 인증 상태 변경 리스너 설정
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log('인증 상태 변경:', event, session?.user?.id);

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🔑 SIGNED_IN 이벤트 발생:', session.user.email);
            console.log('👤 User ID:', session.user.id);
            console.log('📧 Email:', session.user.email);
            console.log('🔍 프로필 조회 시작...');
            
            let profile = null;
            
            try {
              // 로그인시 프로필 정보 가져오기 (간단한 타임아웃)
              console.log('⏳ [SIGNED_IN] 프로필 조회 중...');
              const startTime = Date.now();
              
              const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
                setTimeout(() => {
                  const elapsed = Date.now() - startTime;
                  reject({ 
                    code: 'TIMEOUT', 
                    message: `Profile fetch timeout (${elapsed}ms)`,
                    hint: 'Database might be slow or RLS policy issue'
                  });
                }, 30000); // 30초로 증가
              });
              
              const { data: fetchedProfile, error: profileError } = await Promise.race([
                profilePromise,
                timeoutPromise
              ]);
              
              const elapsedTime = Date.now() - startTime;
              console.log(`⏱️ [SIGNED_IN] 프로필 조회 완료 (${elapsedTime}ms)`);

              // 프로필 조회 에러 로그
              if (profileError) {
                console.error('❌ [SIGNED_IN] 프로필 조회 에러:', profileError.code, profileError.message);
                
                // PGRST116 = row not found는 정상 (새 사용자)
                if (profileError.code === 'PGRST116') {
                  console.log('ℹ️ [SIGNED_IN] 프로필이 없음 (새 사용자) - 생성합니다');
                } else {
                  console.error('❌ [SIGNED_IN] 예상치 못한 에러:', JSON.stringify(profileError));
                  console.error('💡 네트워크 문제이거나 데이터베이스 RLS 정책 문제일 수 있습니다.');
                }
              } else if (fetchedProfile) {
                profile = fetchedProfile;
                console.log('✅ [SIGNED_IN] 프로필 조회 성공:', profile.handle);
                console.log('✅ [SIGNED_IN] 프로필 ID:', profile.id);
              }

              // 프로필이 없으면 새로 생성
              if (!profile && session.user) {
                console.log('⚠️  [SIGNED_IN] 프로필이 없어서 새로 생성합니다:', session.user.id);
                console.log('📧 Email:', session.user.email);
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

                const { data: createdProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert([newProfile])
                  .select()
                  .single();

                if (createError) {
                  console.error('❌ [SIGNED_IN] 프로필 생성 오류:', createError.code, createError.message);
                  console.error('❌ [SIGNED_IN] 생성 오류 상세:', JSON.stringify(createError));
                  console.log('생성하려던 프로필:', newProfile);
                } else {
                  profile = createdProfile;
                  console.log('✅ [SIGNED_IN] 프로필 생성 성공:', profile?.handle);
                }
              }
            } catch (profileFetchError: any) {
              console.error('❌ [SIGNED_IN] 프로필 처리 중 예외 발생:', profileFetchError);
              console.error('❌ [SIGNED_IN] 예외 메시지:', profileFetchError.message);
              console.error('❌ [SIGNED_IN] 예외 타입:', profileFetchError.constructor.name);
              
              // 타임아웃이라도 계속 진행 (임시 프로필 생성 시도)
              if (profileFetchError.message?.includes('timeout')) {
                console.log('⚠️ [SIGNED_IN] 프로필 조회 타임아웃 - 임시로 기본 프로필 생성 시도');
              }
            }

            console.log('🔄 [SIGNED_IN] authStore 상태 업데이트 시작...');
            console.log('🔄 [SIGNED_IN] profile:', !!profile);
            console.log('🔄 [SIGNED_IN] session:', !!session);
            
            // ⚠️ 중요: 세션이 있으면 인증됨으로 처리 (프로필은 나중에 불러올 수 있음)
            const isAuthenticated = !!session;
            console.log('🔄 [SIGNED_IN] isAuthenticated:', isAuthenticated);
            
            if (!profile && session) {
              console.log('⚠️ [SIGNED_IN] 프로필 없이 인증됨 - 프로필은 나중에 다시 시도합니다');
            }
            
            set({
              user: profile,
              session,
              isAuthenticated, // 세션이 있으면 인증됨
            });
            
            console.log('✅ [SIGNED_IN] authStore 상태 업데이트 완료!');
            console.log('✅ [SIGNED_IN] 현재 상태 - isAuthenticated:', get().isAuthenticated);
            console.log('✅ [SIGNED_IN] 현재 상태 - user:', get().user?.handle || 'null');
            console.log('✅ [SIGNED_IN] 이제 RootNavigator가 메인 화면으로 전환해야 합니다.');
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('❌ [onAuthStateChange] 최상위 에러 발생:', error);
          console.error('❌ [onAuthStateChange] 에러 스택:', (error as Error).stack);
        }
      });
    } catch (error) {
      console.error('인증 초기화 오류:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({
        user: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
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

