/**
 * Settings Screen
 * 앱 설정 및 정책 링크
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import Constants from 'expo-constants';

interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightText?: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const openURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Notification Settings',
          icon: 'notifications-outline',
          iconColor: colors.primary,
          onPress: () => navigation.navigate('NotificationSettings' as never),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          icon: 'person-outline',
          iconColor: colors.primary,
          onPress: () => navigation.navigate('ProfileEdit' as never),
          showArrow: true,
        },
        {
          id: 'delete-account',
          title: 'Delete Account',
          icon: 'trash-outline',
          iconColor: colors.error,
          onPress: () => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement account deletion
                    Alert.alert('Info', 'Account deletion will be implemented soon.');
                  },
                },
              ]
            );
          },
          showArrow: false,
        },
      ],
    },
    {
      title: 'Policies',
      items: [
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'shield-checkmark-outline',
          iconColor: '#3b82f6',
          onPress: () => navigation.navigate('PrivacyPolicy' as never),
          showArrow: true,
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'document-text-outline',
          iconColor: '#3b82f6',
          onPress: () => openURL('https://lkm1110.github.io/artyard/terms-of-service.html'),
          showArrow: true,
        },
        {
          id: 'refund',
          title: 'Refund Policy',
          icon: 'cash-outline',
          iconColor: '#10b981',
          onPress: () => openURL('https://lkm1110.github.io/artyard/docs/refund-policy.html'),
          showArrow: true,
        },
        {
          id: 'shipping',
          title: 'Shipping Policy',
          icon: 'cube-outline',
          iconColor: '#10b981',
          onPress: () => openURL('https://lkm1110.github.io/artyard/docs/shipping-policy.html'),
          showArrow: true,
        },
        {
          id: 'guidelines',
          title: 'Artist Guidelines',
          icon: 'brush-outline',
          iconColor: '#8b5cf6',
          onPress: () => openURL('https://lkm1110.github.io/artyard/docs/artist-guidelines.html'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'App Version',
          icon: 'information-circle-outline',
          iconColor: '#6b7280',
          onPress: () => {},
          showArrow: false,
          rightText: appVersion,
        },
        {
          id: 'contact',
          title: 'Contact Support',
          icon: 'mail-outline',
          iconColor: '#6b7280',
          onPress: () => {
            Linking.openURL('mailto:support@artyard.app');
          },
          showArrow: true,
        },
      ],
    },
  ];

  const theme = {
    bg: isDark ? colors.darkBackground : colors.background,
    card: isDark ? colors.darkCard : colors.card,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    border: isDark ? colors.darkBorder : colors.border,
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: theme.card }]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
          <Ionicons name={item.icon} size={22} color={item.iconColor} />
        </View>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
      </View>
      <View style={styles.settingRight}>
        {item.rightText && (
          <Text style={[styles.rightText, { color: theme.textSecondary }]}>
            {item.rightText}
          </Text>
        )}
        {item.showArrow && (
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
            <View style={styles.sectionItems}>
              {section.items.map((item) => renderSettingItem(item))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Artyard - Global Art Marketplace
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            © 2024 Artyard. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionItems: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rightText: {
    ...typography.body,
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

