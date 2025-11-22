/**
 * Platform Analytics Screen
 * 플랫폼 통계 및 분석
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface Analytics {
  totalUsers: number;
  totalArtworks: number;
  totalTransactions: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  topCategories: { category: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

export const PlatformAnalyticsScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalArtworks: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    topCategories: [],
    revenueByMonth: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 전체 사용자 수
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 전체 작품 수
      const { count: artworksCount } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true });

      // 전체 거래 수
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // 총 매출
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount');
      
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // 이번 달 신규 사용자
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // 활성 사용자 (최근 30일 내 활동)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // 카테고리별 작품 수
      const { data: artworks } = await supabase
        .from('artworks')
        .select('category');

      const categoryCounts: { [key: string]: number } = {};
      artworks?.forEach(artwork => {
        const cat = artwork.category || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalUsers: usersCount || 0,
        totalArtworks: artworksCount || 0,
        totalTransactions: transactionsCount || 0,
        totalRevenue,
        activeUsers: activeUsersCount || 0,
        newUsersThisMonth: newUsers || 0,
        topCategories,
        revenueByMonth: [], // TODO: 월별 매출 계산
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ icon, title, value, color, subtitle }: any) => (
    <View style={[
      styles.statCard,
      { backgroundColor: isDark ? colors.darkCard : colors.card },
      shadows.md,
    ]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {title}
        </Text>
        <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? colors.darkBackground : colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? colors.darkText : colors.text }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBackground : colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={[
          styles.header,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
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
            Platform Analytics
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAnalytics(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              📊 Overview
            </Text>
            
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                title="Total Users"
                value={analytics.totalUsers.toLocaleString()}
                color={colors.primary}
              />
              <StatCard
                icon="images"
                title="Total Artworks"
                value={analytics.totalArtworks.toLocaleString()}
                color={colors.success}
              />
              <StatCard
                icon="card"
                title="Transactions"
                value={analytics.totalTransactions.toLocaleString()}
                color={colors.warning}
              />
              <StatCard
                icon="cash"
                title="Total Revenue"
                value={`$${analytics.totalRevenue.toLocaleString()}`}
                color={colors.error}
              />
            </View>
          </View>

          {/* User Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              👥 User Metrics
            </Text>
            
            <View style={styles.statsGrid}>
              <StatCard
                icon="pulse"
                title="Active Users"
                value={analytics.activeUsers.toLocaleString()}
                color="#10b981"
                subtitle="Last 30 days"
              />
              <StatCard
                icon="person-add"
                title="New Users"
                value={analytics.newUsersThisMonth.toLocaleString()}
                color="#3b82f6"
                subtitle="This month"
              />
            </View>
          </View>

          {/* Top Categories */}
          {analytics.topCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                🎨 Top Categories
              </Text>
              
              {analytics.topCategories.map((cat, index) => (
                <View 
                  key={cat.category}
                  style={[
                    styles.categoryItem,
                    { backgroundColor: isDark ? colors.darkCard : colors.card }
                  ]}
                >
                  <View style={styles.categoryRank}>
                    <Text style={[styles.categoryRankText, { color: colors.primary }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: isDark ? colors.darkText : colors.text }]}>
                      {cat.category}
                    </Text>
                    <Text style={[styles.categoryCount, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      {cat.count} artworks
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryBarFill,
                        { 
                          backgroundColor: colors.primary,
                          width: `${(cat.count / analytics.totalArtworks) * 100}%`
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    marginBottom: spacing.md,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
  },
  statSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  categoryRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRankText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    marginBottom: spacing.xs / 2,
  },
  categoryCount: {
    fontSize: typography.sizes.sm,
  },
  categoryBar: {
    width: 100,
    height: 8,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

