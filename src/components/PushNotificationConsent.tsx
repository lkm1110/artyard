/**
 * Push Notification Consent Component
 * 사용자에게 푸시 알림 동의를 받는 모달
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { registerForPushNotifications, checkNotificationPermission } from '../services/pushNotificationService';

const NOTIFICATION_CONSENT_KEY = '@artyard_notification_consent_shown';
const NOTIFICATION_CONSENT_DELAY = 3000; // 3초 후 표시

export const PushNotificationConsent: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    checkAndShowConsent();
  }, [user]);

  const checkAndShowConsent = async () => {
    if (!user) return;

    try {
      // 이미 동의 팝업을 본 적이 있는지 확인
      const consentShown = await AsyncStorage.getItem(NOTIFICATION_CONSENT_KEY);
      
      // 이미 권한이 있는지 확인
      const hasPermission = await checkNotificationPermission();
      
      if (!consentShown && !hasPermission) {
        // 3초 후에 팝업 표시
        setTimeout(() => {
          setVisible(true);
        }, NOTIFICATION_CONSENT_DELAY);
      }
    } catch (error) {
      console.error('Error checking notification consent:', error);
    }
  };

  const handleAllow = async () => {
    try {
      setIsRegistering(true);
      
      // 푸시 알림 등록
      const token = await registerForPushNotifications(user!.id);
      
      if (token) {
        console.log('✅ Push notifications enabled');
      } else {
        console.log('⚠️ Push notifications not available or denied');
      }
      
      // 동의 팝업을 봤다고 기록
      await AsyncStorage.setItem(NOTIFICATION_CONSENT_KEY, 'true');
      setVisible(false);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      await AsyncStorage.setItem(NOTIFICATION_CONSENT_KEY, 'true');
      setVisible(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleNotNow = async () => {
    try {
      // 동의 팝업을 봤다고 기록
      await AsyncStorage.setItem(NOTIFICATION_CONSENT_KEY, 'true');
      setVisible(false);
    } catch (error) {
      console.error('Error saving consent state:', error);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleNotNow}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? colors.darkCard : colors.card,
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? colors.darkText : colors.text },
            ]}
          >
            Stay Updated!
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: isDark ? colors.darkTextMuted : colors.textMuted },
            ]}
          >
            Get notified about:
          </Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            <FeatureItem icon="💰" text="Sales & Orders" />
            <FeatureItem icon="💬" text="New Messages" />
            <FeatureItem icon="❤️" text="Likes & Comments" />
            <FeatureItem icon="👥" text="New Followers" />
            <FeatureItem icon="🏆" text="Challenge Results" />
          </View>

          {/* Note */}
          <Text
            style={[
              styles.note,
              { color: isDark ? colors.darkTextMuted : colors.textMuted },
            ]}
          >
            You can change this anytime in settings
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={handleAllow}
              disabled={isRegistering}
            >
              <Text style={styles.allowButtonText}>
                {isRegistering ? 'Enabling...' : '🔔 Allow Notifications'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.notNowButton,
                { borderColor: isDark ? colors.darkCard : colors.card },
              ]}
              onPress={handleNotNow}
              disabled={isRegistering}
            >
              <Text
                style={[
                  styles.notNowButtonText,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted },
                ]}
              >
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text
        style={[
          styles.featureText,
          { color: isDark ? colors.darkText : colors.text },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  featuresList: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  buttons: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  allowButton: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  allowButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notNowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  notNowButtonText: {
    ...typography.body,
    fontWeight: '500',
  },
});

