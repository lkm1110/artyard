/**
 * 루트 네비게이션 설정
 * 인증 상태에 따라 로그인/메인 화면을 표시
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { storage } from '../utils/storage';

// 네비게이션 및 스크린 import
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { ArtworkDetailScreen } from '../screens/ArtworkDetailScreen';
import { ArtworkEditScreen } from '../screens/ArtworkEditScreen';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { ArtworkUploadScreen } from '../screens/ArtworkUploadScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { MyArtworksScreen } from '../screens/MyArtworksScreen';
import { UserArtworksScreen } from '../screens/UserArtworksScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 앱 초기화
        await initialize();
        
        // 첫 방문 여부 확인
        const hasSeenWelcome = await storage.getItem('hasSeenWelcome');
        setIsFirstTime(!hasSeenWelcome);
      } catch (error) {
        console.error('앱 초기화 오류:', error);
        setIsFirstTime(true); // 오류시 웰컴 화면 표시
      }
    };

    initializeApp();
  }, [initialize]);

  const handleWelcomeComplete = async () => {
    try {
      await storage.setItem('hasSeenWelcome', 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.error('환영 화면 완료 저장 오류:', error);
      setIsFirstTime(false);
    }
  };

  // 초기 로딩 중
  if (isLoading || isFirstTime === null) {
    return <LoadingSpinner message="Getting ArtYard ready..." />;
  }

  const theme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: isDark ? colors.darkBg : colors.bg,
      card: isDark ? colors.darkCard : colors.card,
      text: isDark ? colors.darkText : colors.text,
      border: isDark ? colors.darkCard : colors.card,
      notification: colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: undefined,
        fontWeight: '400',
      },
      medium: {
        fontFamily: undefined,
        fontWeight: '500',
      },
      light: {
        fontFamily: undefined,
        fontWeight: '300',
      },
      thin: {
        fontFamily: undefined,
        fontWeight: '100',
      },
    },
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isFirstTime ? (
          // 첫 방문자용 환영 화면
          <Stack.Screen 
            name="Welcome" 
            options={{ animation: 'fade' }}
          >
            {() => <WelcomeScreen onGetStarted={handleWelcomeComplete} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          // 미인증 사용자용 로그인 화면
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ animation: 'fade' }} 
          />
        ) : (
          // 인증된 사용자용 스크린들
          <>
            <Stack.Screen 
              name="MainApp" 
              component={TabNavigator}
              options={{ animation: 'fade' }} 
            />
            <Stack.Screen 
              name="ArtworkDetail" 
              component={ArtworkDetailScreen}
              options={{ 
                animation: 'slide_from_right',
                presentation: 'modal' 
              }} 
            />
            <Stack.Screen 
              name="ArtworkEdit" 
              component={ArtworkEditScreen}
              options={{ 
                animation: 'slide_from_right' 
              }} 
            />
            <Stack.Screen 
              name="ProfileEdit" 
              component={ProfileEditScreen}
              options={{ 
                animation: 'slide_from_right' 
              }} 
            />
            <Stack.Screen 
              name="ArtworkUpload" 
              component={ArtworkUploadScreen}
              options={{ 
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Bookmarks" 
              component={BookmarksScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="MyArtworks" 
              component={MyArtworksScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="UserArtworks" 
              component={UserArtworksScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            {/* TODO: 추가 스크린들
            <Stack.Screen name="Challenge" component={ChallengeScreen} />
            */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

