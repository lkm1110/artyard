/**
 * 읽지 않은 메시지 관리 훅
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getTotalUnreadCount, 
  getUnreadMessagesCounts, 
  subscribeToUnreadMessages,
  markChatAsRead,
  type UnreadCount 
} from '../services/notificationService';
import { useAuthStore } from '../store/authStore';

/**
 * 총 읽지 않은 메시지 수 훅
 */
export const useUnreadCount = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState<number>(0);

  // 캐시 비활성화로 완전 실시간 업데이트
  const { data: count = 0, isLoading, error, refetch } = useQuery({
    queryKey: ['unreadCount', user?.id, Date.now()], // 캐시 무력화
    queryFn: () => {
      console.log('🔄 읽지 않은 메시지 수 새로 조회');
      return getTotalUnreadCount();
    },
    enabled: !!user,
    cacheTime: 0, // 캐시 완전 비활성화
    staleTime: 0, // 항상 stale로 처리
    refetchInterval: 2000, // 2초마다 강제 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: false, // 재시도 비활성화
  });

  // 실시간 구독 일시 비활성화 (디버깅용)
  useEffect(() => {
    if (!user) return;

    console.log('🔕 실시간 구독 비활성화됨 (디버깅 모드)');
    
    // 실시간 구독 대신 더 자주 폴링으로 대체
    // const subscription = subscribeToUnreadMessages(user.id, (newCount) => {
    //   console.log('📨 실시간 알림 업데이트:', newCount);
    //   setRealtimeCount(newCount);
    //   queryClient.setQueryData(['unreadCount'], newCount);
    // });

    // return () => {
    //   console.log('🔕 실시간 알림 구독 해제');
    //   subscription?.unsubscribe();
    // };
  }, [user, queryClient]);

  // 실시간 카운트 비활성화, React Query 결과만 사용
  const finalCount = count;

  return {
    count: finalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * 상세한 읽지 않은 메시지 목록 훅
 */
export const useUnreadMessages = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: unreadMessages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: getUnreadMessagesCounts,
    enabled: !!user,
    refetchInterval: 30000, // 30초마다 자동 새로고침
    staleTime: 10000, // 10초간 캐시 유지
  });

  // 실시간 업데이트
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToUnreadMessages(user.id, async () => {
      // 상세 목록도 새로고침
      const newUnreadMessages = await getUnreadMessagesCounts();
      queryClient.setQueryData(['unreadMessages'], newUnreadMessages);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, queryClient]);

  return {
    unreadMessages,
    isLoading,
    error,
    refetch,
  };
};

/**
 * 채팅방 읽음 처리 훅
 */
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const markAsRead = async (chatId: string) => {
    try {
      console.log('📖 채팅방 읽음 처리:', chatId);
      
      const success = await markChatAsRead(chatId);
      console.log('🔄 읽음 처리 결과:', success);
      
      // 즉시 강제 새로고침 (캐시 무시)
      console.log('🚀 즉시 강제 새로고침 시작...');
      
      // 1. 모든 관련 캐시 완전 제거
      queryClient.removeQueries({ queryKey: ['unreadCount'] });
      queryClient.removeQueries({ queryKey: ['unreadMessages'] });
      
      // 2. 직접 새로운 카운트 조회
      const newCount = await getTotalUnreadCount();
      console.log('🔢 새로 조회한 카운트:', newCount);
      
      // 3. 강제로 캐시에 새 값 설정
      queryClient.setQueryData(['unreadCount', user?.id], newCount);
      
      // 4. 한 번 더 확인 (1초 후)
      setTimeout(async () => {
        const verifyCount = await getTotalUnreadCount();
        console.log('🔍 1초 후 재확인 카운트:', verifyCount);
        
        // 5. 다시 한 번 강제 업데이트
        queryClient.setQueryData(['unreadCount', user?.id], verifyCount);
      }, 1000);
      
      console.log('✅ 읽음 처리 및 강제 새로고침 완료');
      return success;
      
    } catch (error) {
      console.error('❌ 채팅방 읽음 처리 실패:', error);
      return false;
    }
  };

  return {
    markAsRead,
  };
};
