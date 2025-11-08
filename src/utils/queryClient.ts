/**
 * React Query 클라이언트 설정
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 - 데이터 신선도
      gcTime: 1000 * 60 * 30, // 30분 - 캐시 유지 (이전 cacheTime)
      retry: (failureCount, error: any) => {
        // 인증 오류나 권한 오류는 재시도하지 않음
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // 네트워크 오류는 최대 3번 재시도
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // 모바일에서 불필요
      refetchOnMount: true, // 마운트 시 최신 데이터 확인
      refetchOnReconnect: true, // 네트워크 재연결 시 갱신
    },
    mutations: {
      retry: false, // Mutation은 재시도 안함 (중복 방지)
    },
  },
});


