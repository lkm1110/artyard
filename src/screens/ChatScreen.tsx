/**
 * Individual Chat Screen
 * Screen for sending and receiving actual messages
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { useChatMessages, useSendMessage } from '../hooks/useChats';
import { useMarkChatAsRead } from '../hooks/useUnreadMessages';
import { editMessage, deleteMessage } from '../services/chatService';
import { Message, Profile } from '../types';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CustomAlert } from '../components/CustomAlert';
import { useQueryClient } from '@tanstack/react-query';

interface ChatScreenProps {
  route: RouteProp<{ Chat: { chatId: string; otherUser: Profile } }>;
}

// Dummy message data
const getDummyMessages = (chatId: string): Message[] => [
  {
    id: 'msg-1',
    chat_id: chatId,
    sender_id: 'ac8c619b-95f5-4e0a-a047-e869cb5adc0a',
    content: 'Hi! Thanks for your interest in my "Digital Character Illustration" artwork! 😊',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
  },
  {
    id: 'msg-2',
    chat_id: chatId,
    sender_id: 'current-user',
    content: 'Hello! I love your work! Could you tell me more about your creative process?',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-3',
    chat_id: chatId,
    sender_id: 'ac8c619b-95f5-4e0a-a047-e869cb5adc0a',
    content: 'Thank you so much! I usually start with rough sketches and then move to digital painting in Photoshop. I\'m inspired by anime and video game character designs.',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-4',
    chat_id: chatId,
    sender_id: 'current-user',
    content: 'That\'s amazing! Is this piece available for purchase?',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-5',
    chat_id: chatId,
    sender_id: 'ac8c619b-95f5-4e0a-a047-e869cb5adc0a',
    content: 'Yes, it is! Since it\'s digital art, I can provide you with a high-resolution print file. Would you be interested in that?',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

export const ChatScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ Chat: { chatId: string; otherUser: Profile } }>>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { chatId, otherUser } = route.params;
  
  // 실제 API 훅 사용
  const { data: messages = [], isLoading: messagesLoading, isError: messagesError } = useChatMessages(chatId);
  const sendMessageMutation = useSendMessage();
  const { markAsRead } = useMarkChatAsRead();

  // 메시지 수정/삭제 관련 상태
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [newMessage, setNewMessage] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 메시지와 실시간 메시지 합치기
  const allMessages = [...messages, ...realtimeMessages.filter(
    rm => !messages.some(m => m.id === rm.id)
  )].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => {
    // 메시지가 로드되면 맨 아래로 스크롤
    if (allMessages.length > 0 && !messagesLoading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [allMessages.length, messagesLoading]);

  // 🔥 실시간 채팅 구독
  useEffect(() => {
    if (!chatId) return;

    console.log('🔴 Starting realtime subscription for chat:', chatId);

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('🆕 New message received:', payload.new);
          const newMsg = payload.new as Message;
          
          setRealtimeMessages((prev) => {
            // 중복 방지
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // 자동 스크롤
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // 상대방 메시지면 읽음 처리
          if (newMsg.sender_id !== user?.id) {
            markAsRead(chatId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('✏️ Message updated:', payload.new);
          setRealtimeMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('🗑️ Message deleted:', payload.old);
          setRealtimeMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setIsTyping(payload.isTyping);
          
          // 2초 후 자동 해제
          if (payload.isTyping) {
            setTimeout(() => setIsTyping(false), 2000);
          }
        }
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔴 Unsubscribing from chat:', chatId);
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.id]); // markAsRead는 dependency에서 제외 (무한 루프 방지)

  // 채팅방 입장 시 자동 읽음 처리
  useEffect(() => {
    if (chatId && user) {
      console.log('📖 채팅방 입장 - 자동 읽음 처리:', chatId);
      markAsRead(chatId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.id]); // markAsRead는 dependency에서 제외 (무한 루프 방지)

  // 타이핑 브로드캐스트 (타이머 관리 포함)
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping },
      });
    }

    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // 타이핑 시작 시 2초 후 자동 종료 타이머 설정
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user?.id, isTyping: false },
          });
        }
      }, 2000);
    }
  }, [user?.id]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || sendMessageMutation.isPending) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        content: messageText,
      });
      
      console.log('메시지 전송 성공:', messageText);
      
      // 자동으로 맨 아래로 스크롤
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      
      setAlertTitle('Error');
      setAlertMessage('Failed to send message. Please try again.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  }, [newMessage, user, chatId, sendMessageMutation]);

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // 메시지 수정/삭제 처리 함수들
  const handleMessageLongPress = (message: Message) => {
    console.log('🔍 메시지 길게 누르기:', {
      messageId: message.id,
      senderId: message.sender_id,
      currentUserId: user?.id,
      isDeleted: message.is_deleted,
      canEdit: message.sender_id === user?.id && !message.is_deleted
    });

    if (message.sender_id !== user?.id || message.is_deleted) {
      console.log('❌ 수정/삭제 권한 없음');
      return;
    }

    console.log('✅ Message options displayed');
    setAlertTitle('Message Options');
    setAlertMessage(`"${message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content}"`);
    setAlertButtons([
      {
        text: 'Edit',
        style: 'default',
        onPress: () => {
          console.log('📝 Edit mode started:', message.id);
          setEditingMessageId(message.id);
          setEditingText(message.content);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('🗑️ Delete started:', message.id);
          handleDeleteMessage(message.id);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
    setAlertVisible(true);
  };

  // 웹 환경을 위한 더블클릭 핸들러 추가
  const handleMessageDoubleClick = (message: Message) => {
    console.log('🔍 메시지 더블클릭 (웹 호환)');
    handleMessageLongPress(message);
  };

  // 웹 환경 디버깅 정보 표시
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('💻 웹 환경에서 채팅 실행 중');
      console.log('📋 사용 가능한 메시지 옵션:');
      console.log('  1️⃣ 내 메시지 옆 ⋯ 버튼 클릭');
      console.log('  2️⃣ 내 메시지 우클릭');
      console.log('  3️⃣ 내 메시지 길게 누르기 (0.5초)');
    }
  }, []);

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    try {
      await editMessage(editingMessageId, editingText.trim());
      setEditingMessageId(null);
      setEditingText('');
      
      // 채팅 메시지 목록 강제 새로고침
      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      console.log('✅ Message edited, cache invalidated');
    } catch (error: any) {
      setAlertTitle('Error');
      setAlertMessage(error.message || 'Failed to edit message.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId, 'Deleted by user');
      
      // 채팅 메시지 목록 강제 새로고침
      await queryClient.refetchQueries({ queryKey: ['chatMessages', chatId] });
      await queryClient.refetchQueries({ queryKey: ['chats'] });
      console.log('✅ Message deleted, UI refreshed');
    } catch (error: any) {
      setAlertTitle('Error');
      setAlertMessage(error.message || 'Failed to delete message.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Chat Options 핸들러
  const handleDeleteChat = useCallback(async () => {
    setAlertTitle('Delete Chat');
    setAlertMessage('Are you sure you want to delete this conversation?\n\nThis action cannot be undone.');
    setAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          console.log('🗑️ Deleting chat:', chatId);
          try {
            // Delete all messages in the chat
            await supabase
              .from('messages')
              .delete()
              .eq('chat_id', chatId);
            
            // Delete the chat itself
            await supabase
              .from('chats')
              .delete()
              .eq('id', chatId);
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            
            setAlertTitle('Success');
            setAlertMessage('Chat deleted successfully');
            setAlertButtons([{ 
              text: 'OK', 
              style: 'default',
              onPress: () => navigation.goBack()
            }]);
            setAlertVisible(true);
          } catch (error) {
            console.error('❌ Failed to delete chat:', error);
            setAlertTitle('Error');
            setAlertMessage('Failed to delete chat. Please try again.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          }
        },
      },
    ]);
    setAlertVisible(true);
  }, [chatId, navigation, queryClient]);

  const handleReportUser = useCallback(() => {
    console.log('⚠️ Report user:', otherUser?.id);
    setAlertTitle('Report User');
    setAlertMessage('Please provide a reason for reporting this user.');
    setAlertButtons([
      { 
        text: 'Spam', 
        style: 'default',
        onPress: async () => {
          console.log('📝 Reported as spam');
          try {
            await supabase.from('reports').insert({
              reporter_id: user?.id,
              reported_id: otherUser?.id,
              reason: 'spam',
              context: 'chat',
              created_at: new Date().toISOString(),
            });
            setAlertTitle('Report Submitted');
            setAlertMessage('Thank you for your report. We will review it shortly.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          } catch (error) {
            console.error('❌ Failed to submit report:', error);
            setAlertTitle('Error');
            setAlertMessage('Failed to submit report. Please try again.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          }
        }
      },
      { 
        text: 'Inappropriate Content', 
        style: 'default',
        onPress: async () => {
          console.log('📝 Reported as inappropriate');
          try {
            await supabase.from('reports').insert({
              reporter_id: user?.id,
              reported_id: otherUser?.id,
              reason: 'inappropriate_content',
              context: 'chat',
              created_at: new Date().toISOString(),
            });
            setAlertTitle('Report Submitted');
            setAlertMessage('Thank you for your report. We will review it shortly.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          } catch (error) {
            console.error('❌ Failed to submit report:', error);
            setAlertTitle('Error');
            setAlertMessage('Failed to submit report. Please try again.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          }
        }
      },
      { 
        text: 'Other', 
        style: 'default',
        onPress: async () => {
          console.log('📝 Reported as other');
          try {
            await supabase.from('reports').insert({
              reporter_id: user?.id,
              reported_id: otherUser?.id,
              reason: 'other',
              context: 'chat',
              created_at: new Date().toISOString(),
            });
            setAlertTitle('Report Submitted');
            setAlertMessage('Thank you for your report. We will review it shortly.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          } catch (error) {
            console.error('❌ Failed to submit report:', error);
            setAlertTitle('Error');
            setAlertMessage('Failed to submit report. Please try again.');
            setAlertButtons([{ text: 'OK', style: 'default' }]);
            setAlertVisible(true);
          }
        }
      },
      { 
        text: 'Cancel', 
        style: 'cancel'
      },
    ]);
    setAlertVisible(true);
  }, [otherUser, user]);

  const handleChatOptions = useCallback(() => {
    setAlertTitle('Chat Options');
    setAlertMessage(`Options for conversation with ${otherUser?.handle || 'this user'}`);
    setAlertButtons([
      { 
        text: 'View Profile', 
        style: 'default',
        onPress: () => {
          console.log('✅ Navigating to user profile:', otherUser?.id);
          if (otherUser?.id) {
            navigation.navigate('UserArtworks' as any, { userId: otherUser.id });
          }
        }
      },
      { 
        text: 'Delete Chat', 
        style: 'destructive', 
        onPress: () => {
          // 현재 Alert를 닫고, 약간의 delay 후에 Delete Chat Alert 표시
          setAlertVisible(false);
          setTimeout(() => {
            handleDeleteChat();
          }, 300);
        }
      },
      { 
        text: 'Report User', 
        style: 'destructive', 
        onPress: () => {
          // 현재 Alert를 닫고, 약간의 delay 후에 Report User Alert 표시
          setAlertVisible(false);
          setTimeout(() => {
            handleReportUser();
          }, 300);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
    setAlertVisible(true);
  }, [otherUser, navigation, handleDeleteChat, handleReportUser]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFromMe = item.sender_id === user?.id || item.sender_id === 'current-user';
    const showAvatar = !isFromMe;
    const showTime = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1]?.created_at || 0).getTime() > 5 * 60 * 1000; // 5분 차이

    // 삭제된 메시지 처리
    if (item.is_deleted) {
      return (
        <View style={[
          styles.messageContainer,
          isFromMe ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          {/* 삭제된 메시지도 동일한 구조 */}
          <View style={[
            styles.messageRow,
            isFromMe ? styles.myMessageRow : styles.otherMessageRow
          ]}>
            
            {/* 상대방 아바타 (좌측) */}
            {!isFromMe && showAvatar && (
              <Image
                source={{ 
                  uri: otherUser?.avatar_url || 'https://picsum.photos/30/30?random=40' 
                }}
                style={[styles.messageAvatar, { opacity: 0.5 }]}
              />
            )}
            
            {/* 삭제된 메시지 버블 */}
            <View style={[
              styles.messageBubble,
              isFromMe ? styles.myMessageBubble : styles.otherMessageBubble,
              {
                backgroundColor: isDark ? colors.darkBorder : '#f0f0f0',
                opacity: 0.7,
              }
            ]}>
              <Text style={[
                styles.messageText,
                { 
                  color: isDark ? colors.darkTextMuted : colors.textMuted,
                  fontStyle: 'italic'
                }
              ]}>
                🗑️ This message was deleted
              </Text>
              
              {showTime && (
                <Text style={[
                  styles.messageTime,
                  {
                    color: isDark ? colors.darkTextMuted : colors.textMuted,
                    alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                  }
                ]}>
                  {formatMessageTime(item.created_at)}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isFromMe ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
        onLongPress={() => handleMessageLongPress(item)}
        // 웹에서 우클릭 지원
        {...(Platform.OS === 'web' && {
          onContextMenu: (e: any) => {
            e.preventDefault();
            console.log('🖱️ 우클릭으로 메시지 옵션 호출');
            handleMessageLongPress(item);
          }
        })}
        activeOpacity={0.8}
        delayLongPress={500} // 길게 누르기 시간 단축
      >
        {/* 메시지 행 - 상대방 메시지는 좌측, 내 메시지는 우측 */}
        <View style={[
          styles.messageRow,
          isFromMe ? styles.myMessageRow : styles.otherMessageRow
        ]}>
          
          {/* 상대방 아바타 (좌측) */}
          {!isFromMe && showAvatar && (
            <Image
              source={{ 
                uri: otherUser?.avatar_url || 'https://picsum.photos/30/30?random=40' 
              }}
              style={styles.messageAvatar}
            />
          )}
          
          {/* 메시지 버블 */}
          <View style={[
            styles.messageBubble,
            isFromMe ? styles.myMessageBubble : styles.otherMessageBubble,
            {
              backgroundColor: isFromMe 
                ? colors.primary 
                : (isDark ? colors.darkCard : colors.card),
            }
          ]}>
            <Text style={[
              styles.messageText,
              { 
                color: isFromMe 
                  ? '#FFFFFF' 
                  : (isDark ? colors.darkText : colors.text)
              }
            ]}>
              {item.content}
            </Text>
            
            {/* 수정된 메시지 표시 */}
            {item.is_edited && (
              <Text style={[
                styles.editedLabel,
                { 
                  color: isFromMe ? 'rgba(255,255,255,0.6)' : 
                    (isDark ? colors.darkTextMuted : colors.textMuted)
                }
              ]}>
                edited
              </Text>
            )}
            
            {/* 시간 표시 */}
            {showTime && (
              <Text style={[
                styles.messageTime,
                {
                  color: isFromMe 
                    ? 'rgba(255, 255, 255, 0.7)' 
                    : (isDark ? colors.darkTextMuted : colors.textMuted),
                  alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                }
              ]}>
                {formatMessageTime(item.created_at)}
                {item.is_edited && ` • Edited`}
              </Text>
            )}
          </View>
          
          {/* 내 메시지 옵션 버튼 (우측) */}
          {isFromMe && !item.is_deleted && (
            <TouchableOpacity
              style={styles.messageOptionsButton}
              onPress={() => {
                console.log('🔘 옵션 버튼 클릭 (웹 호환)');
                handleMessageLongPress(item);
              }}
              // 웹 호환성 향상
              {...(Platform.OS === 'web' && {
                style: {
                  cursor: 'pointer'
                }
              })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.messageOptionsIcon,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                ⋯
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 로딩 상태 처리
  if (messagesLoading && messages.length === 0) {
    return (
      <Screen style={styles.container}>
        <LoadingSpinner message="Loading messages..." />
      </Screen>
    );
  }

  // 에러 상태 처리
  if (messagesError) {
    return (
      <Screen style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Failed to load messages
          </Text>
          <Text style={[styles.errorText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            This might be because this is a new chat or there's no data in the database yet.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
              ←
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => {
              // TODO: 사용자 프로필 보기
              console.log('사용자 프로필 보기:', otherUser?.handle || 'Unknown User');
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ 
                uri: otherUser?.avatar_url || 'https://picsum.photos/40/40?random=50' 
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={[
                styles.userName,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                {otherUser?.handle || 'Unknown User'}
                {otherUser?.is_verified_school && (
                  <Text style={styles.verifiedIcon}> ✓</Text>
                )}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleChatOptions}
            activeOpacity={0.7}
          >
            <Text style={[styles.moreIcon, { color: isDark ? colors.darkText : colors.text }]}>
              ⋯
            </Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // 새 메시지가 추가되면 자동으로 스크롤
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={[
            styles.typingIndicator,
            { backgroundColor: isDark ? colors.darkCard : colors.card }
          ]}>
            <Text style={[
              styles.typingText,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              {otherUser.handle} is typing...
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.bg,
            borderTopColor: isDark ? colors.darkCard : colors.card,
          }
        ]}>
          {/* 수정 모드 헤더 */}
          {editingMessageId && (
            <View style={[
              styles.editModeHeader,
              { backgroundColor: isDark ? colors.darkBorder : '#f0f0f0' }
            ]}>
              <Text style={[
                styles.editModeText,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                ✏️ Editing Message
              </Text>
              <TouchableOpacity onPress={cancelEdit}>
                <Text style={[
                  styles.cancelEditText,
                  { color: colors.primary }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={[
            styles.inputWrapper,
            { backgroundColor: isDark ? colors.darkBg : colors.card }
          ]}>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: isDark ? colors.darkText : colors.text,
                  maxHeight: 100,
                }
              ]}
              placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={editingMessageId ? editingText : newMessage}
              onChangeText={(text) => {
                if (editingMessageId) {
                  setEditingText(text);
                } else {
                  setNewMessage(text);
                  // 타이핑 브로드캐스트
                  if (text.length > 0) {
                    broadcastTyping(true);
                  } else {
                    broadcastTyping(false);
                  }
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onBlur={() => broadcastTyping(false)}
              multiline
              textAlignVertical="center"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: (editingMessageId ? editingText.trim() : newMessage.trim()) && !sendMessageMutation.isPending 
                    ? colors.primary 
                    : colors.textMuted,
                }
              ]}
              onPress={editingMessageId ? handleEditMessage : handleSendMessage}
              disabled={!(editingMessageId ? editingText.trim() : newMessage.trim()) || sendMessageMutation.isPending}
              activeOpacity={0.8}
            >
              {sendMessageMutation.isPending ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendIcon}>
                  {editingMessageId ? '✓' : '→'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  verifiedIcon: {
    color: colors.accent,
    fontSize: 14,
  },
  userSchool: {
    ...typography.caption,
    fontSize: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  myMessageContainer: {
    alignItems: 'flex-end', // 우측 정렬
    paddingLeft: spacing.xl * 2, // 더 넓은 여백
  },
  otherMessageContainer: {
    alignItems: 'flex-start', // 좌측 정렬
    paddingRight: spacing.xl * 2, // 더 넓은 여백
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.sm,
  },
  // 메시지 행 스타일
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  
  // 메시지 버블 공통 스타일
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    minHeight: 40,
    flex: 1,
    maxWidth: 250, // 최대 너비 제한으로 텍스트 잘림 방지
  },
  myMessageBubble: {
    marginLeft: spacing.sm, // 옵션 버튼과의 간격
  },
  otherMessageBubble: {
    marginRight: spacing.sm,
  },
  messageText: {
    ...typography.body,
    lineHeight: 20,
  },
  messageTime: {
    ...typography.small,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...typography.body,
    fontWeight: '600',
  },
  // 수정 모드 스타일
  editModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editModeText: {
    ...typography.body,
    fontWeight: '600',
  },
  cancelEditText: {
    ...typography.body,
    fontWeight: '600',
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  typingIndicator: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  typingText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  // 메시지 콘텐츠 래퍼 스타일
  messageContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%', // 메시지 최대 너비 제한
    alignSelf: 'flex-end', // 기본적으로 우측 정렬 (내 메시지용)
  },
  messageOptionsButton: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  messageOptionsIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
