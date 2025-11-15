/**
 * 사용자 작품 목록 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { ArtworkCard } from '../components/ArtworkCard';
import { EmptyState } from '../components/EmptyState';
import { FollowButton } from '../components/FollowButton';
import { colors, spacing, typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { getUserArtworks, getUserProfile } from '../services/userService';
import { Artwork, Profile, SaleStatus } from '../types';
import { supabase } from '../services/supabase';
import { ReportUserModal } from '../components/ReportUserModal';
import { BlockUserModal } from '../components/BlockUserModal';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';

type RouteParams = {
  UserArtworks: {
    userId: string;
    userName?: string;
  };
};

const SALE_STATUS_FILTERS = [
  { key: 'all', label: 'All', color: colors.primary },
  { key: 'available', label: 'Available', color: '#10B981' },
  { key: 'sold', label: 'Sold', color: '#EF4444' },
  { key: 'reserved', label: 'Reserved', color: '#F59E0B' },
  { key: 'not_for_sale', label: 'Not for Sale', color: '#6B7280' },
];

export const UserArtworksScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'UserArtworks'>>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  const { userId, userName } = route.params;
  const isOwnProfile = user?.id === userId;

  // 상태 관리
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

  useEffect(() => {
    loadUserData();
  }, [userId, selectedFilter]);

  const loadUserData = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      // 사용자 프로필과 작품 목록을 병렬로 로드
      const [profileResult, artworksResult] = await Promise.all([
        pageNum === 1 ? getUserProfile(userId) : Promise.resolve(userProfile),
        getUserArtworks(userId, pageNum, 12, selectedFilter !== 'all' ? selectedFilter as SaleStatus : undefined)
      ]);

      if (pageNum === 1 && profileResult) {
        setUserProfile(profileResult);
      }

      if (pageNum === 1) {
        setArtworks(artworksResult.artworks);
      } else {
        setArtworks(prev => [...prev, ...artworksResult.artworks]);
      }

      setHasMore(artworksResult.hasMore);
      setPage(pageNum);

    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadUserData(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadUserData(page + 1);
    }
  };

  const handleArtworkPress = (artwork: Artwork) => {
    navigation.navigate('ArtworkDetail', { artworkId: artwork.id });
  };

  const handleFilterPress = (filterKey: string) => {
    if (selectedFilter !== filterKey) {
      setSelectedFilter(filterKey);
      setPage(1);
    }
  };

  // 🚨 사용자 신고 (App Store 심사 필수)
  const handleReportUser = () => {
    if (!user || !userId) {
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
        reportedUserId: userId,
        reason,
        details,
        reportedBy: user?.id,
      });

      const { error: dbError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id,
          reported_id: userId,
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
    if (!user || !userId) {
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
      console.log(isBlocked ? '✅ Unblocking user:' : '🚫 Blocking user:', userId);

      if (isBlocked) {
        // Unblock: 차단 해제
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user?.id)
          .eq('blocked_id', userId);

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
            blocked_id: userId,
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

  const getSaleStatusBadge = (saleStatus: SaleStatus) => {
    const statusConfig = SALE_STATUS_FILTERS.find(f => f.key === saleStatus);
    if (!statusConfig || saleStatus === 'available') return null;

    return (
      <View style={[
        styles.statusBadge,
        { backgroundColor: statusConfig.color }
      ]}>
        <Text style={styles.statusBadgeText}>
          {statusConfig.label}
        </Text>
      </View>
    );
  };

  const filteredArtworks = artworks.filter(artwork => {
    if (selectedFilter === 'all') return true;
    return artwork.sale_status === selectedFilter;
  });

  const renderArtwork = ({ item }: { item: Artwork }) => (
    <View style={styles.artworkContainer}>
      <ArtworkCard
        artwork={item}
        onPress={() => handleArtworkPress(item)}
        onLike={() => {}} // TODO: 좋아요 기능 연결
        onBookmark={() => {}} // TODO: 북마크 기능 연결
        onShare={() => {}} // TODO: 공유 기능 연결
      />
      {getSaleStatusBadge(item.sale_status)}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 사용자 정보 */}
      {userProfile && (
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <View style={styles.userDetails}>
              <Text style={[
                styles.userName,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                {userProfile.handle}
              </Text>
              {userProfile.is_verified_school && (
                <Text style={styles.verifiedIcon}> ✓</Text>
              )}
            </View>
            
            {/* 팔로우, 신고, 차단 버튼 (다른 사용자인 경우) */}
            {!isOwnProfile && (
              <View style={styles.actionButtonsRow}>
                <FollowButton
                  userId={userId}
                  size="medium"
                  onFollowChange={(isFollowing, stats) => {
                    console.log('팔로우 상태 변경:', isFollowing, stats);
                  }}
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleReportUser}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleBlockUser}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isBlocked ? "checkmark-circle-outline" : "ban-outline"} 
                    size={24} 
                    color={isBlocked ? "#10B981" : "#666666"} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {userProfile.school && (
            <Text style={[
              styles.userSchool,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              {userProfile.school}
              {userProfile.department && ` • ${userProfile.department}`}
            </Text>
          )}
          
          {userProfile.bio && (
            <Text style={[
              styles.userBio,
              { color: isDark ? colors.darkTextSecondary : colors.textSecondary }
            ]}>
              {userProfile.bio}
            </Text>
          )}
        </View>
      )}

      {/* 판매 상태 필터 */}
      <View style={styles.filterContainer}>
        <Text style={[
          styles.filterTitle,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          Filter by Status
        </Text>
        <View style={styles.filterButtons}>
          {SALE_STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key
                    ? filter.color
                    : (isDark ? colors.darkCard : colors.card),
                  borderColor: filter.color,
                }
              ]}
              onPress={() => handleFilterPress(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                {
                  color: selectedFilter === filter.key
                    ? colors.white
                    : (isDark ? colors.darkText : colors.text)
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 작품 수 표시 */}
      <Text style={[
        styles.artworkCount,
        { color: isDark ? colors.darkTextMuted : colors.textMuted }
      ]}>
        {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''}
        {selectedFilter !== 'all' && ` • ${SALE_STATUS_FILTERS.find(f => f.key === selectedFilter)?.label}`}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (isLoading && artworks.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[
            styles.loadingText,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            Loading artworks...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* 헤더 */}
      <View style={[
        styles.navHeader,
        { backgroundColor: isDark ? colors.darkCard : colors.card }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.backIcon,
            { color: isDark ? colors.darkText : colors.text }
          ]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          {userName || userProfile?.handle || 'User'}'s Artworks
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={filteredArtworks}
        keyExtractor={(item) => item.id}
        renderItem={renderArtwork}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="No artworks found"
            message={
              selectedFilter === 'all'
                ? "This user hasn't uploaded any artworks yet."
                : `No ${SALE_STATUS_FILTERS.find(f => f.key === selectedFilter)?.label.toLowerCase()} artworks found.`
            }
            actionTitle="Explore Other Artists"
            onAction={() => navigation.navigate('MainApp')}
          />
        }
        ListFooterComponent={renderFooter}
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
        contentContainerStyle={filteredArtworks.length === 0 ? styles.emptyContainer : styles.contentContainer}
      />

      {/* Report User Modal */}
      <ReportUserModal
        visible={reportModalVisible}
        userName={userProfile?.handle || userName}
        onClose={() => setReportModalVisible(false)}
        onSubmit={submitReport}
      />

      {/* Block User Modal */}
      <BlockUserModal
        visible={blockModalVisible}
        userName={userProfile?.handle || userName}
        isBlocked={isBlocked}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={executeBlock}
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  headerRight: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    marginTop: spacing.md,
  },
  header: {
    padding: spacing.lg,
  },
  userInfo: {
    marginBottom: spacing.xl,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  verifiedIcon: {
    color: colors.primary,
    fontSize: 18,
  },
  userSchool: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  userBio: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight * 1.3,
  },
  filterContainer: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.md,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  artworkCount: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  artworkContainer: {
    width: '100%', // 1열 레이아웃
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    zIndex: 1,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
