/**
 * 팔로우/언팔로우 버튼 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { followUser, unfollowUser, getFollowStatus } from '../services/followService';
import { FollowStats } from '../types/advanced';

interface Props {
  userId: string;
  onFollowChange?: (isFollowing: boolean, stats: FollowStats) => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

export const FollowButton: React.FC<Props> = ({
  userId,
  onFollowChange,
  style,
  size = 'medium',
}) => {
  const isDark = useColorScheme() === 'dark';
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<FollowStats>({
    follower_count: 0,
    following_count: 0,
    is_following: false,
  });

  useEffect(() => {
    loadFollowStatus();
  }, [userId]);

  const loadFollowStatus = async () => {
    try {
      const followStats = await getFollowStatus(userId);
      setStats(followStats);
      setIsFollowing(followStats.is_following);
    } catch (error) {
      console.error('팔로우 상태 로드 오류:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      let result;
      if (isFollowing) {
        result = await unfollowUser(userId);
      } else {
        result = await followUser(userId);
      }

      if (result.success) {
        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);
        
        // 팔로워 수 업데이트
        const newStats = {
          ...stats,
          is_following: newIsFollowing,
          follower_count: stats.follower_count + (newIsFollowing ? 1 : -1),
        };
        setStats(newStats);
        
        onFollowChange?.(newIsFollowing, newStats);
      } else {
        console.error('팔로우 토글 실패:', result.error);
        // TODO: 사용자에게 오류 메시지 표시
      }
    } catch (error) {
      console.error('팔로우 토글 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[`button_${size}`],
      {
        backgroundColor: isFollowing 
          ? (isDark ? colors.darkCard : colors.card)
          : colors.primary,
        borderColor: isFollowing 
          ? (isDark ? colors.darkBorder : colors.border)
          : colors.primary,
      },
      style,
    ];

    return baseStyle;
  };

  const getTextStyle = () => {
    return [
      styles.buttonText,
      styles[`buttonText_${size}`],
      {
        color: isFollowing 
          ? (isDark ? colors.darkText : colors.text)
          : colors.white,
      },
    ];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleFollowToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isFollowing ? colors.primary : colors.white} 
        />
      ) : (
        <Text style={getTextStyle()}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: spacing.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button_small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 60,
  },
  button_medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 80,
  },
  button_large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minWidth: 100,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonText_small: {
    fontSize: typography.caption.fontSize,
  },
  buttonText_medium: {
    fontSize: typography.body.fontSize,
  },
  buttonText_large: {
    fontSize: typography.h4.fontSize,
  },
});
