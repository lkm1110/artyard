/**
 * 채팅 관련 React Query 훅들
 * 실제 Supabase API와 연동
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserChats,
  getChatMessages,
  sendMessage,
  createOrFindChat,
  editMessage,
  deleteMessage,
} from '../services/chatService';
import type { Chat, Message } from '../types';

/**
 * 사용자의 채팅 목록 가져오기
 */
export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: getUserChats,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 특정 채팅방의 메시지들 가져오기
 */
export const useChatMessages = (chatId: string) => {
  return useQuery({
    queryKey: ['chat', chatId, 'messages'],
    queryFn: () => getChatMessages(chatId),
    enabled: !!chatId,
    staleTime: 10 * 1000, // 10초간 fresh 상태 유지
    gcTime: 2 * 60 * 1000, // 2분간 캐시 유지
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 메시지 전송하기
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      sendMessage(chatId, content),
    onMutate: async ({ chatId, content }) => {
      // Optimistic Update를 위해 이전 데이터 백업
      await queryClient.cancelQueries({ queryKey: ['chat', chatId, 'messages'] });
      
      const previousMessages = queryClient.getQueryData<Message[]>(['chat', chatId, 'messages']);
      
      // 임시 메시지 생성 (Optimistic Update)
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        sender_id: 'current-user', // 임시 ID
        content,
        created_at: new Date().toISOString(),
      };

      // UI에 임시 메시지 즉시 추가
      queryClient.setQueryData<Message[]>(
        ['chat', chatId, 'messages'],
        (old = []) => [...old, tempMessage]
      );

      return { previousMessages, tempMessage };
    },
    onSuccess: (newMessage, { chatId }) => {
      console.log('✅ 메시지 전송 성공:', newMessage.id);
      
      // 성공시 임시 메시지를 실제 메시지로 교체
      queryClient.setQueryData<Message[]>(
        ['chat', chatId, 'messages'],
        (old = []) => {
          // 임시 메시지 제거하고 실제 메시지 추가
          const withoutTemp = old.filter(msg => !msg.id.startsWith('temp-'));
          return [...withoutTemp, newMessage];
        }
      );

      // 채팅 목록도 부드럽게 업데이트 (에러 방지)
      try {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      } catch (error) {
        console.warn('채팅 목록 업데이트 실패 (무시):', error);
      }
    },
    onError: (error, { chatId }, context) => {
      console.error('메시지 전송 실패:', error);
      
      // 실패시 이전 상태로 롤백
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', chatId, 'messages'], context.previousMessages);
      }
    },
  });
};

/**
 * 새 채팅방 생성하기 (또는 기존 채팅방 찾기)
 */
export const useCreateOrFindChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrFindChat,
    onSuccess: (chat) => {
      console.log('채팅방 생성/찾기 성공:', chat.id);
      
      // 채팅 목록 캐시 업데이트
      queryClient.setQueryData<Chat[]>(['chats'], (old = []) => {
        const exists = old.some(existingChat => existingChat.id === chat.id);
        if (!exists) {
          return [chat, ...old];
        }
        return old;
      });
    },
    onError: (error) => {
      console.error('채팅방 생성/찾기 실패:', error);
    },
  });
};

/**
 * 채팅 목록 수동 새로고침
 */
export const useRefreshChats = () => {
  const queryClient = useQueryClient();

  return () => {
    console.log('채팅 목록 수동 새로고침');
    return queryClient.invalidateQueries({ queryKey: ['chats'] });
  };
};

/**
 * 채팅 메시지 수동 새로고침
 */
export const useRefreshChatMessages = () => {
  const queryClient = useQueryClient();

  return (chatId: string) => {
    console.log('채팅 메시지 수동 새로고침:', chatId);
    return queryClient.invalidateQueries({ queryKey: ['chat', chatId, 'messages'] });
  };
};

/**
 * 메시지 수정하기
 */
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, newContent }: { messageId: string; newContent: string }) => 
      editMessage(messageId, newContent),
    onSuccess: () => {
      console.log('메시지 수정 성공');
      // 모든 채팅 메시지 캐시를 무효화하여 실시간으로 업데이트
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error) => {
      console.error('메시지 수정 실패:', error);
    },
  });
};

/**
 * 메시지 삭제하기
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, reason }: { messageId: string; reason?: string }) => 
      deleteMessage(messageId, reason),
    onSuccess: () => {
      console.log('메시지 삭제 성공');
      // 모든 채팅 메시지 캐시를 무효화하여 실시간으로 업데이트
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error) => {
      console.error('메시지 삭제 실패:', error);
    },
  });
};
