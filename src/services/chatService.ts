/**
 * 채팅 관련 API 서비스
 * Supabase와 실제 연동되는 함수들
 */

import { supabase } from './supabase';
import type { Chat, Message, Profile } from '../types';

/**
 * 현재 사용자의 모든 채팅방 목록 가져오기
 */
export const getUserChats = async (): Promise<Chat[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log('채팅 목록 조회 시작:', user.id);

    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        id,
        a,
        b,
        created_at,
        messages (
          id,
          sender_id,
          body,
          created_at
        )
      `)
      .or(`a.eq.${user.id},b.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!chats || chats.length === 0) {
      console.log('채팅방이 없습니다.');
      return [];
    }

    // 각 채팅방의 상대방 정보와 마지막 메시지 가져오기
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.a === user.id ? chat.b : chat.a;
        
        // 상대방 프로필 정보 가져오기
        const { data: otherUserProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        // 마지막 메시지 가져오기 + body → content 변환
        const sortedMessages = chat.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMessage = sortedMessages && sortedMessages.length > 0
          ? {
              ...sortedMessages[0],
              content: sortedMessages[0].body, // body를 content로 매핑
            }
          : null;

        const chatWithDetails: Chat = {
          id: chat.id,
          a: chat.a,
          b: chat.b,
          created_at: chat.created_at,
          other_user: otherUserProfile,
          last_message: lastMessage,
        };

        return chatWithDetails;
      })
    );

    console.log('채팅 목록 조회 완료:', chatsWithDetails.length);
    return chatsWithDetails;

  } catch (error) {
    console.error('채팅 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 채팅방의 메시지들 가져오기
 */
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    console.log('채팅 메시지 조회 시작:', chatId);

    // 먼저 간단한 쿼리로 테스트 (body 컬럼 사용)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id, body, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('메시지 조회 에러 상세:', error);
      throw error;
    }

    console.log('채팅 메시지 조회 완료 (기본):', messages?.length || 0);

    // 메시지가 있으면 sender 정보를 별도로 가져오기
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, handle, school, avatar_url')
        .in('id', senderIds);

      // 메시지에 sender 정보 매핑 + body → content 변환
      const messagesWithSender = messages.map(message => ({
        ...message,
        content: message.body, // body 필드를 content로 매핑
        sender: profiles?.find(p => p.id === message.sender_id) || null
      }));

      console.log('sender 정보 매핑 완료:', messagesWithSender.length);
      return messagesWithSender as Message[];
    }

    return messages || [];

  } catch (error) {
    console.error('채팅 메시지 조회 실패:', error);
    
    // 에러가 발생해도 빈 배열 반환 (UI가 깨지지 않게)
    console.log('에러 발생으로 빈 메시지 배열 반환');
    return [];
  }
};

/**
 * 새 메시지 전송하기
 */
export const sendMessage = async (chatId: string, content: string): Promise<Message> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log('메시지 전송 시작:', { chatId, content: content.substring(0, 50) });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        body: content.trim(), // body 컬럼 사용
      })
      .select(`
        id,
        chat_id,
        sender_id,
        body,
        created_at,
        sender:profiles (
          id,
          handle,
          school,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    console.log('메시지 전송 완료:', message.id);
    
    // body → content 변환하여 반환
    const messageWithContent = {
      ...message,
      content: message.body, // body를 content로 매핑
    };
    
    return messageWithContent;

  } catch (error) {
    console.error('메시지 전송 실패:', error);
    throw error;
  }
};

/**
 * 새 채팅방 생성하기 (또는 기존 채팅방 찾기)
 */
export const createOrFindChat = async (otherUserId: string): Promise<Chat> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log('채팅방 생성/찾기 시작:', { userId: user.id, otherUserId });

    // 기존 채팅방 찾기
    const { data: existingChats, error: findError } = await supabase
      .from('chats')
      .select('*')
      .or(`and(a.eq.${user.id},b.eq.${otherUserId}),and(a.eq.${otherUserId},b.eq.${user.id})`);

    if (findError) throw findError;

    if (existingChats && existingChats.length > 0) {
      console.log('기존 채팅방 발견:', existingChats[0].id);
      
      // 상대방 프로필 정보 가져오기
      const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      return {
        id: existingChats[0].id,
        a: existingChats[0].a,
        b: existingChats[0].b,
        created_at: existingChats[0].created_at,
        other_user: otherUserProfile,
      };
    }

    // 새 채팅방 생성
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        a: user.id,
        b: otherUserId,
      })
      .select('*')
      .single();

    if (createError) throw createError;

    console.log('새 채팅방 생성 완료:', newChat.id);

    // 상대방 프로필 정보 가져오기
    const { data: otherUserProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single();

    return {
      id: newChat.id,
      a: newChat.a,
      b: newChat.b,
      created_at: newChat.created_at,
      other_user: otherUserProfile,
    };

  } catch (error) {
    console.error('채팅방 생성/찾기 실패:', error);
    throw error;
  }
};

/**
 * 채팅방 실시간 구독 (선택사항)
 * 새 메시지가 오면 콜백 함수 실행
 */
export const subscribeToChatMessages = (
  chatId: string,
  onNewMessage: (message: Message) => void
) => {
  console.log('채팅방 실시간 구독 시작:', chatId);

  const subscription = supabase
    .channel(`chat-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      async (payload) => {
        console.log('새 메시지 수신:', payload);
        
        // 메시지 전송자 정보도 함께 가져오기
        const { data: messageWithSender } = await supabase
          .from('messages')
          .select(`
            id,
            chat_id,
            sender_id,
            body,
            created_at,
            sender:profiles (
              id,
              handle,
              school,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (messageWithSender) {
          // body → content 매핑 추가
          const messageWithContent = {
            ...messageWithSender,
            content: messageWithSender.body,
          };
          onNewMessage(messageWithContent);
        }
      }
    )
    .subscribe();

  return subscription;
};

/**
 * 채팅방 실시간 구독 해제
 */
export const unsubscribeFromChat = (subscription: any) => {
  if (subscription) {
    console.log('채팅방 실시간 구독 해제');
    supabase.removeChannel(subscription);
  }
};
