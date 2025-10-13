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
} from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../constants/theme';
import { signInWithGoogle, supabase, getRedirectUri } from '../services/supabase';
import { signInWithKakao } from '../services/socialAuth';
import { signInWithKakaoWeb, getOAuthMethod } from '../services/webOAuth';
import { signInWithApple, signInWithAppleWeb, isAppleAuthenticationAvailable } from '../services/appleAuth';
import { signInWithFacebook, signInWithFacebookWeb } from '../services/facebookAuth';
import { GoogleIcon, AppleIcon, FacebookIcon, KakaoIcon } from '../components/BrandIcons';

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
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('Attempting Google login...');
      const { data, error } = await signInWithGoogle();
      if (error) {
        console.error('Google login failed:', error);
        showAlert('❌ Login Failed', `Google login failed.\n\n${error.message}`);
      } else {
        console.log('Google login successful:', data);
        showAlert('✅ Login Successful', 'Google login completed successfully!');
      }
    } catch (error) {
      console.error('Google login error:', error);
      showAlert('❌ Login Error', `An error occurred during Google login.\n\n${error}`);
    }
  };


  const handleAppleLogin = async () => {
    try {
      console.log('🍎 Attempting Apple login...');
      console.log('🔍 Apple login redirect URI:', getRedirectUri('apple'));
      console.log('🔍 Current platform:', Platform.OS);
      
        // Use Supabase OAuth (popup window)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: getRedirectUri('apple'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: false,
          },
        });

      console.log('📡 Apple OAuth response:', { data, error });

      if (error) {
        console.error('❌ Apple OAuth error details:', error);
        throw error;
      }

      console.log('✅ Apple OAuth redirect started:', data);
    } catch (error: any) {
      console.error('❌ Apple login error:', error);
      
      const errorMessage = error.message || 'An error occurred during Apple login.';
      
      if (!errorMessage.includes('cancelled')) {
        showAlert('❌ Apple Login Failed', `Apple login failed.\n\n${errorMessage}`);
      }
    }
  };

  const handleFacebookLogin = async () => {
    try {
      console.log('📘 Attempting Facebook login...');
      console.log('🔍 Facebook login redirect URI:', getRedirectUri());
      console.log('🔍 Current platform:', Platform.OS);
      
        // Use Supabase OAuth (popup window)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: getRedirectUri(),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: false,
          },
        });

      console.log('📡 Facebook OAuth response:', { data, error });

      if (error) {
        console.error('❌ Facebook OAuth error details:', error);
        throw error;
      }

      console.log('✅ Facebook OAuth redirect started:', data);
    } catch (error: any) {
      console.error('❌ Facebook login error:', error);
      
      const errorMessage = error.message || 'An error occurred during Facebook login.';
      
      if (!errorMessage.includes('cancelled')) {
        showAlert('❌ Facebook Login Failed', `Facebook login failed.\n\n${errorMessage}`);
      }
    }
  };

  const handleKakaoLogin = async () => {
    try {
      console.log('Attempting Kakao login...');
      const { isWeb, platform, os } = getOAuthMethod();
      console.log('🔍 Kakao login platform detection:', { isWeb, platform, os, currentPlatform: Platform.OS });
      
      if (isWeb) {
        console.log('🌐 Running Kakao OAuth login in web environment');
        
        // Real Kakao OAuth through Supabase - redirect in same window
        console.log('🔍 Kakao login redirect URI:', getRedirectUri('kakao'));
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            redirectTo: getRedirectUri('kakao'),
            queryParams: {
              scope: 'profile_nickname profile_image', // Nickname + Profile image (excluding email)
            },
            skipBrowserRedirect: false, // Redirect in same window
          },
        });

        if (error) {
          console.error('❌ Kakao OAuth error:', error);
          throw error;
        }

        console.log('✅ Kakao OAuth redirect started:', data);
      } else {
        // Actual mobile environment
        const { success, error } = await signInWithKakao();
        if (!success || error) {
          console.error('Kakao login failed:', error);
          showAlert('❌ Kakao Login Failed', `Login failed.\n\n${error?.message || 'Unknown error'}`);
        } else {
          console.log('Kakao login successful!');
          showAlert('✅ Kakao Login Successful', 'Kakao login completed successfully!');
        }
      }
    } catch (error) {
      console.error('Kakao login error:', error);
      showAlert('❌ Kakao Login Error', `An error occurred during login.\n\n${error}`);
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
        
        {/* 4th Priority: Kakao (White Background) */}
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
