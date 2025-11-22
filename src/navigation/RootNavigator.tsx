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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { LikedArtworksScreen } from '../screens/LikedArtworksScreen';
import { MyArtworksScreen } from '../screens/MyArtworksScreen';
import { UserArtworksScreen } from '../screens/UserArtworksScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { TwoCheckoutPaymentScreen } from '../screens/TwoCheckoutPaymentScreen';
import { AddressFormScreen } from '../screens/AddressFormScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { ChallengeDetailScreen } from '../screens/ChallengeDetailScreen';
import { AuctionsScreen } from '../screens/AuctionsScreen';
import { AuctionDetailScreen } from '../screens/AuctionDetailScreen';
import { ArtistDashboardScreen } from '../screens/ArtistDashboardScreen';
import { FollowersListScreen } from '../screens/FollowersListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
// OAuth 콜백은 nativeOAuth.ts의 AuthSession이 처리하므로 AuthCallbackHandler 비활성화
// import { AuthCallbackHandlerSimple as AuthCallbackHandler } from '../components/AuthCallbackHandler.simple';

// Admin screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { RevenueDetailScreen } from '../screens/admin/RevenueDetailScreen';
import { PlatformAnalyticsScreen } from '../screens/admin/PlatformAnalyticsScreen';
import { ReportsManagementScreen } from '../screens/admin/ReportsManagementScreen';
import { ArtworkManagementScreen } from '../screens/admin/ArtworkManagementScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { OrderManagementScreen } from '../screens/admin/OrderManagementScreen';
import { ChallengeManagementScreen } from '../screens/admin/ChallengeManagementScreen';
import { AuctionManagementScreen } from '../screens/admin/AuctionManagementScreen';
import { AdminManagementScreen } from '../screens/admin/AdminManagementScreen';

// User screens
import { OrdersScreen } from '../screens/OrdersScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { MySettlementsScreen } from '../screens/MySettlementsScreen';

// Admin settlement
import { SettlementManagementScreen } from '../screens/admin/SettlementManagementScreen';

// Push Notifications
import { PushNotificationHandler } from '../components/PushNotificationHandler';

