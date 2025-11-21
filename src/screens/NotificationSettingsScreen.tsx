/**
 * Notification Settings Screen
 * 푸시 알림 설정 관리
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

interface NotificationPreferences {
  // 소셜 알림
  new_follower: boolean;
  new_like: boolean;
  new_comment: boolean;
  
  // 거래 알림
  purchase: boolean;
  sale: boolean;
  payment_received: boolean;
  
  // 챌린지 & 경매
  challenge_started: boolean;
  challenge_ending_soon: boolean;
  voting_started: boolean;
  auction_bid: boolean;
  auction_won: boolean;
  auction_lost: boolean;
  
  // 시스템 알림
  system_updates: boolean;
  newsletter: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  new_follower: true,
  new_like: true,
  new_comment: true,
  purchase: true,
  sale: true,
  payment_received: true,
  challenge_started: true,
  challenge_ending_soon: true,
  voting_started: true,
  auction_bid: true,
  auction_won: true,
  auction_lost: true,
  system_updates: true,
  newsletter: false,
};

interface SettingItem {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const NotificationSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.notification_preferences });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      if (!user) return;

      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPreferences })
        .eq('id', user.id);

      if (error) throw error;

      console.log('✅ Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const sections: SettingSection[] = [
    {
      title: 'Social',
      items: [
        {
          key: 'new_follower',
          title: 'New Followers',
          description: 'When someone follows you',
          icon: 'person-add-outline',
          iconColor: colors.primary,
        },
        {
          key: 'new_like',
          title: 'Likes',
          description: 'When someone likes your artwork',
          icon: 'heart-outline',
          iconColor: '#ef4444',
        },
        {
          key: 'new_comment',
          title: 'Comments',
          description: 'When someone comments on your artwork',
          icon: 'chatbubble-outline',
          iconColor: '#3b82f6',
        },
      ],
    },
    {
      title: 'Transactions',
      items: [
        {
          key: 'purchase',
          title: 'Purchases',
          description: 'Order confirmations and updates',
          icon: 'cart-outline',
          iconColor: '#10b981',
        },
        {
          key: 'sale',
          title: 'Sales',
          description: 'When your artwork is sold',
          icon: 'cash-outline',
          iconColor: '#10b981',
        },
        {
          key: 'payment_received',
          title: 'Payment Received',
          description: 'When payment is settled to you',
          icon: 'card-outline',
          iconColor: '#10b981',
        },
      ],
    },
    {
      title: 'Challenges & Auctions',
      items: [
        {
          key: 'challenge_started',
          title: 'New Challenges',
          description: 'When a new challenge begins',
          icon: 'trophy-outline',
          iconColor: '#f59e0b',
        },
        {
          key: 'challenge_ending_soon',
          title: 'Challenge Ending Soon',
          description: 'Reminders before challenge ends',
          icon: 'time-outline',
          iconColor: '#f59e0b',
        },
        {
          key: 'voting_started',
          title: 'Voting Started',
          description: 'When voting phase begins',
          icon: 'thumbs-up-outline',
          iconColor: '#f59e0b',
        },
        {
          key: 'auction_bid',
          title: 'Auction Bids',
          description: 'When someone outbids you',
          icon: 'pricetag-outline',
          iconColor: '#8b5cf6',
        },
        {
          key: 'auction_won',
          title: 'Auction Won',
          description: 'When you win an auction',
          icon: 'ribbon-outline',
          iconColor: '#8b5cf6',
        },
        {
          key: 'auction_lost',
          title: 'Auction Lost',
          description: 'When auction ends without winning',
          icon: 'close-circle-outline',
          iconColor: '#8b5cf6',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          key: 'system_updates',
          title: 'System Updates',
          description: 'Important app updates and features',
          icon: 'notifications-outline',
          iconColor: '#6b7280',
        },
        {
          key: 'newsletter',
          title: 'Newsletter',
          description: 'Weekly art trends and tips',
          icon: 'mail-outline',
          iconColor: '#6b7280',
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
    <View key={item.key} style={[styles.settingItem, { backgroundColor: theme.card }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
          <Ionicons name={item.icon} size={20} color={item.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
      <Switch
        value={preferences[item.key]}
        onValueChange={() => togglePreference(item.key)}
        trackColor={{ false: theme.border, true: colors.primary }}
        thumbColor={preferences[item.key] ? colors.white : '#f4f3f4'}
        ios_backgroundColor={theme.border}
        disabled={loading || saving}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading preferences...
            </Text>
          </View>
        ) : (
          <>
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

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                You can change these settings anytime. Important transaction notifications cannot
                be disabled.
              </Text>
            </View>
          </>
        )}
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
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
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
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption,
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

