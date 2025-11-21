/**
 * 알림 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, spacing, typography } from '../constants/theme';
import { Notification } from '../types/advanced';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/followService';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      const result = await getNotifications(pageNum, 20);
      
      if (pageNum === 1) {
        setNotifications(result.notifications);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);

    } catch (error) {
      console.error('알림 로드 오류:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // 알림을 읽음으로 표시
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    }

    // 알림 타입에 따라 적절한 화면으로 이동
    switch (notification.type) {
      case 'new_artwork':
        if (notification.data?.artwork_id) {
          navigation.navigate('ArtworkDetail', {
            artworkId: notification.data.artwork_id,
          });
        }
        break;
      case 'new_follower':
        if (notification.data?.follower_id) {
          navigation.navigate('Profile', {
            userId: notification.data.follower_id,
          });
        }
        break;
      case 'like':
      case 'comment':
        if (notification.data?.artwork_id) {
          navigation.navigate('ArtworkDetail', {
            artworkId: notification.data.artwork_id,
          });
        }
        break;
      case 'auction_outbid':
      case 'auction_won':
        if (notification.data?.auction_id) {
          navigation.navigate('AuctionDetail' as never, {
            auctionId: notification.data.auction_id,
          } as never);
        }
        break;
      case 'purchase':
        // 판매 내역으로 이동
        navigation.navigate('Sales' as never);
        break;
      case 'payout':
        // 정산 내역으로 이동
        navigation.navigate('MySettlements' as never);
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_artwork':
        return '🎨';
      case 'new_follower':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'purchase':
        return '💰';
      case 'payout':
        return '💸';
      case 'auction_outbid':
        return '🔨';
      case 'auction_won':
        return '🏆';
      case 'challenge_win':
        return '🎖️';
      case 'shipping_started':
        return '📦';
      case 'shipping_delivered':
        return '✅';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.is_read
            ? (isDark ? colors.darkBackground : colors.background)
            : (isDark ? colors.darkCard : colors.card),
          borderBottomColor: isDark ? colors.darkBorder : colors.border,
        }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.iconText}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          {
            color: isDark ? colors.darkText : colors.text,
            fontWeight: item.is_read ? '400' : '600',
          }
        ]}>
          {item.title}
        </Text>
        <Text style={[
          styles.notificationMessage,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          {item.message}
        </Text>
        <Text style={[
          styles.notificationTime,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
      
      {!item.is_read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    if (unreadCount === 0) return null;

    return (
      <View style={[
        styles.header,
        { backgroundColor: isDark ? colors.darkCard : colors.card }
      ]}>
        <Text style={[
          styles.headerText,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={[styles.markAllButton, { color: colors.primary }]}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && notifications.length === 0) {
    return (
      <Screen>
        <LoadingSpinner />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* 헤더 (통일된 스타일) */}
      <View style={[
        styles.screenHeader,
        { 
          backgroundColor: isDark ? colors.darkCard : colors.card,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Notifications
        </Text>
        <View style={styles.headerSpacer}>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <Text style={[styles.notificationCount, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {notifications.filter(n => !n.is_read).length}
            </Text>
          )}
        </View>
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            message="You'll see notifications about new artworks, followers, and interactions here."
            actionTitle="Explore Artworks"
            onAction={() => navigation.navigate('MainApp')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
    alignItems: 'flex-end',
  },
  notificationCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  markAllButton: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight * 1.2,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: typography.caption.fontSize,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
});
