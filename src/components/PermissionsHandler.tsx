/**
 * 앱 시작 시 필요한 권한들을 요청하는 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

interface PermissionsHandlerProps {
  onComplete?: () => void;
}

export const PermissionsHandler: React.FC<PermissionsHandlerProps> = ({ onComplete }) => {
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  useEffect(() => {
    if (!permissionsRequested) {
      requestPermissions();
    }
  }, []);

  const requestPermissions = async () => {
    try {
      console.log('🔐 권한 요청 시작...');

      // Android에서만 권한 요청 (iOS는 사용 시점에 자동 요청)
      if (Platform.OS === 'android') {
        // 1. 미디어 라이브러리 권한
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('📷 미디어 라이브러리 권한:', mediaLibraryStatus.status);

        if (mediaLibraryStatus.status !== 'granted') {
          Alert.alert(
            'Photo Access Required',
            'ArtYard needs photo access to upload artworks.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }

        // 2. 카메라 권한
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📸 카메라 권한:', cameraStatus.status);

        if (cameraStatus.status !== 'granted') {
          Alert.alert(
            'Camera Access Required',
            'ArtYard needs camera access to take photos.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }

        // 3. 위치 권한 (선택사항)
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        console.log('📍 위치 권한:', locationStatus.status);

        // 4. 알림 권한
        const notificationStatus = await Notifications.requestPermissionsAsync();
        console.log('🔔 알림 권한:', notificationStatus.status);

        if (notificationStatus.status !== 'granted') {
          Alert.alert(
            'Notifications Recommended',
            'Allow notifications to receive updates about messages, likes, and comments.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }

        console.log('✅ 권한 요청 완료');
      } else {
        // iOS는 사용 시점에 자동으로 권한 요청됨
        console.log('📱 iOS: 권한은 사용 시점에 자동 요청됩니다');
      }

      setPermissionsRequested(true);
      onComplete?.();
    } catch (error) {
      console.error('❌ 권한 요청 오류:', error);
      setPermissionsRequested(true);
      onComplete?.();
    }
  };

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
};

