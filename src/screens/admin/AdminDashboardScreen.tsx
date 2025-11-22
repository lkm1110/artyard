/**
 * 어드민 대시보드 메인 화면
 * - 통계 요약
 * - 각 관리 화면으로 이동
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
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface DashboardStats {
  totalUsers: number;
  totalArtworks: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingReports: number;
  activeUsers: number;
  todayRevenue: number;
  activeChallenges: number;
}

export const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArtworks: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingReports: 0,
    activeUsers: 0,
    todayRevenue: 0,
    activeChallenges: 0,
  });

  useEffect(() => {
    checkAdminPermission();
  }, []);

  const checkAdminPermission = async () => {
    try {
      // 관리자 권한 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (!profile?.is_admin) {
        Alert.alert('Access Denied', 'You do not have admin permissions');
        navigation.goBack();
        return;
      }

      // 통계 로드
      await loadStats();
    } catch (error: any) {
      console.error('권한 확인 실패:', error);
      Alert.alert('Error', 'Failed to verify admin permissions');
      navigation.goBack();
    }
  };

  const loadStats = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 1. 총 사용자 수
      let totalUsers = 0;
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      } catch (error) {
        console.warn('Failed to load users count:', error);
      }

      // 2. 총 작품 수
      let totalArtworks = 0;
      try {
        const { count } = await supabase
          .from('artworks')
          .select('*', { count: 'exact', head: true });
        totalArtworks = count || 0;
      } catch (error) {
        console.warn('Failed to load artworks count:', error);
      }

      // 3. 총 거래 수 & 매출 (여러 방법 시도)
      let totalTransactions = 0;
      let totalRevenue = 0;
      let todayRevenue = 0;
      
      try {
        // 방법 1: status 컬럼 사용
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('status', 'completed');

        if (error) throw error;

        totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
        totalTransactions = transactions?.length || 0;

        // 오늘 매출
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions?.filter(t => 
          t.created_at?.startsWith(today)
        ) || [];
        todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      } catch (statusError) {
        console.warn('Failed with status filter, trying without:', statusError);
        
        try {
          // 방법 2: status 없이 모든 거래 가져오기
          const { data: allTransactions, error } = await supabase
            .from('transactions')
            .select('amount, created_at');

          if (error) throw error;

          totalRevenue = allTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
          totalTransactions = allTransactions?.length || 0;

          const today = new Date().toISOString().split('T')[0];
          const todayTransactions = allTransactions?.filter(t => 
            t.created_at?.startsWith(today)
          ) || [];
          todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        } catch (allError) {
          console.warn('Failed to load transactions completely:', allError);
        }
      }

      // 4. 대기 중인 신고
      let pendingReports = 0;
      try {
        console.log('🔍 [Admin] Fetching pending reports...');
        const { data, count, error: reportsError } = await supabase
          .from('reports')
          .select('*, reporter:profiles!reports_reporter_id_fkey(handle), reported:profiles!reports_reported_id_fkey(handle)', { count: 'exact' })
          .eq('status', 'pending');
        
        if (reportsError) {
          console.error('❌ [Admin] Failed to load reports:', reportsError);
          throw reportsError;
        }
        
        pendingReports = count || 0;
        console.log(`✅ [Admin] Found ${pendingReports} pending reports`);
        if (data && data.length > 0) {
          console.log('📋 [Admin] Sample report:', data[0]);
        }
      } catch (error) {
        console.warn('⚠️ [Admin] Failed to load pending reports:', error);
      }

      // 5. 활성 사용자 (지난 7일)
      let activeUsers = 0;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentArtworks } = await supabase
          .from('artworks')
          .select('author_id')
          .gte('created_at', sevenDaysAgo.toISOString());

        activeUsers = new Set(recentArtworks?.map(a => a.author_id) || []).size;
      } catch (error) {
        console.warn('Failed to load active users:', error);
      }

      // 6. 활성 챌린지
      let activeChallenges = 0;
      try {
        const { count } = await supabase
          .from('challenges')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        activeChallenges = count || 0;
      } catch (error) {
        console.warn('Failed to load active challenges:', error);
      }

      setStats({
        totalUsers,
        totalArtworks,
        totalTransactions,
        totalRevenue,
        pendingReports,
        activeUsers,
        todayRevenue,
        activeChallenges,
      });
    } catch (error: any) {
      console.error('통계 로드 실패:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color,
    onPress,
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.statIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const MenuButton = ({
    title,
    description,
    icon,
    color,
    onPress,
    badge,
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.menuButton,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.menuIconText, { color }]}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: isDark ? colors.darkText : colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.menuDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {description}
        </Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.menuArrow, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        →
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? colors.darkText : colors.text }]}>
          Loading admin dashboard...
        </Text>
      </View>
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
            Admin Dashboard
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStats(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

      {/* 통계 카드 */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="#3B82F6"
        />
        <StatCard
          title="Total Artworks"
          value={stats.totalArtworks}
          icon="🎨"
          color="#10B981"
        />
        <StatCard
          title="Order Management"
          value={stats.totalTransactions}
          icon="💰"
          color="#F59E0B"
          onPress={() => navigation.navigate('OrderManagement' as never)}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(0)}`}
          icon="💵"
          color="#8B5CF6"
          onPress={() => navigation.navigate('RevenueDetail' as never)}
        />
        <StatCard
          title="Reports Management"
          value={stats.pendingReports}
          icon="🚨"
          color="#EF4444"
          onPress={() => navigation.navigate('ReportsManagement' as never)}
        />
        <StatCard
          title="Active Users (7d)"
          value={stats.activeUsers}
          icon="⚡"
          color="#06B6D4"
          onPress={() => navigation.navigate('UserManagement' as never, { tab: 'active' })}
        />
        <StatCard
          title="Auction Management"
          value="Manage"
          icon="🔨"
          color="#8B5CF6"
          onPress={() => navigation.navigate('AuctionManagement' as never)}
        />
        <StatCard
          title="Active Challenges"
          value={stats.activeChallenges}
          icon="🏆"
          color="#F97316"
          onPress={() => navigation.navigate('ChallengeManagement' as never)}
        />
      </View>

      {/* 관리 메뉴 */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Management
        </Text>

        <MenuButton
          title="User Management"
          description="Ban, unban, or manage users"
          icon="👥"
          color="#3B82F6"
          onPress={() => navigation.navigate('UserManagement' as never)}
        />

        <MenuButton
          title="Artwork Management"
          description="Manage, delete, or hide artworks"
          icon="🎨"
          color="#10B981"
          onPress={() => navigation.navigate('ArtworkManagement' as never)}
        />

        <MenuButton
          title="Platform Analytics"
          description="Detailed statistics and insights"
          icon="📊"
          color="#8B5CF6"
          onPress={() => navigation.navigate('PlatformAnalytics' as never)}
        />

        <MenuButton
          title="Settlement Management"
          description="Approve or reject artist settlements"
          icon="💰"
          color="#10B981"
          onPress={() => navigation.navigate('SettlementManagement' as never)}
        />

        <MenuButton
          title="Promote to Admin"
          description="Grant or revoke admin privileges"
          icon="🛡️"
          color="#EC4899"
          onPress={() => navigation.navigate('AdminManagement' as never)}
        />
      </View>

      <View style={styles.bottomSpacer} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    zIndex: 1000,
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
    ...typography.h3,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconText: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  menuSection: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: 13,
  },
  menuArrow: {
    fontSize: 20,
    marginLeft: spacing.sm,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

