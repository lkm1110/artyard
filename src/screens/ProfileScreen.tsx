/**
 * 프로필 스크린
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../constants/theme';
import { FollowButton } from '../components/FollowButton';

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
  
  // 다른 사용자의 프로필을 보는 경우
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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

      <View style={styles.content}>
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
                    console.log('프로필 팔로우 상태 변경:', isFollowing, stats);
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
          {/* 자신의 프로필인 경우에만 편집 버튼 표시 */}
          {isOwnProfile && (
            <Button
              title="Edit Profile"
              onPress={() => navigation.navigate('ProfileEdit')}
              variant="outline"
              style={styles.button}
            />
          )}
          
          {/* 자신의 프로필인 경우에만 북마크, 내 작품, 로그아웃 버튼 표시 */}
          {isOwnProfile && (
            <>
              <Button
                title="My Bookmarks"
                onPress={() => navigation.navigate('Bookmarks')}
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
                title="Sign Out"
                onPress={handleSignOut}
                variant="text"
                style={[styles.button, styles.signOutButton]}
              />
            </>
          )}
        </View>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  button: {
    width: '100%',
  },
  signOutButton: {
    marginTop: spacing.lg,
    opacity: 0.8,
  },
});

