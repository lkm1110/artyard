/**
 * Profile Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../constants/theme';
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

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>(); // TODO: 타입 정의 개선
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
  
  // Viewing another user's profile
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 🚨 사용자 신고 (App Store 심사 필수)
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
      console.log('🚨 User Report Submitted:', {
        reportedUserId: viewingUserId,
        reason,
        details,
        reportedBy: user?.id,
      });

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

      if (dbError) {
        console.error('❌ Failed to save report:', dbError);
        throw dbError;
      }

      console.log('✅ User report saved to database');
      setSuccessMessage({
        title: 'Report Submitted',
        message: 'Thank you for your report. We will review it and take appropriate action.',
      });
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('신고 제출 실패:', error);
      setErrorMessage({
        title: 'Error',
        message: 'An error occurred while submitting the report.',
      });
      setErrorModalVisible(true);
    }
  };

  // 🚫 사용자 차단 (App Store 심사 필수)
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
      console.log(isBlocked ? '✅ Unblocking user:' : '🚫 Blocking user:', viewingUserId);

      if (isBlocked) {
        // Unblock: 차단 해제
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user?.id)
          .eq('blocked_id', viewingUserId);

        if (error) throw error;

        setIsBlocked(false);
        setSuccessMessage({
          title: 'Success',
          message: 'User has been unblocked.',
        });
        setSuccessModalVisible(true);
      } else {
        // Block: 차단
        const { error } = await supabase
          .from('user_blocks')
          .insert({
            blocker_id: user?.id,
            blocked_id: viewingUserId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;

        setIsBlocked(true);
        setSuccessMessage({
          title: 'Success',
          message: 'User has been blocked. They will no longer be able to see your content or contact you.',
        });
        setSuccessModalVisible(true);
      }
    } catch (error) {
      console.error('차단/차단 해제 실패:', error);
      setErrorMessage({
        title: 'Error',
        message: 'An error occurred. Please try again.',
      });
      setErrorModalVisible(true);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmVisible(true);
  };

  const executeDeleteAccount = async () => {
    try {
      console.log('🗑️ [Delete Account] 시작...');
      setIsDeleting(true);
      
      if (!user?.id) {
        setErrorMessage({
          title: '오류',
          message: '사용자를 찾을 수 없습니다.',
        });
        setErrorModalVisible(true);
        return;
      }

      // 직접 fetch로 RPC 호출 (SDK 우회)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('📡 [Delete Account] RPC 호출 중...');
      const response = await fetch(
        'https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/rpc/delete_user_account',
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: user.id })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Delete Account] RPC 실패:', response.status, errorText);
        throw new Error(`Delete failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [Delete Account] RPC 성공:', result);

      setDeleteConfirmVisible(false);
      setSuccessMessage({
        title: '계정 삭제 완료',
        message: '계정이 성공적으로 삭제되었습니다.',
      });
      setSuccessModalVisible(true);
      
      // 성공 모달을 닫은 후 로그아웃
      setTimeout(async () => {
        await signOut();
      }, 2000);
    } catch (error: any) {
      console.error('❌ [Delete Account] 에러:', error);
      setDeleteConfirmVisible(false);
      setErrorMessage({
        title: '오류',
        message: error.message || '계정 삭제에 실패했습니다. 고객센터에 문의해주세요.',
      });
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Screen style={styles.container}>
      {/* 상단 네비게이션 바 */}
      <View style={[styles.navHeader, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Profile
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
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
        {user ? (
          <View style={styles.profileInfo}>
            <View style={[
              styles.avatar,
              { backgroundColor: colors.primary }
            ]}>
              <Text style={styles.avatarText}>
                {user.handle?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            
            <View style={styles.handleRow}>
              <Text style={[
                styles.handle,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                @{user.handle || 'unknown'}
              </Text>
              
              {/* 다른 사용자 프로필인 경우 팔로우 버튼 표시 */}
              {!isOwnProfile && viewingUserId && (
                <FollowButton
                  userId={viewingUserId}
                  size="small"
                  style={styles.profileFollowButton}
                  onFollowChange={(isFollowing, stats) => {
                    console.log('Profile follow status changed:', isFollowing, stats);
                  }}
                />
              )}
            </View>
            
            {user.school && (
              <Text style={[
                styles.school,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                {user.school} {user.department && `· ${user.department}`}
              </Text>
            )}
            
            {user.bio && (
              <Text style={[
                styles.bio,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                {user.bio}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[
            styles.noUser,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            Unable to load user information.
          </Text>
        )}

        <View style={styles.actions}>
          {/* Report and Block buttons for other users' profiles (App Store 심사 필수!) */}
          {!isOwnProfile && viewingUserId && (
            <>
              <Button
                title="Report User"
                onPress={handleReportUser}
                variant="outline"
                icon={<Ionicons name="warning-outline" size={20} color="#FF6B6B" />}
                style={[styles.button, styles.reportButton]}
              />
              <Button
                title={isBlocked ? "Unblock User" : "Block User"}
                onPress={handleBlockUser}
                variant="outline"
                icon={
                  <Ionicons 
                    name={isBlocked ? "checkmark-circle-outline" : "ban-outline"} 
                    size={20} 
                    color={isBlocked ? "#10B981" : "#666666"} 
                  />
                }
                style={[styles.button, styles.blockButton]}
              />
            </>
          )}
          
          {/* Settings and menu buttons for own profile only */}
          {isOwnProfile && (
            <>
              <Button
                title="Settings"
                onPress={() => navigation.navigate('Settings' as never)}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Bookmarks"
                onPress={() => navigation.navigate('Bookmarks')}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Likes"
                onPress={() => navigation.navigate('LikedArtworks')}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Artworks"
                onPress={() => navigation.navigate('MyArtworks')}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Orders"
                onPress={() => navigation.navigate('Orders' as never)}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Sales"
                onPress={() => navigation.navigate('Sales' as never)}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="My Settlements"
                onPress={() => navigation.navigate('MySettlements' as never)}
                variant="outline"
                style={styles.button}
              />
              
              <Button
                title="Artist Dashboard"
                onPress={() => navigation.navigate('ArtistDashboard' as never)}
                variant="outline"
                style={styles.button}
              />
              
              {/* Admin Dashboard (admins only) */}
              {user?.is_admin && (
                <Button
                  title="Admin Dashboard"
                  onPress={() => navigation.navigate('AdminDashboard' as never)}
                  variant="outline"
                  style={styles.button}
                />
              )}
              
              {/* 🔒 Apple 가이드라인 1.2 필수: 고객 지원 및 정책 */}
              <View style={styles.sectionDivider} />
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Support & Policies
              </Text>
              
              <Button
                title="Contact Support"
                onPress={async () => {
                  const email = 'support@artyard.app';
                  const subject = 'Support Request - Artyard App';
                  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
                  
                  try {
                    const supported = await Linking.canOpenURL(mailtoUrl);
                    if (supported) {
                      await Linking.openURL(mailtoUrl);
                    } else {
                      setSuccessMessage({
                        title: 'Contact Support',
                        message: `Email: ${email}\n\nWe typically respond within 24 hours.`,
                      });
                      setSuccessModalVisible(true);
                    }
                  } catch (error) {
                    setSuccessMessage({
                      title: 'Contact Support',
                      message: `Email: ${email}\n\nWe typically respond within 24 hours.`,
                    });
                    setSuccessModalVisible(true);
                  }
                }}
                variant="outline"
                icon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
                style={styles.button}
              />
              
              <Button
                title="Community Guidelines"
                onPress={() => {
                  setSuccessMessage({
                    title: 'Community Guidelines',
                    message: 
                      '• Be respectful and kind\n' +
                      '• No hate speech or harassment\n' +
                      '• No spam or misleading content\n' +
                      '• No explicit or inappropriate content\n' +
                      '• Respect intellectual property rights\n' +
                      '\n' +
                      'Violations may result in content removal or account suspension.\n' +
                      '\n' +
                      'Contact: support@artyard.app',
                  });
                  setSuccessModalVisible(true);
                }}
                variant="outline"
                icon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />}
                style={styles.button}
              />
              
              <Button
                title="Privacy Policy"
                onPress={async () => {
                  const privacyUrl = 'https://lkm1110.github.io/artyard/privacy-policy.html';
                  try {
                    const supported = await Linking.canOpenURL(privacyUrl);
                    if (supported) {
                      await Linking.openURL(privacyUrl);
                    } else {
                      setSuccessMessage({
                        title: 'Privacy Policy',
                        message: 
                          'Please visit our website:\n\n' +
                          'https://lkm1110.github.io/artyard/privacy-policy.html\n\n' +
                          'Or contact us:\n' +
                          'support@artyard.app',
                      });
                      setSuccessModalVisible(true);
                    }
                  } catch (error) {
                    setSuccessMessage({
                      title: 'Privacy Policy',
                      message: 
                        'Please visit our website:\n\n' +
                        'https://lkm1110.github.io/artyard/privacy-policy.html\n\n' +
                        'Or contact us:\n' +
                        'support@artyard.app',
                    });
                    setSuccessModalVisible(true);
                  }
                }}
                variant="outline"
                icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
                style={styles.button}
              />
              
              <Button
                title="Terms of Service"
                onPress={async () => {
                  const termsUrl = 'https://lkm1110.github.io/artyard/terms-of-service.html';
                  try {
                    const supported = await Linking.canOpenURL(termsUrl);
                    if (supported) {
                      await Linking.openURL(termsUrl);
                    } else {
                      setSuccessMessage({
                        title: 'Terms of Service',
                        message: 
                          'Please visit our website:\n\n' +
                          'https://lkm1110.github.io/artyard/terms-of-service.html\n\n' +
                          'Key points:\n' +
                          '• Follow Community Guidelines\n' +
                          '• Respect other users\n' +
                          '• Fair use of the platform\n\n' +
                          'Contact: support@artyard.app',
                      });
                      setSuccessModalVisible(true);
                    }
                  } catch (error) {
                    setSuccessMessage({
                      title: 'Terms of Service',
                      message: 
                        'Please visit our website:\n\n' +
                        'https://lkm1110.github.io/artyard/terms-of-service.html\n\n' +
                        'Key points:\n' +
                        '• Follow Community Guidelines\n' +
                        '• Respect other users\n' +
                        '• Fair use of the platform\n\n' +
                        'Contact: support@artyard.app',
                    });
                    setSuccessModalVisible(true);
                  }
                }}
                variant="outline"
                icon={<Ionicons name="reader-outline" size={20} color={colors.primary} />}
                style={styles.button}
              />
              
              <View style={styles.sectionDivider} />
              
              <Button
                title="Sign Out"
                onPress={handleSignOut}
                variant="text"
                style={[styles.button, styles.signOutButton]}
              />
              
              <Button
                title="Delete Account"
                onPress={handleDeleteAccount}
                variant="text"
                style={[styles.button, styles.deleteAccountButton]}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Report User Modal */}
      <ReportUserModal
        visible={reportModalVisible}
        userName={user?.handle}
        onClose={() => setReportModalVisible(false)}
        onSubmit={submitReport}
      />

      {/* Block User Modal */}
      <BlockUserModal
        visible={blockModalVisible}
        userName={user?.handle}
        isBlocked={isBlocked}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={executeBlock}
      />

      {/* Delete Account Confirm Modal */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title="⚠️ 계정 삭제"
        message="정말로 계정을 삭제하시겠습니까?&#10;&#10;이 작업은 되돌릴 수 없으며,&#10;모든 작품, 댓글, 데이터가 영구적으로 삭제됩니다."
        confirmText="삭제"
        cancelText="취소"
        confirmColor="#EF4444"
        iconName="trash-outline"
        iconColor="#EF4444"
        isProcessing={isDeleting}
        onConfirm={executeDeleteAccount}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setSuccessModalVisible(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setErrorModalVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // 균형을 위한 빈 공간
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100, // 하단 여백 확보
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  handle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    flex: 1,
  },
  profileFollowButton: {
    marginLeft: spacing.md,
  },
  school: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.2,
  },
  noUser: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  reportButton: {
    borderColor: '#FF6B6B',
  },
  blockButton: {
    borderColor: '#666666',
  },
  button: {
    width: '100%',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: spacing.lg,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  signOutButton: {
    marginTop: spacing.lg,
    opacity: 0.8,
  },
  deleteAccountButton: {
    opacity: 0.6,
  },
});

