/**
 * Unread messages management hooks
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
 * Total unread message count hook
 */
export const useUnreadCount = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState<number>(0);

  // Optimized cache settings for performance
  const { data: count = 0, isLoading, error, refetch } = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: getTotalUnreadCount,
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 300000, // Background cache for 5 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: true, // Only refetch on mount
    refetchOnReconnect: false, // Disable refetch on network reconnect
  });

  // Enable realtime subscription
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToUnreadMessages(user.id, (newCount) => {
      setRealtimeCount(newCount);
      queryClient.setQueryData(['unreadCount', user.id], newCount);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, queryClient]);

  // Use more recent value between realtime count and query result
  const finalCount = realtimeCount > 0 ? realtimeCount : count;

  return {
    count: finalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Detailed unread messages list hook
 */
export const useUnreadMessages = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: unreadMessages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: getUnreadMessagesCounts,
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
    cacheTime: 300000, // Background cache for 5 minutes  
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });

  // Realtime updates
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToUnreadMessages(user.id, async () => {
      // Refresh detailed list as well
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
 * Chat room mark as read hook
 */
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const markAsRead = async (chatId: string) => {
    try {
      const success = await markChatAsRead(chatId);
      
      if (success) {
        // 강력한 캐시 무효화 - 모든 관련 쿼리 즉시 새로고침
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['unreadCount'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['unreadMessages'], refetchType: 'all' }),
          queryClient.refetchQueries({ queryKey: ['unreadCount', user?.id], type: 'all' }),
        ]);

        // 즉시 카운트를 0으로 설정 (optimistic update)
        queryClient.setQueryData(['unreadCount', user?.id], 0);
        
        console.log('✅ Chat read status updated and cache invalidated');
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ Chat mark as read failed:', error);
      return false;
    }
  };

  return {
    markAsRead,
  };
};
