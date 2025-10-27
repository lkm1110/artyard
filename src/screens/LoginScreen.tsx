/**
 * Login Screen
 * Social login with Google, Apple, Facebook, Kakao
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../constants/theme';
import { signInWithGoogle, supabase, getRedirectUri } from '../services/supabase';
import { signInWithApple, signInWithAppleWeb, isAppleAuthenticationAvailable } from '../services/appleAuth';
import { signInWithFacebook, signInWithFacebookWeb } from '../services/facebookAuth';
import { 
  signInWithGoogleNative, 
  signInWithFacebookNative,
  signInWithAppleNative 
} from '../services/nativeOAuth';
import { GoogleIcon, AppleIcon, FacebookIcon } from '../components/BrandIcons';

// Platform-specific Alert function
const showAlert = (title: string, message?: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    // Use native alert() for web
    const fullMessage = message ? `${title}\n\n${message}` : title;
    alert(fullMessage);
  } else {
    // Use React Native Alert for mobile
    if (buttons) {
      Alert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message);
    }
  }
};

export const LoginScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Check Apple Sign-In availability
    const checkAppleAuth = async () => {
      const available = await isAppleAuthenticationAvailable();
      setIsAppleAvailable(available);
    };
    
    checkAppleAuth();
    
    // 네이티브 환경에서 AppState 변경 감지 (웹 → 앱 전환 시 세션 체크)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (Platform.OS === 'web') return;
      
      console.log('🔍 LoginScreen AppState 변경:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('🔄 앱이 포그라운드로 돌아옴 - LoginScreen에서 세션 확인...');
        
        try {
          // 잠시 기다린 후 세션 확인
          setTimeout(async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('📊 LoginScreen 포그라운드 세션 확인:', { 
              session: !!session, 
              user: session?.user?.id,
              provider: session?.user?.app_metadata?.provider
            });
            
            if (session) {
              console.log('✅ LoginScreen에서 로그인 감지! 자동으로 메인 화면으로 이동...');
              // showAlert 제거 - 자동으로 전환됨
              
              // 추가로 세션 재확인 (안전장치)
              setTimeout(async () => {
                const { data: { session: doubleCheck } } = await supabase.auth.getSession();
                if (doubleCheck) {
                  console.log('✅ 이중 확인: 로그인 상태 확실함');
                }
              }, 3000);
            }
          }, 1500);
        } catch (error) {
          console.error('❌ LoginScreen 포그라운드 세션 확인 오류:', error);
        }
      }
    };
    
    let appStateSubscription: any = null;
    if (Platform.OS !== 'web') {
      console.log('📱 LoginScreen AppState 리스너 등록...');
      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    }
    
    return () => {
      if (appStateSubscription) {
        appStateSubscription.remove();
        console.log('📱 LoginScreen AppState 리스너 정리 완료');
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('🔍 Button clicked! Starting Google login...');
      // showAlert 제거 - 디버깅 로그만 유지
      
      console.log('🔍 Platform detection:', Platform.OS);
      
      // 네이티브 OAuth 사용
      const { data, error } = await signInWithGoogleNative();

      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }

      console.log('✅ Google OAuth initiated:', data);
      // showAlert 제거 - 자동으로 로그인됨
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.message || 'An error occurred during Google login.';
      // 에러만 콘솔에 기록
    }
  };


  const handleAppleLogin = async () => {
    try {
      console.log('🍎 Attempting Apple login...');
      // showAlert 제거 - 디버깅 로그만 유지
      
      console.log('🔍 Current platform:', Platform.OS);
      
      // 네이티브 OAuth 사용
      const { data, error } = await signInWithAppleNative();

      if (error) {
        console.error('❌ Apple OAuth error details:', error);
        throw error;
      }

      console.log('✅ Apple OAuth initiated:', data);
      // showAlert 제거 - 자동으로 로그인됨
    } catch (error: any) {
      console.error('❌ Apple login error:', error);
      
      const errorMessage = error.message || 'An error occurred during Apple login.';
      
      if (!errorMessage.includes('cancelled')) {
        // 에러만 콘솔에 기록
      }
    }
  };

  const handleFacebookLogin = async () => {
    try {
      console.log('📘 Attempting Facebook login...');
      // showAlert 제거 - 디버깅 로그만 유지
      
      console.log('🔍 Current platform:', Platform.OS);
      
      // 네이티브 OAuth 사용
      const { data, error } = await signInWithFacebookNative();

      if (error) {
        console.error('❌ Facebook OAuth error details:', error);
        throw error;
      }

      console.log('✅ Facebook OAuth initiated:', data);
      // showAlert 제거 - 자동으로 로그인됨
    } catch (error: any) {
      console.error('❌ Facebook login error:', error);
      
      const errorMessage = error.message || 'An error occurred during Facebook login.';
      
      if (!errorMessage.includes('cancelled')) {
        // 에러만 콘솔에 기록
      }
    }
  };


  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={[
            styles.logo,
            { color: colors.primary }
          ]}>
            ArtYard
          </Text>
        </View>
        
        <Text style={[
          styles.subtitle,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          Join the college art community
          {'\n'}
          Share and discover amazing artworks
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* 1st Priority: Google (Official Guidelines) */}
        <Button
          title="Continue with Google"
          onPress={handleGoogleLogin}
          variant="outline"
          icon={<GoogleIcon size={20} />}
          style={[styles.button, { 
            backgroundColor: '#FFFFFF', 
            borderColor: '#DADCE0',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }]}
          textStyle={{ color: '#3C4043', fontWeight: '500' }}
        />
        
        {/* 2nd Priority: Apple (Official Guidelines) */}
        <Button
          title="Continue with Apple"
          onPress={handleAppleLogin}
          variant="outline"
          icon={<AppleIcon size={20} />}
          style={[styles.button, { 
            backgroundColor: '#FFFFFF', 
            borderColor: '#000000',
            borderWidth: 1,
          }]}
          textStyle={{ color: '#000000', fontWeight: '600' }}
        />
        
        {/* 3rd Priority: Facebook (White Background) */}
        <Button
          title="Continue with Facebook"
          onPress={handleFacebookLogin}
          variant="outline"
          icon={<FacebookIcon size={20} />}
          style={[styles.button, { 
            backgroundColor: '#FFFFFF', 
            borderColor: '#1877F2',
            borderWidth: 1,
          }]}
          textStyle={{ color: '#1877F2', fontWeight: '600' }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[
          styles.footerText,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          By signing in, you agree to our{'\n'}
          Terms of Service and Privacy Policy.
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.2,
  },
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    lineHeight: typography.caption.lineHeight * 1.2,
  },
});
