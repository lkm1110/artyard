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
        // 프로필 정보 가져오기 또는 생성
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // 프로필이 없으면 새로 생성
        if (!profile && session.user) {
          console.log('프로필이 없어서 새로 생성합니다:', session.user.id);
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
            console.error('프로필 생성 오류:', createError);
          } else {
            profile = createdProfile;
            console.log('프로필 생성 성공:', profile);
          }
        }

        set({
          user: profile,
          session,
          isLoading: false,
          isAuthenticated: !!profile, // 프로필이 있을 때만 인증됨
        });
      } else {
        set({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }

      // 인증 상태 변경 리스너 설정
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인시 프로필 정보 가져오기 또는 생성
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // 프로필이 없으면 새로 생성
          if (!profile && session.user) {
            console.log('로그인 이벤트: 프로필이 없어서 새로 생성합니다:', session.user.id);
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
              console.error('로그인 이벤트: 프로필 생성 오류:', createError);
            } else {
              profile = createdProfile;
              console.log('로그인 이벤트: 프로필 생성 성공:', profile);
            }
          }

          set({
            user: profile,
            session,
            isAuthenticated: !!profile, // 프로필이 있을 때만 인증됨
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
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

