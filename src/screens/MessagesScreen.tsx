/**
 * 채팅 목록 화면 (Messages 탭) - 실제 데이터만 사용
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
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

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  // 실제 채팅 데이터 조회
  const { data: chats = [], isLoading, isError } = useChats();
  const refreshChats = useRefreshChats();

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
        { borderBottomColor: isDark ? colors.darkBorder : colors.border }
      ]}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          Messages
        </Text>
        {chats.length > 0 && (
          <Text style={[
            styles.chatCount,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            {chats.length} chat{chats.length === 1 ? '' : 's'}
          </Text>
        )}
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
            onRefresh={() => refreshChats.mutate()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: 'bold',
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