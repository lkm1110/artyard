/**
 * 개별 채팅 화면
 * 실제 메시지를 주고받는 화면
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
import { Message, Profile } from '../types';

interface ChatScreenProps {
  route: RouteProp<{ Chat: { chatId: string; otherUser: Profile } }>;
}

// 더미 메시지 데이터
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
  
  const { chatId, otherUser } = route.params;
  
  // 실제 API 훅 사용
  const { data: messages = [], isLoading: messagesLoading, isError: messagesError } = useChatMessages(chatId);
  const sendMessageMutation = useSendMessage();
  
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 메시지가 로드되면 맨 아래로 스크롤
    if (messages.length > 0 && !messagesLoading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length, messagesLoading]);

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
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFromMe = item.sender_id === user?.id || item.sender_id === 'current-user';
    const showAvatar = !isFromMe;
    const showTime = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1]?.created_at || 0).getTime() > 5 * 60 * 1000; // 5분 차이

    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {showAvatar && !isFromMe && (
          <Image
            source={{ 
              uri: otherUser.avatar_url || 'https://picsum.photos/30/30?random=40' 
            }}
            style={styles.messageAvatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isFromMe 
              ? colors.primary 
              : (isDark ? colors.darkCard : colors.card),
            marginLeft: showAvatar ? 0 : 38,
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
            </Text>
          )}
        </View>
      </View>
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
              console.log('사용자 프로필 보기:', otherUser.handle);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ 
                uri: otherUser.avatar_url || 'https://picsum.photos/40/40?random=50' 
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={[
                styles.userName,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                {otherUser.handle}
                {otherUser.is_verified_school && (
                  <Text style={styles.verifiedIcon}> ✓</Text>
                )}
              </Text>
              <Text style={[
                styles.userSchool,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                {otherUser.school}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Chat Options',
                `Options for conversation with ${otherUser.handle}`,
                [
                  { text: 'View Profile', onPress: () => console.log('View profile') },
                  { text: 'Report User', style: 'destructive', onPress: () => console.log('Report user') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
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
          data={messages}
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

        {/* Message Input */}
        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.bg,
            borderTopColor: isDark ? colors.darkCard : colors.card,
          }
        ]}>
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
              placeholder="Type a message..."
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              textAlignVertical="center"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: newMessage.trim() && !sendMessageMutation.isPending ? colors.primary : colors.textMuted,
                }
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              activeOpacity={0.8}
            >
              {sendMessageMutation.isPending ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendIcon}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
    paddingLeft: spacing.xl * 2, // 더 넓은 여백
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
    paddingRight: spacing.xl * 2, // 더 넓은 여백
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    minHeight: 40, // 최소 높이 보장
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
});
