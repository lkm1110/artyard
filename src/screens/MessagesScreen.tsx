/**
 * 채팅 목록 화면 (Messages 탭) - 실시간 업데이트
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  AppState,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useChats, useRefreshChats } from '../hooks/useChats';
import { Chat } from '../types';
import { supabase } from '../services/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleLocalNotification } from '../services/pushNotificationService';
import { Toast } from '../components/Toast';

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);
  const previousChatIds = useRef<Set<string>>(new Set());

  // Toast 상태 (앱이 active일 때 새 메시지 알림)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState<{
    senderName: string;
    message: string;
    chatId: string;
  } | null>(null);

  // 실제 채팅 데이터 조회
  const { data: chats = [], isLoading, isError } = useChats();
  const refreshChats = useRefreshChats();

  // 초기 채팅 ID 목록 저장
  useEffect(() => {
    if (chats.length > 0 && previousChatIds.current.size === 0) {
      previousChatIds.current = new Set(chats.map(c => c.id));
    }
  }, [chats]);

  // AppState 감지 (포그라운드/백그라운드 전환)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      console.log('📱 App state changed to:', nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 🔥 실시간 채팅 목록 업데이트 + 신규 메시지 알림
  useEffect(() => {
    if (!user) return;

    console.log('🔴 Starting realtime subscription for all chats');

    const channel = supabase
      .channel('all-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('💬 New message received:', payload);
          
          const newMessage = payload.new as any;
          
          // 자신이 보낸 메시지는 알림 안 띄움
          if (newMessage.sender_id === user.id) {
            console.log('⏭️ Skipping notification for own message');
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            return;
          }

          // 발신자 정보 가져오기
          const { data: sender } = await supabase
            .from('profiles')
            .select('handle')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = sender?.handle || 'Someone';
          const messagePreview = newMessage.content.length > 50 
            ? newMessage.content.substring(0, 50) + '...'
            : newMessage.content;

          // 앱이 백그라운드일 때는 푸시 알림
          if (appState.current !== 'active') {
            console.log('🔔 Showing push notification for new message');
            
            await scheduleLocalNotification(
              `New message from ${senderName}`,
              messagePreview,
              {
                type: 'message',
                chatId: newMessage.chat_id,
                senderId: newMessage.sender_id,
              }
            );
          } else {
            // 앱이 active일 때는 Toast 표시
            console.log('🍞 Showing toast for new message');
            setToastData({
              senderName,
              message: messagePreview,
              chatId: newMessage.chat_id,
            });
            setToastVisible(true);
          }
          
          // 채팅 목록 새로고침
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
        },
        async (payload) => {
          console.log('🆕 New chat created:', payload);
          
          const newChat = payload.new as any;
          
          // 새 채팅방 알림 (자신이 만든 것이 아닐 경우에만)
          const isNewChat = !previousChatIds.current.has(newChat.id);
          const isNotMine = newChat.a !== user.id;
          
          if (isNewChat && isNotMine && appState.current !== 'active') {
            console.log('🔔 Showing notification for new chat');
            
            // 상대방 정보 가져오기
            const otherUserId = newChat.a === user.id ? newChat.b : newChat.a;
            const { data: otherUser } = await supabase
              .from('profiles')
              .select('handle')
              .eq('id', otherUserId)
              .single();

            const otherUserName = otherUser?.handle || 'Someone';

            await scheduleLocalNotification(
              'New Chat',
              `${otherUserName} started a conversation with you`,
              {
                type: 'message',
                chatId: newChat.id,
                senderId: otherUserId,
              }
            );
          }

          // 채팅 목록 새로고침
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Chat list subscription status:', status);
      });

    return () => {
      console.log('🔴 Unsubscribing from chat list');
      channel.unsubscribe();
    };
  }, [user, queryClient]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleChatPress = useCallback((chat: Chat) => {
    console.log('Navigate to chat:', chat.id);
    console.log('Other user info:', chat.other_user);
    navigation.navigate('Chat' as any, { 
      chatId: chat.id,
      otherUser: chat.other_user 
    });
  }, [navigation]);

  const renderEmptyState = () => (
    <EmptyState
      title="No messages yet"
      description="Start a conversation by contacting an artist from their artwork page!"
    />
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        { 
          backgroundColor: isDark ? colors.darkCard : colors.card,
          borderBottomColor: isDark ? colors.darkBorder : colors.border,
        }
      ]}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ 
          uri: item.other_user?.avatar_url || 'https://picsum.photos/50/50?random=default' 
        }}
        style={styles.avatar}
      />
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.userName, 
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              {item.other_user?.handle || 'Unknown User'}
            </Text>
            {item.other_user?.is_verified_school && (
              <Text style={styles.verifiedIcon}> ✓</Text>
            )}
          </View>
          <Text style={[
            styles.timestamp,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            {item.last_message ? formatTime(item.last_message.created_at) : ''}
          </Text>
        </View>


        {item.last_message ? (
          <Text style={[
            styles.lastMessage,
            { color: isDark ? colors.darkTextSecondary : colors.textSecondary }
          ]}>
            {truncateMessage(item.last_message.content)}
          </Text>
        ) : (
          <Text style={[
            styles.noMessages,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            No messages yet
          </Text>
        )}
      </View>

      <View style={styles.chevron}>
        <Text style={[
          styles.chevronIcon,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          ›
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <LoadingSpinner message="Loading chats..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.container}>
        <EmptyState
          title="Unable to load chats"
          description="Please check your connection and try again."
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={[
        styles.header,
        { 
          backgroundColor: isDark ? colors.darkCard : colors.card,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          Messages
        </Text>
        <View style={styles.headerSpacer}>
          {chats.length > 0 && (
            <Text style={[
              styles.chatCount,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              {chats.length}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshChats}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Toast for new messages when app is active */}
      <Toast
        visible={toastVisible}
        message={toastData?.senderName || ''}
        subtitle={toastData?.message || ''}
        onPress={() => {
          if (toastData?.chatId) {
            // Find the chat to get the other_user info
            const chat = chats.find(c => c.id === toastData.chatId);
            if (chat) {
              navigation.navigate('Chat' as any, {
                chatId: toastData.chatId,
                otherUser: chat.other_user,
              });
            }
          }
        }}
        onHide={() => setToastVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    // backgroundColor와 borderBottomColor는 동적으로 설정됨
    zIndex: 1000,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40, // backButton과 동일한 너비로 중앙 정렬
    alignItems: 'flex-end',
  },
  chatCount: {
    ...typography.caption,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    ...typography.h4,
    fontWeight: '600',
  },
  verifiedIcon: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: spacing.xs / 2,
  },
  timestamp: {
    ...typography.caption,
    fontSize: 12,
  },
  lastMessage: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 18,
  },
  noMessages: {
    ...typography.body,
    fontSize: 14,
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  chevronIcon: {
    ...typography.h3,
    fontWeight: '300',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});