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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDashboardSummary } from '../services/analyticsService';
import {
  DashboardSummary,
  AnalyticsPeriod,
  formatPrice,
  formatNumber,
} from '../types/complete-system';

const { width } = Dimensions.get('window');

export const ArtistDashboardScreen = () => {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [period]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await getDashboardSummary(period);
      setData(summary);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artist Dashboard</Text>
      </View>

      {/* 기간 선택 */}
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as AnalyticsPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[
              styles.periodText,
              period === p && styles.periodTextActive,
            ]}>
              {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 핵심 지표 */}
      <View style={styles.metricsGrid}>
        {/* Views */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Views</Text>
          <Text style={styles.metricValue}>{formatNumber(data.total_views)}</Text>
          {data.views_change !== 0 && (
            <View style={[
              styles.changeBadge,
              data.views_change > 0 ? styles.changeBadgePositive : styles.changeBadgeNegative,
            ]}>
              <Text style={[
                styles.changeText,
                data.views_change > 0 ? styles.changeTextPositive : styles.changeTextNegative,
              ]}>
                {data.views_change > 0 ? '↑' : '↓'} {Math.abs(data.views_change)}%
              </Text>
            </View>
          )}
        </View>
        
        {/* Sales */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sales</Text>
          <Text style={styles.metricValue}>{data.total_sales}</Text>
          <Text style={styles.metricSubtext}>
            Avg {formatPrice(data.average_sale_price)}
          </Text>
        </View>
        
        {/* Revenue */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={styles.metricValue}>${formatNumber(data.total_revenue)}</Text>
          <Text style={styles.metricSubtext}>
            Conversion {data.conversion_rate}%
          </Text>
        </View>
        
        {/* Followers */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Followers</Text>
          <Text style={styles.metricValue}>{formatNumber(data.total_followers)}</Text>
          {data.followers_change !== 0 && (
            <View style={[
              styles.changeBadge,
              data.followers_change > 0 ? styles.changeBadgePositive : styles.changeBadgeNegative,
            ]}>
              <Text style={[
                styles.changeText,
                data.followers_change > 0 ? styles.changeTextPositive : styles.changeTextNegative,
              ]}>
                {data.followers_change > 0 ? '↑' : '↓'} {Math.abs(data.followers_change)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Engagement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement</Text>
        <View style={styles.engagementStats}>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>
              ❤️ {formatNumber(data.total_likes)}
            </Text>
            <Text style={styles.engagementLabel}>Likes</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>
              💬 {formatNumber(data.total_comments)}
            </Text>
            <Text style={styles.engagementLabel}>Comments</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>
              🔖 {formatNumber(data.total_bookmarks)}
            </Text>
            <Text style={styles.engagementLabel}>Bookmarks</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>
              📊 {data.engagement_rate}%
            </Text>
            <Text style={styles.engagementLabel}>Rate</Text>
          </View>
        </View>
      </View>
      
      {/* Top Artworks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 5 Artworks</Text>
        {data.top_artworks.map((item, index) => (
          <View key={item.artwork.id} style={styles.topArtwork}>
            <Text style={styles.topRank}>#{index + 1}</Text>
            <View style={styles.topArtworkInfo}>
              <Text style={styles.topArtworkTitle}>{item.artwork.title}</Text>
              <Text style={styles.topArtworkStats}>
                👁️ {formatNumber(item.views)} · ❤️ {formatNumber(item.likes)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Daily Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trends</Text>
        <View style={styles.chartContainer}>
          {(data.daily_stats || []).slice(-7).map((day, index) => {
            const maxViews = Math.max(...(data.daily_stats || []).map(d => d.views));
            const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
            
            return (
              <View key={day.date} style={styles.chartBar}>
                <View style={[styles.bar, { height: `${height}%` }]} />
                <Text style={styles.chartLabel}>
                  {new Date(day.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  // 기간 선택
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
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
  
  // 핵심 지표
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  metricCard: {
    width: (width - 32) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#666',
  },
  changeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  changeBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  changeBadgeNegative: {
    backgroundColor: '#FFEBEE',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeTextPositive: {
    color: '#4CAF50',
  },
  changeTextNegative: {
    color: '#F44336',
  },
  
  // 섹션
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  
  // Top artworks
  topArtwork: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    width: 40,
  },
  topArtworkInfo: {
    flex: 1,
  },
  topArtworkTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  topArtworkStats: {
    fontSize: 13,
    color: '#666',
  },
  
  // 차트
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});

