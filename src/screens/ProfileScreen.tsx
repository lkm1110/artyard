/**
 * Profile Screen - 리디자인 버전 (Settings 스타일)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { FollowButton } from '../components/FollowButton';
import { supabase } from '../services/supabase';
import { ReportUserModal } from '../components/ReportUserModal';
import { BlockUserModal } from '../components/BlockUserModal';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface ProfileScreenProps {
  route?: {
    params?: {
      userId?: string;
    };
  };
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
  showArrow?: boolean;
  badge?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuthStore();
  
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 사용자 정보 다시 로드
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          const { setUser } = useAuthStore.getState();
          setUser({ ...user, ...data });
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleReportUser = () => {
    if (!user || !viewingUserId) {
      setErrorMessage({
        title: 'Notice',
        message: 'Please log in to report',
      });
      setErrorModalVisible(true);
      return;
    }
    setReportModalVisible(true);
  };

  const submitReport = async (reason: string, details?: string) => {
    try {
      const { error: dbError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id,
          reported_id: viewingUserId,
          content_type: 'user',
          reason: details || reason,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setSuccessMessage({
        title: 'Report Submitted',
        message: 'Thank you for your report. We will review it and take appropriate action.',
      });
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Report submission failed:', error);
      setErrorMessage({
        title: 'Error',
        message: 'An error occurred while submitting the report.',
      });
      setErrorModalVisible(true);
    }
  };

  const handleBlockUser = () => {
    if (!user || !viewingUserId) {
      setErrorMessage({
        title: 'Notice',
        message: 'Please log in to block users',
      });
      setErrorModalVisible(true);
      return;
    }
    setBlockModalVisible(true);
  };

  const executeBlock = async () => {
    try {
      if (isBlocked) {
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user?.id)
          .eq('blocked_id', viewingUserId);

        if (error) throw error;
        setIsBlocked(false);
      } else {
        const { error } = await supabase
          .from('user_blocks')
          .insert({
            blocker_id: user?.id,
            blocked_id: viewingUserId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        setIsBlocked(true);
      }

      setSuccessMessage({
        title: isBlocked ? 'User Unblocked' : 'User Blocked',
        message: isBlocked 
          ? 'You can now see this user\'s content again.' 
          : 'You will no longer see this user\'s content.',
      });
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Block/Unblock error:', error);
      setErrorMessage({
        title: 'Error',
        message: 'An error occurred. Please try again.',
      });
      setErrorModalVisible(true);
    }
  };

  const theme = {
    bg: isDark ? colors.darkBackground : colors.background,
    card: isDark ? colors.darkCard : colors.card,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    border: isDark ? colors.darkBorder : colors.border,
  };

  const ownProfileSections: MenuSection[] = [
    {
      title: 'Settings',
      items: [
        {
          id: 'settings',
          title: 'Settings',
          icon: 'settings-outline',
          iconColor: colors.primary,
          onPress: () => navigation.navigate('Settings'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'My Content',
      items: [
        {
          id: 'bookmarks',
          title: 'My Bookmarks',
          icon: 'bookmark-outline',
          iconColor: '#f59e0b',
          onPress: () => navigation.navigate('Bookmarks'),
          showArrow: true,
        },
        {
          id: 'likes',
          title: 'My Likes',
          icon: 'heart-outline',
          iconColor: '#ef4444',
          onPress: () => navigation.navigate('LikedArtworks'),
          showArrow: true,
        },
        {
          id: 'artworks',
          title: 'My Artworks',
          icon: 'images-outline',
          iconColor: '#8b5cf6',
          onPress: () => navigation.navigate('MyArtworks'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          id: 'orders',
          title: 'My Orders',
          icon: 'receipt-outline',
          iconColor: '#3b82f6',
          onPress: () => navigation.navigate('Orders' as any),
          showArrow: true,
        },
        {
          id: 'sales',
          title: 'My Sales',
          icon: 'cash-outline',
          iconColor: '#10b981',
          onPress: () => navigation.navigate('Sales'),
          showArrow: true,
        },
        {
          id: 'settlements',
          title: 'My Settlements',
          icon: 'card-outline',
          iconColor: '#10b981',
          onPress: () => navigation.navigate('MySettlements'),
          showArrow: true,
        },
        {
          id: 'dashboard',
          title: 'Artist Dashboard',
          icon: 'analytics-outline',
          iconColor: '#6366f1',
          onPress: () => navigation.navigate('ArtistDashboard'),
          showArrow: true,
        },
      ],
    },
  ];

  if (user?.is_admin) {
    ownProfileSections.push({
      title: 'Admin',
      items: [
        {
          id: 'admin',
          title: 'Admin Dashboard',
          icon: 'shield-outline',
          iconColor: '#dc2626',
          onPress: () => navigation.navigate('AdminDashboard'),
          showArrow: true,
        },
      ],
    });
  }

  const otherUserSections: MenuSection[] = [
    {
      items: [
        {
          id: 'report',
          title: 'Report User',
          icon: 'warning-outline',
          iconColor: '#ef4444',
          onPress: handleReportUser,
          showArrow: true,
        },
        {
          id: 'block',
          title: isBlocked ? 'Unblock User' : 'Block User',
          icon: isBlocked ? 'checkmark-circle-outline' : 'ban-outline',
          iconColor: isBlocked ? '#10b981' : '#6b7280',
          onPress: handleBlockUser,
          showArrow: true,
        },
      ],
    },
  ];

  const sections = isOwnProfile ? ownProfileSections : otherUserSections;

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: theme.card }]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
          <Ionicons name={item.icon} size={22} color={item.iconColor} />
        </View>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
      </View>
      <View style={styles.menuRight}>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Info Card */}
        {user && (
          <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.handle?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            
            <View style={styles.profileTextContainer}>
              <View style={styles.handleRow}>
                <Text style={[styles.handle, { color: theme.text }]}>
                  @{user.handle || 'unknown'}
                </Text>
                
                {!isOwnProfile && viewingUserId && (
                  <FollowButton
                    userId={viewingUserId}
                    size="small"
                    style={styles.followButton}
                    onFollowChange={(isFollowing, stats) => {
                      console.log('Follow status changed:', isFollowing, stats);
                    }}
                  />
                )}
              </View>
              
              {user.school && (
                <Text style={[styles.school, { color: theme.textSecondary }]}>
                  {user.school} {user.department && `· ${user.department}`}
                </Text>
              )}
              
              {user.bio && (
                <Text style={[styles.bio, { color: theme.text }]}>
                  {user.bio}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title && (
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {section.title}
              </Text>
            )}
            <View style={styles.sectionItems}>
              {section.items.map((item) => renderMenuItem(item))}
            </View>
          </View>
        ))}

        {/* Sign Out (Own Profile Only) */}
        {isOwnProfile && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: theme.card }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ef444415' }]}>
                  <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                </View>
                <Text style={[styles.signOutText, { color: '#ef4444' }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <ReportUserModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={submitReport}
      />

      <BlockUserModal
        visible={blockModalVisible}
        isBlocked={isBlocked}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={executeBlock}
      />

      <SuccessModal
        visible={successModalVisible}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setSuccessModalVisible(false)}
      />

      <ErrorModal
        visible={errorModalVisible}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="⚠️ Delete Account"
        message="Are you sure?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {}}
        onCancel={() => setDeleteConfirmVisible(false)}
        isDestructive={true}
        isLoading={isDeleting}
      />
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
  profileCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  profileTextContainer: {
    width: '100%',
    alignItems: 'center',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  handle: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
  },
  followButton: {
    marginLeft: spacing.sm,
  },
  school: {
    ...typography.body,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  menuLeft: {
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
  menuTitle: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  signOutText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
});
