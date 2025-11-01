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
    
    // ⚠️ AppState 리스너 임시 비활성화
    // nativeOAuth.ts와 authStore가 로그인을 자동으로 처리하므로 불필요
    // 이 리스너가 간섭할 수 있어서 비활성화
    console.log('📱 LoginScreen AppState 리스너는 비활성화됨 (authStore가 자동 처리)');
    
    return () => {
      // 정리 작업 없음
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('🔍 Button clicked! Starting Google login...');
      
      console.log('🔍 Platform detection:', Platform.OS);
      
      // 네이티브 OAuth 사용
      const { data, error } = await signInWithGoogleNative();

      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }

      console.log('✅ Google OAuth initiated:', data);
      
      // 로그인 성공 - 팝업 없이 자동으로 진행
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.message || 'An error occurred during Google login.';
      showAlert('Login Failed', errorMessage, [{ text: 'OK' }]);
    }
  };


  const handleAppleLogin = async () => {
    try {
      console.log('🍎 Attempting Apple login...');
      
      console.log('🔍 Current platform:', Platform.OS);
      
      // 네이티브 OAuth 사용
      const { data, error } = await signInWithAppleNative();

      if (error) {
        console.error('❌ Apple OAuth error details:', error);
        throw error;
      }

      console.log('✅ Apple OAuth initiated:', data);
      
      // 로그인 성공 - 팝업 없이 자동으로 진행
    } catch (error: any) {
      console.error('❌ Apple login error:', error);
      
      const errorMessage = error.message || 'An error occurred during Apple login.';
      
      if (!errorMessage.includes('cancelled')) {
        showAlert('Login Failed', errorMessage, [{ text: 'OK' }]);
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
          Join the art community
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
