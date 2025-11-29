/**
 * React Query 클라이언트 설정
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * 캐시 전략 설정
 * 데이터 특성에 따라 다른 캐시 정책 사용
 */
export const CACHE_STRATEGIES = {
  // 정적 데이터 (거의 변하지 않음)
  static: {
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  
  // 일반 데이터 (가끔 변함) - 기본값
  normal: {
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  
  // 실시간 데이터 (자주 변함)
  realtime: {
    staleTime: 0, // 항상 최신
    gcTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  
  // 사용자 프로필 (가끔 변함, 오래 캐시)
  profile: {
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 60, // 1시간
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  
  // 피드 데이터 (자주 변함)
  feed: {
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 15, // 15분
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본값: normal 전략
      ...CACHE_STRATEGIES.normal,
      
      // 재시도 로직
      retry: (failureCount, error: any) => {
        // 인증 오류나 권한 오류는 재시도하지 않음
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // 네트워크 오류는 최대 3번 재시도
        return failureCount < 3;
      },
      
      refetchOnMount: true, // 마운트 시 최신 데이터 확인
    },
    mutations: {
      retry: false, // Mutation은 재시도 안함 (중복 방지)
    },
  },
});


