/**
 * Push Notification Service
 * Manages push notification registration, permissions, and handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

// Expo Go 환경 체크
const isExpoGo = Constants.appOwnership === 'expo';

// 알림 핸들러 설정 (Expo Go가 아닌 경우에만)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.log('⚠️ Push notifications not available in Expo Go');
  }
}

/**
 * Push Token 등록
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  try {
    console.log('🔔 Starting push notification registration...');

    // 1. Expo Go 환경 체크
    if (isExpoGo) {
      console.log('⚠️ Push notifications are not available in Expo Go (SDK 53+)');
      console.log('ℹ️ Please use a development build for push notifications');
      return null;
    }

    // 2. 웹 환경 체크 (웹에서는 푸시 알림 비활성화)
    if (Platform.OS === 'web') {
      console.log('🌐 Push notifications are disabled on web (VAPID key required)');
      console.log('ℹ️ Use in-app notifications instead on web');
      return null;
    }

    // 3. 실제 디바이스 체크
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // 4. 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log('📱 Current notification permission:', existingStatus);

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 New notification permission:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted');
      return null;
    }

    // 5. Push Token 발급
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                     Constants.easConfig?.projectId;
    
    if (!projectId) {
      console.error('❌ No project ID found. Run: eas build:configure');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const pushToken = tokenData.data;
    console.log('✅ Push Token generated:', pushToken);

    // 6. Supabase profiles 테이블에 저장
    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: pushToken,
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to save push token:', error);
      // Don't throw, just log - token is still valid
    } else {
      console.log('✅ Push token saved to profiles table');
    }

    // 5. Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E91E63',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E91E63',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('sales', {
        name: 'Sales & Orders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10B981',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#E91E63',
      });

      console.log('✅ Android notification channels created');
    }

    return pushToken;
  } catch (error: any) {
    console.error('❌ Push notification setup failed:', error);
    return null;
  }
};

/**
 * Push Token 제거 (로그아웃 시)
 */
export const unregisterPushToken = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    console.log('✅ Push token removed');
  } catch (error) {
    console.error('❌ Failed to remove push token:', error);
  }
};

/**
 * 알림 수신 리스너 설정
 */
export const setupNotificationListeners = (
  onNotification?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) => {
  // Expo Go에서는 리스너 설정 불가
  if (isExpoGo) {
    console.log('⚠️ Notification listeners not available in Expo Go');
    return () => {}; // no-op cleanup function
  }

  try {
    // 앱이 foreground일 때 알림 수신
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification received:', notification);
      onNotification?.(notification);
    });

    // 알림 클릭 시
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification clicked:', response);
      onNotificationResponse?.(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  } catch (error) {
    console.log('⚠️ Could not setup notification listeners:', error);
    return () => {}; // no-op cleanup function
  }
};

/**
 * 로컬 알림 (테스트용)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { seconds: 1 },
    });
    console.log('✅ Local notification scheduled');
  } catch (error) {
    console.error('❌ Failed to schedule notification:', error);
  }
};

/**
 * 배지 카운트 설정
 */
export const setBadgeCount = async (count: number) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('❌ Failed to set badge count:', error);
  }
};

/**
 * 배지 카운트 초기화
 */
export const clearBadgeCount = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('❌ Failed to clear badge count:', error);
  }
};

/**
 * 알림 권한 확인
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    // Expo Go에서는 푸시 알림 사용 불가
    if (isExpoGo) {
      return false;
    }
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('⚠️ Could not check notification permission:', error);
    return false;
  }
};

/**
 * 알림 설정 열기
 */
export const openNotificationSettings = () => {
  if (Platform.OS === 'ios') {
    Alert.alert(
      'Notification Settings',
      'Please enable notifications in Settings > ArtYard > Notifications',
      [{ text: 'OK' }]
    );
  } else {
    Alert.alert(
      'Notification Settings',
      'Please enable notifications in Settings > Apps > ArtYard > Notifications',
      [{ text: 'OK' }]
    );
  }
};

