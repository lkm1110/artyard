/**
 * Artist Dashboard Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getDashboardSummary } from '../services/analyticsService';
import {
  DashboardSummary,
  AnalyticsPeriod,
  formatPrice,
  formatNumber,
} from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

export const ArtistDashboardScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 새로고침 상태 (탭 전환시)
  
  // 데이터 캐시 (기간별로 저장)
  const [cache, setCache] = useState<Record<AnalyticsPeriod, DashboardSummary | null>>({
    daily: null,
    weekly: null,
    monthly: null,
  });
  
  useEffect(() => {
    loadData();
  }, [period]);
  
  const loadData = async () => {
    try {
      // 캐시된 데이터가 있으면 먼저 표시
      if (cache[period]) {
        setData(cache[period]);
        setLoading(false);
        setRefreshing(true); // 백그라운드 새로고침
      } else {
        setLoading(true);
      }
      
      const summary = await getDashboardSummary(period);
      setData(summary);
      
      // 캐시 업데이트
      setCache(prev => ({
        ...prev,
        [period]: summary,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 초기 로딩일 때만 로딩 화면 표시
  if (loading && !data) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // 데이터가 없으면 로딩 화면 (타입 가드)
  if (!data) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBg : colors.bg}
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={[
          styles.headerContainer,
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
            Artist Dashboard
          </Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* 기간 선택 */}
      <View style={[
        styles.periodSelector,
        { backgroundColor: isDark ? colors.darkCard : colors.card }
      ]}>
        {(['daily', 'weekly', 'monthly'] as AnalyticsPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
            disabled={refreshing && period === p}
          >
            {refreshing && period === p ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}>
                {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 핵심 지표 2x2 */}
      <View style={styles.metricsGrid}>
        {/* Likes */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>❤️ LIKES</Text>
          <Text style={styles.metricValue}>{formatNumber(data.total_likes)}</Text>
          <Text style={styles.metricSubtext}>
            Total engagement
          </Text>
        </View>
        
        {/* Sales */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>🛒 SALES</Text>
          <Text style={styles.metricValue}>{data.total_sales}</Text>
          <Text style={styles.metricSubtext}>
            Avg ${formatNumber(data.average_sale_price)}
          </Text>
        </View>
        
        {/* Revenue */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>💰 REVENUE</Text>
          <Text style={styles.metricValue}>${formatNumber(data.total_revenue)}</Text>
          <Text style={styles.metricSubtext}>
            {data.conversion_rate}% conversion
          </Text>
        </View>
        
        {/* Followers */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>👥 FOLLOWERS</Text>
          <Text style={styles.metricValue}>{formatNumber(data.total_followers)}</Text>
          <Text style={styles.metricSubtext}>
            {data.total_artworks} artworks
          </Text>
        </View>
      </View>
      
      
      {/* Top Artworks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 5 Artworks</Text>
        <Text style={[styles.metricSubtext, { marginBottom: spacing.md, color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          Ranked by likes + comments engagement
        </Text>
        {data.top_artworks.length === 0 ? (
          <Text style={[styles.metricSubtext, { textAlign: 'center', padding: spacing.lg, color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            No artworks yet. Upload your first artwork! 🎨
          </Text>
        ) : (
          data.top_artworks.map((item, index) => (
            <View key={item.artwork.id} style={styles.topArtwork}>
              <Text style={styles.topRank}>#{index + 1}</Text>
              <View style={styles.topArtworkInfo}>
                <Text style={[styles.topArtworkTitle, { color: isDark ? colors.darkText : colors.text }]}>
                  {item.artwork.title}
                </Text>
                <Text style={styles.topArtworkStats}>
                  ❤️ {formatNumber(item.likes)} · 💬 {formatNumber(item.comments)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      
      {/* Daily Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trends</Text>
        <Text style={[styles.metricSubtext, { marginBottom: spacing.md, color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          Daily likes over the last 7 days
        </Text>
        <View style={styles.chartContainer}>
          {(data.daily_stats || []).slice(-7).map((day, index) => {
            const maxLikes = Math.max(...(data.daily_stats || []).map(d => d.likes || 1));
            const height = maxLikes > 0 ? ((day.likes || 0) / maxLikes) * 120 : 6;
            
            return (
              <View key={day.date} style={styles.chartBar}>
                <View style={[styles.bar, { 
                  height: Math.max(height, 6), 
                  backgroundColor: colors.primary 
                }]} />
                <Text style={[styles.chartLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  {new Date(day.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    // backgroundColor는 동적으로 설정됨
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
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
  
  // 기간 선택
  periodSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    // backgroundColor는 동적으로 설정됨
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#E91E63',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  
  // 핵심 지표 (개선된 디자인)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    width: (width - spacing.md * 2 - spacing.md) / 2, // padding (32px) + gap (16px) 제외
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: spacing.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: spacing.xs,
    fontFamily: typography.bold,
  },
  metricSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  changeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  changeBadgePositive: {
    backgroundColor: '#D1FAE5',
  },
  changeBadgeNegative: {
    backgroundColor: '#FEE2E2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.bold,
  },
  changeTextPositive: {
    color: '#059669',
  },
  changeTextNegative: {
    color: '#DC2626',
  },
  
  // 섹션 (개선된 디자인)
  section: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: typography.bold,
    color: '#1C1C1E',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  
  // 인게이지먼트
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  engagementItem: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#999',
  },
  
  // Top artworks (개선된 디자인)
  topArtwork: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topRank: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    width: 48,
    fontFamily: typography.bold,
  },
  topArtworkInfo: {
    flex: 1,
  },
  topArtworkTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.medium,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  topArtworkStats: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  
  // 차트 (개선된 디자인)
  chartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    minHeight: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  chartLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