// Consent Screen
import { ConsentScreen } from '../screens/ConsentScreen';
import { supabase } from '../services/supabase';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const { isAuthenticated, isLoading, initialize, user, session } = useAuthStore();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [needsConsent, setNeedsConsent] = useState<boolean>(false);
  const [checkingConsent, setCheckingConsent] = useState<boolean>(true);

  // 인증 상태 변경 감지 로그
  useEffect(() => {
    console.log('🔍 [RootNavigator] 상태 변경 감지:');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - isLoading:', isLoading);
    console.log('  - isFirstTime:', isFirstTime);
    console.log('  - user:', user?.handle || 'null');
    console.log('  - session:', !!session);
    
    // 세션은 있지만 프로필이 없고 로딩중이 아닌 경우 → 앱 reload
    if (session && !user && !isLoading && !isAuthenticated) {
      console.log('⚠️ [RootNavigator] 세션 있지만 프로필 없음 - 앱 새로고침 필요');
      console.log('💡 [RootNavigator] 1초 후 자동으로 앱을 새로고침합니다...');
      
      // 1초 후 자동으로 initialize 재실행
      setTimeout(() => {
        console.log('🔄 [RootNavigator] 앱 새로고침 중...');
        initialize();
      }, 1000);
    }
  }, [isAuthenticated, isLoading, isFirstTime, user, session, initialize]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 앱 초기화
        await initialize();
        
        // 첫 방문 여부 확인
        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        setIsFirstTime(!hasSeenWelcome);
      } catch (error) {
        console.error('앱 초기화 오류:', error);
        setIsFirstTime(true); // 오류시 웰컴 화면 표시
      }
    };

    initializeApp();
  }, [initialize]);

  // 🆕 동의 여부 확인 (로그인한 사용자만)
  useEffect(() => {
    const checkConsent = async () => {
      if (!isAuthenticated || !user || isLoading) {
        setCheckingConsent(false);
        setNeedsConsent(false);
        return;
      }

      try {
        console.log('🔍 [Consent Check] 사용자 동의 여부 확인 중...');
        console.log('  - User ID:', user.id);

        // profiles 테이블에서 동의 여부 확인
        const { data, error } = await supabase
          .from('profiles')
          .select('consent_agreed_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ [Consent Check] Error:', error);
          // ✅ 수정: 에러 발생 시 (프로필 생성 중일 수 있음) 동의 불필요로 간주
          // 프로필이 생성되면 자동으로 재확인됨
          console.log('⚠️ [Consent Check] 프로필 조회 실패 - 생성 중일 수 있음. 동의 체크 스킵');
          setNeedsConsent(false);
        } else if (!data?.consent_agreed_at) {
          console.log('⚠️  [Consent Check] 동의 필요! (consent_agreed_at is NULL)');
          setNeedsConsent(true);
        } else {
          console.log('✅ [Consent Check] 동의 완료:', data.consent_agreed_at);
          setNeedsConsent(false);
        }
      } catch (error) {
        console.error('❌ [Consent Check] Unexpected error:', error);
        // ✅ 수정: 예외 발생 시도 동의 불필요로 간주 (프로필 생성 중일 수 있음)
        console.log('⚠️ [Consent Check] 예외 발생 - 동의 체크 스킵');
        setNeedsConsent(false);
      } finally {
        setCheckingConsent(false);
      }
    };

    checkConsent();
  }, [isAuthenticated, user, isLoading]);

  const handleWelcomeComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.error('환영 화면 완료 저장 오류:', error);
      setIsFirstTime(false);
    }
  };

  // 🆕 동의 완료 핸들러
  const handleConsentComplete = () => {
    console.log('✅ [Consent] 동의 완료! 메인 앱으로 이동');
    setNeedsConsent(false);
  };

  // 초기 로딩 중
  if (isLoading || isFirstTime === null || (isAuthenticated && checkingConsent)) {
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
      {/* OAuth 콜백은 nativeOAuth.ts의 AuthSession이 자동으로 처리 */}
      {/* Push Notification Handler */}
      <PushNotificationHandler />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          // 화면 전환 시 배경색 유지 (깜빡임 방지)
          contentStyle: {
            backgroundColor: isDark ? colors.darkBg : colors.bg,
          },
          // 화면 전환 애니메이션 최적화
          animationTypeForReplace: 'push',
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
        ) : needsConsent ? (
          // 🆕 동의 필요한 사용자용 동의 화면
          <Stack.Screen 
            name="Consent" 
            options={{ animation: 'fade' }}
          >
            {() => <ConsentScreen onComplete={handleConsentComplete} />}
          </Stack.Screen>
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
              name="LikedArtworks" 
              component={LikedArtworksScreen}
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
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutScreen}
              options={{ 
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="TwoCheckoutPayment" 
              component={TwoCheckoutPaymentScreen}
              options={{ 
                animation: 'slide_from_right',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="AddressForm" 
              component={AddressFormScreen}
              options={{ 
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="Challenges" 
              component={ChallengesScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="ChallengeDetail" 
              component={ChallengeDetailScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Auctions" 
              component={AuctionsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="AuctionDetail" 
              component={AuctionDetailScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="ArtistDashboard" 
              component={ArtistDashboardScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="FollowersList" 
              component={FollowersListScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            
            {/* Admin Screens */}
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboardScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="RevenueDetail" 
              component={RevenueDetailScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="ReportsManagement" 
              component={ReportsManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="ArtworkManagement" 
              component={ArtworkManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="UserManagement" 
              component={UserManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="OrderManagement" 
              component={OrderManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="ChallengeManagement" 
              component={ChallengeManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="AuctionManagement" 
              component={AuctionManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="AdminManagement" 
              component={AdminManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="PlatformAnalytics" 
              component={PlatformAnalyticsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            
            {/* User Order/Review Screens */}
            <Stack.Screen 
              name="Orders" 
              component={OrdersScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Sales" 
              component={SalesScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="Review" 
              component={ReviewScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            
            {/* Settlement Screens */}
            <Stack.Screen 
              name="MySettlements" 
              component={MySettlementsScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="SettlementManagement" 
              component={SettlementManagementScreen}
              options={{ 
                animation: 'slide_from_right'
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

