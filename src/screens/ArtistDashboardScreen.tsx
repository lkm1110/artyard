/**
 * Artist Dashboard Screen
 * 작가 대시보드 - 판매 통계, 인기 작품, 분석 데이터
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface DashboardStats {
  total_artworks: number;
  total_sales: number;
  total_revenue: number;
  avg_price: number;
  total_likes: number;
  total_views: number;
  total_followers: number;
  tier: string;
  rating: number;
}

interface PopularArtwork {
  id: string;
  title: string;
  image_url: string;
  likes: number;
  views: number;
  price: number;
}

export const ArtistDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total_artworks: 0,
    total_sales: 0,
    total_revenue: 0,
    avg_price: 0,
    total_likes: 0,
    total_views: 0,
    total_followers: 0,
    tier: 'New',
    rating: 0,
  });
  const [popularArtworks, setPopularArtworks] = useState<PopularArtwork[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user) return;

      // 병렬로 데이터 로드
      const [statsData, artworksData] = await Promise.all([
        loadStats(),
        loadPopularArtworks(),
      ]);

      setStats(statsData);
      setPopularArtworks(artworksData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async (): Promise<DashboardStats> => {
    if (!user) throw new Error('No user');

    // 1. 프로필 정보 (티어, 팔로워)
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, rating, followers_count')
      .eq('id', user.id)
      .single();

    // 2. 작품 수 및 총 좋아요/조회수
    const { data: artworks } = await supabase
      .from('artworks')
      .select('id, price, likes_count, views_count')
      .eq('author_id', user.id);

    const total_artworks = artworks?.length || 0;
    const total_likes = artworks?.reduce((sum, art) => sum + (art.likes_count || 0), 0) || 0;
    const total_views = artworks?.reduce((sum, art) => sum + (art.views_count || 0), 0) || 0;

    // 3. 판매 통계 (주문 테이블에서)
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', user.id)
      .eq('status', 'completed');

    const total_sales = orders?.length || 0;
    const total_revenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const avg_price = total_sales > 0 ? total_revenue / total_sales : 0;

    return {
      total_artworks,
      total_sales,
      total_revenue,
      avg_price,
      total_likes,
      total_views,
      total_followers: profile?.followers_count || 0,
      tier: profile?.tier || 'New',
      rating: profile?.rating || 0,
    };
  };

  const loadPopularArtworks = async (): Promise<PopularArtwork[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('artworks')
      .select('id, title, images, likes_count, views_count, price')
      .eq('author_id', user.id)
      .order('likes_count', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map((art) => ({
      id: art.id,
      title: art.title,
      image_url: art.images && art.images.length > 0 ? art.images[0] : '',
      likes: art.likes_count || 0,
      views: art.views_count || 0,
      price: art.price,
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Pro':
        return '#8b5cf6';
      case 'Verified':
        return '#3b82f6';
      case 'Trusted':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getTierIcon = (tier: string): keyof typeof Ionicons.glyphMap => {
    switch (tier) {
      case 'Pro':
        return 'star';
      case 'Verified':
        return 'checkmark-circle';
      case 'Trusted':
        return 'shield-checkmark';
      default:
        return 'person';
    }
  };

  const theme = {
    bg: isDark ? colors.darkBackground : colors.background,
    card: isDark ? colors.darkCard : colors.card,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    border: isDark ? colors.darkBorder : colors.border,
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <LoadingSpinner message="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Artist Dashboard</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Tier Badge */}
        <View style={styles.tierContainer}>
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: `${getTierColor(stats.tier)}20`, borderColor: getTierColor(stats.tier) },
            ]}
          >
            <Ionicons name={getTierIcon(stats.tier)} size={24} color={getTierColor(stats.tier)} />
            <Text style={[styles.tierText, { color: getTierColor(stats.tier) }]}>
              {stats.tier} Artist
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {stats.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Revenue Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue</Text>
          <View style={[styles.revenueCard, { backgroundColor: theme.card }]}>
            <View style={styles.revenueMain}>
              <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                Total Earnings
              </Text>
              <Text style={[styles.revenueAmount, { color: colors.success }]}>
                ${stats.total_revenue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.revenueStats}>
              <View style={styles.revenueStat}>
                <Text style={[styles.revenueStatValue, { color: theme.text }]}>
                  {stats.total_sales}
                </Text>
                <Text style={[styles.revenueStatLabel, { color: theme.textSecondary }]}>
                  Sales
                </Text>
              </View>
              <View style={styles.revenueStat}>
                <Text style={[styles.revenueStatValue, { color: theme.text }]}>
                  ${stats.avg_price.toFixed(2)}
                </Text>
                <Text style={[styles.revenueStatLabel, { color: theme.textSecondary }]}>
                  Avg Price
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="images-outline" size={28} color={colors.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_artworks}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Artworks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="heart-outline" size={28} color="#ef4444" />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_likes}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Likes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="eye-outline" size={28} color="#3b82f6" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats.total_views > 999 ? `${(stats.total_views / 1000).toFixed(1)}k` : stats.total_views}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Views</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="people-outline" size={28} color="#10b981" />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_followers}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Popular Artworks */}
        {popularArtworks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Artworks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyArtworks' as never)}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.popularList}>
              {popularArtworks.map((artwork, index) => (
                <TouchableOpacity
                  key={artwork.id}
                  style={[styles.popularItem, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate('ArtworkDetail' as any, { artworkId: artwork.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.popularRank}>
                    <Text style={[styles.rankNumber, { color: theme.textSecondary }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <Image
                    source={{ uri: artwork.image_url }}
                    style={styles.popularImage}
                    resizeMode="cover"
                  />
                  <View style={styles.popularInfo}>
                    <Text
                      style={[styles.popularTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {artwork.title}
                    </Text>
                    <View style={styles.popularStats}>
                      <View style={styles.popularStatItem}>
                        <Ionicons name="heart" size={14} color="#ef4444" />
                        <Text style={[styles.popularStatText, { color: theme.textSecondary }]}>
                          {artwork.likes}
                        </Text>
                      </View>
                      <View style={styles.popularStatItem}>
                        <Ionicons name="eye" size={14} color="#3b82f6" />
                        <Text style={[styles.popularStatText, { color: theme.textSecondary }]}>
                          {artwork.views}
                        </Text>
                      </View>
                      <Text style={[styles.popularPrice, { color: colors.success }]}>
                        ${artwork.price}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('ArtworkUpload' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={32} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Upload Artwork</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('MyOrders' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt" size={32} color="#10b981" />
              <Text style={[styles.actionLabel, { color: theme.text }]}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('Challenges' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="trophy" size={32} color="#f59e0b" />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Challenges</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('MyArtworks' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={32} color="#8b5cf6" />
              <Text style={[styles.actionLabel, { color: theme.text }]}>My Gallery</Text>
            </TouchableOpacity>
          </View>
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
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 99,
    borderWidth: 2,
    gap: spacing.xs,
  },
  tierText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
  revenueCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  revenueMain: {
    marginBottom: spacing.md,
  },
  revenueLabel: {
    ...typography.caption,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  revenueAmount: {
    ...typography.h1,
    fontSize: 36,
    fontWeight: '800',
  },
  revenueStats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  revenueStat: {
    flex: 1,
  },
  revenueStatValue: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
  },
  revenueStatLabel: {
    ...typography.caption,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 13,
  },
  popularList: {
    gap: spacing.sm,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  popularRank: {
    width: 28,
    alignItems: 'center',
  },
  rankNumber: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  popularImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  popularInfo: {
    flex: 1,
  },
  popularTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  popularStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularStatText: {
    ...typography.caption,
    fontSize: 13,
  },
  popularPrice: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionLabel: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
