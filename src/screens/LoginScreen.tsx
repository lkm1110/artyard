/**
 * 로그인 스크린
 * Google, Apple, Facebook, Naver, Kakao 소셜 로그인 제공
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../constants/theme';
import { signInWithGoogle, supabase, getRedirectUri } from '../services/supabase';
import { signInWithNaver, signInWithKakao } from '../services/socialAuth';
import { signInWithKakaoWeb, signInWithNaverWeb, getOAuthMethod } from '../services/webOAuth';
import { signInWithApple, signInWithAppleWeb, isAppleAuthenticationAvailable } from '../services/appleAuth';
import { signInWithFacebook, signInWithFacebookWeb } from '../services/facebookAuth';
import { GoogleIcon, AppleIcon, FacebookIcon, NaverIcon, KakaoIcon } from '../components/BrandIcons';

export const LoginScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Apple Sign-In 사용 가능 여부 확인
    const checkAppleAuth = async () => {
      const available = await isAppleAuthenticationAvailable();
      setIsAppleAvailable(available);
    };
    
    checkAppleAuth();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('Google 로그인 시도 중...');
      const { data, error } = await signInWithGoogle();
      if (error) {
        console.error('Google 로그인 실패:', error);
        Alert.alert('❌ 로그인 실패', `Google 로그인에 실패했습니다.\n\n${error.message}`);
      } else {
        console.log('Google 로그인 성공:', data);
        Alert.alert('✅ 로그인 성공', 'Google 로그인에 성공했습니다!');
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      Alert.alert('❌ 로그인 오류', `Google 로그인 중 오류가 발생했습니다.\n\n${error}`);
    }
  };

  const handleNaverLogin = async () => {
    try {
      console.log('네이버 로그인 시도 중...');
      const { isWeb, platform, os } = getOAuthMethod();
      console.log('🔍 네이버 로그인 플랫폼 감지:', { isWeb, platform, os, currentPlatform: Platform.OS });
      
      if (isWeb) {
        console.log('웹 환경에서 네이버 로그인 시뮬레이션');
        Alert.alert(
          '📱 모바일에서 테스트하세요',
          `네이버 OAuth는 PC 웹에서 제한됩니다.\n\n✅ 완전한 테스트 방법:\n1. 스마트폰에 Expo Go 설치\n2. QR 코드 스캔\n3. 모바일에서 테스트\n\n현재 환경: ${platform}`,
          [{ text: '확인', style: 'default' }]
        );
        
        // 웹용 실제 Auth 로그인
        const { success, data, authResult } = await signInWithNaverWeb();
        if (success && authResult) {
          console.log('✅ 네이버 웹 로그인 성공:', data);
          console.log('✅ 실제 Auth 사용자 생성:', authResult.user?.email);
          
          // 세션이 없어도 강제로 메인 화면으로 이동
          if (authResult.user && !authResult.session) {
            console.log('🚀 세션 없이 강제 메인 화면 이동');
            // AuthStore 초기화를 다시 트리거
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          console.log('네이버 웹 시뮬레이션 성공 (Auth 실패):', data);
        }
      } else {
        // 실제 모바일 환경
        const { success, error } = await signInWithNaver();
        if (!success || error) {
          console.error('네이버 로그인 실패:', error);
          Alert.alert('❌ 네이버 로그인 실패', `로그인에 실패했습니다.\n\n${error?.message || '알 수 없는 오류'}`);
        } else {
          console.log('네이버 로그인 성공!');
          Alert.alert('✅ 네이버 로그인 성공', '네이버 로그인에 성공했습니다!');
        }
      }
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      Alert.alert('❌ 네이버 로그인 오류', `로그인 중 오류가 발생했습니다.\n\n${error}`);
    }
  };

  const handleAppleLogin = async () => {
    try {
      console.log('🍎 Apple 로그인 시도 중...');
      console.log('🔍 Apple 로그인 리다이렉트 URI:', getRedirectUri());
      console.log('🔍 현재 플랫폼:', Platform.OS);
      
      // Supabase OAuth 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: getRedirectUri(),
        },
      });

      console.log('📡 Apple OAuth 응답:', { data, error });

      if (error) {
        console.error('❌ Apple OAuth 오류 상세:', error);
        throw error;
      }

      console.log('✅ Apple OAuth 리다이렉트 시작:', data);
    } catch (error: any) {
      console.error('❌ Apple 로그인 오류:', error);
      
      const errorMessage = error.message || 'Apple 로그인 중 오류가 발생했습니다.';
      
      if (!errorMessage.includes('취소')) {
        Alert.alert('❌ Apple 로그인 실패', `Apple 로그인에 실패했습니다.\n\n${errorMessage}`);
      }
    }
  };

  const handleFacebookLogin = async () => {
    try {
      console.log('📘 Facebook 로그인 시도 중...');
      console.log('🔍 Facebook 로그인 리다이렉트 URI:', getRedirectUri());
      console.log('🔍 현재 플랫폼:', Platform.OS);
      
      // Supabase OAuth 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: getRedirectUri(),
        },
      });

      console.log('📡 Facebook OAuth 응답:', { data, error });

      if (error) {
        console.error('❌ Facebook OAuth 오류 상세:', error);
        throw error;
      }

      console.log('✅ Facebook OAuth 리다이렉트 시작:', data);
    } catch (error: any) {
      console.error('❌ Facebook 로그인 오류:', error);
      
      const errorMessage = error.message || 'Facebook 로그인 중 오류가 발생했습니다.';
      
      if (!errorMessage.includes('취소')) {
        Alert.alert('❌ Facebook 로그인 실패', `Facebook 로그인에 실패했습니다.\n\n${errorMessage}`);
      }
    }
  };

  const handleKakaoLogin = async () => {
    try {
      console.log('카카오 로그인 시도 중...');
      const { isWeb, platform, os } = getOAuthMethod();
      console.log('🔍 카카오 로그인 플랫폼 감지:', { isWeb, platform, os, currentPlatform: Platform.OS });
      
      if (isWeb) {
        console.log('웹 환경에서 카카오 로그인 시뮬레이션');
        Alert.alert(
          '📱 모바일에서 테스트하세요',
          `카카오 OAuth는 PC 웹에서 제한됩니다.\n\n✅ 완전한 테스트 방법:\n1. 스마트폰에 Expo Go 설치\n2. QR 코드 스캔\n3. 모바일에서 테스트\n\n현재 환경: ${platform}`,
          [{ text: '확인', style: 'default' }]
        );
        
        // 웹용 실제 Auth 로그인
        const { success, data, authResult } = await signInWithKakaoWeb();
        if (success && authResult) {
          console.log('✅ 카카오 웹 로그인 성공:', data);
          console.log('✅ 실제 Auth 사용자 생성:', authResult.user?.email);
        } else {
          console.log('카카오 웹 시뮬레이션 성공 (Auth 실패):', data);
        }
      } else {
        // 실제 모바일 환경
        const { success, error } = await signInWithKakao();
        if (!success || error) {
          console.error('카카오 로그인 실패:', error);
          Alert.alert('❌ 카카오 로그인 실패', `로그인에 실패했습니다.\n\n${error?.message || '알 수 없는 오류'}`);
        } else {
          console.log('카카오 로그인 성공!');
          Alert.alert('✅ 카카오 로그인 성공', '카카오 로그인에 성공했습니다!');
        }
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert('❌ 카카오 로그인 오류', `로그인 중 오류가 발생했습니다.\n\n${error}`);
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
        {/* 1순위: Google (공식 가이드라인) */}
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
        
        {/* 2순위: Apple (공식 가이드라인) */}
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
        
        {/* 3순위: Facebook (흰색 배경) */}
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
        
        {/* 4순위: Naver (흰색 배경) */}
        <Button
          title="Continue with Naver"
          onPress={handleNaverLogin}
          variant="outline"
          icon={<NaverIcon size={20} />}
          style={[styles.button, { 
            backgroundColor: '#FFFFFF', 
            borderColor: '#03C75A',
            borderWidth: 1,
          }]}
          textStyle={{ color: '#03C75A', fontWeight: '600' }}
        />
        
        {/* 5순위: Kakao (흰색 배경) */}
        <Button
          title="Continue with Kakao"
          onPress={handleKakaoLogin}
          variant="outline"
          icon={<KakaoIcon size={20} />}
          style={[styles.button, { 
            backgroundColor: '#FFFFFF', 
            borderColor: '#FEE500',
            borderWidth: 1,
          }]}
          textStyle={{ color: '#3C4043', fontWeight: '600' }}
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
