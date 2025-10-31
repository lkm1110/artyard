/**
 * Push Notification Handler Component
 * 푸시 알림 수신 및 처리
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { setupNotificationListeners, clearBadgeCount } from '../services/pushNotificationService';
import { useAuthStore } from '../store/authStore';

// Expo Go 환경 체크
const isExpoGo = Constants.appOwnership === 'expo';

export const PushNotificationHandler: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Expo Go 환경 체크 (SDK 53+에서 푸시 알림 미지원)
    if (isExpoGo) {
      console.log('⚠️ Notification listeners not available in Expo Go');
      return;
    }

    // 웹 환경에서는 푸시 알림 핸들러 설정하지 않음
    if (Platform.OS === 'web') {
      console.log('🌐 Push notification handler skipped on web');
      return;
    }

    if (!user) return;

    console.log('🔔 Setting up push notification handlers...');

    // 알림 수신 핸들러
    const handleNotification = (notification: Notifications.Notification) => {
      console.log('🔔 Notification received (foreground):', notification);
      
      const data = notification.request.content.data;
      console.log('📦 Notification data:', data);

      // 앱이 foreground일 때는 배지 업데이트만
      // (실제 알림은 시스템이 자동으로 표시)
    };

    // 알림 클릭 핸들러
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // 배지 카운트 초기화
      clearBadgeCount();

      // 알림 타입에 따라 화면 이동
      try {
        switch (data.type) {
          case 'like':
          case 'comment':
            if (data.artworkId) {
              navigation.navigate('ArtworkDetail' as never, {
                artworkId: data.artworkId,
              } as never);
            }
            break;

          case 'follow':
            if (data.userId) {
              navigation.navigate('UserArtworks' as never, {
                userId: data.userId,
              } as never);
            }
            break;

          case 'message':
            if (data.chatId) {
              // 채팅 화면으로 이동 (otherUser 정보 필요)
              // TODO: 채팅 목록에서 chatId로 otherUser 정보 가져오기
              console.log('Navigate to chat:', data.chatId);
            }
            break;

          case 'sale':
          case 'order':
            navigation.navigate('Orders' as never);
            break;

          case 'shipping':
            navigation.navigate('Orders' as never);
            break;

          case 'settlement':
            navigation.navigate('MySettlements' as never);
            break;

          case 'challenge':
            if (data.challengeId) {
              navigation.navigate('ChallengeDetail' as never, {
                challengeId: data.challengeId,
              } as never);
            } else {
              navigation.navigate('Challenges' as never);
            }
            break;

          default:
            console.log('Unknown notification type:', data.type);
        }
      } catch (error) {
        console.error('Error handling notification navigation:', error);
      }
    };

    // 리스너 설정
    const cleanup = setupNotificationListeners(
      handleNotification,
      handleNotificationResponse
    );

    return cleanup;
  }, [user, navigation]);

  // 앱이 foreground로 올 때 배지 초기화
  useEffect(() => {
    if (user) {
      clearBadgeCount();
    }
  }, [user]);

  return null;
};

