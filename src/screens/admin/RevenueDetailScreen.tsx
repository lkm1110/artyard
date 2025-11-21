/**
 * Revenue Detail Screen
 * - Today, Weekly, Monthly, Total revenue
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
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

type PeriodType = 'today' | 'weekly' | 'monthly' | 'total';

interface RevenueData {
  period: string;
  amount: number;
  transactions: number;
  avgTransaction: number;
}

export const RevenueDetailScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [revenueData, setRevenueData] = useState<RevenueData>({
    period: 'Today',
    amount: 0,
    transactions: 0,
    avgTransaction: 0,
  });

  useEffect(() => {
    loadRevenue();
  }, [selectedPeriod]);

  const loadRevenue = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let startDate: Date;
      let periodLabel: string;

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          periodLabel = 'Today';
          break;
        case 'weekly':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          periodLabel = 'Last 7 Days';
          break;
        case 'monthly':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          periodLabel = 'Last 30 Days';
          break;
        case 'total':
          startDate = new Date(0); // All time
          periodLabel = 'All Time';
          break;
        default:
          startDate = new Date();
          periodLabel = 'Today';
      }

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalAmount = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      setRevenueData({
        period: periodLabel,
        amount: totalAmount,
        transactions: totalTransactions,
        avgTransaction,
      });
    } catch (error: any) {
      console.error('Failed to load revenue:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const PeriodButton = ({ period, label }: { period: PeriodType; label: string }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        {
          backgroundColor: selectedPeriod === period
            ? colors.primary
            : isDark
            ? colors.darkCard
            : colors.card,
        },
      ]}
      onPress={() => setSelectedPeriod(period)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.periodButtonText,
          {
            color: selectedPeriod === period
              ? colors.white
              : isDark
              ? colors.darkText
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
            Revenue Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRevenue(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <PeriodButton period="today" label="Today" />
            <PeriodButton period="weekly" label="Weekly" />
            <PeriodButton period="monthly" label="Monthly" />
            <PeriodButton period="total" label="Total" />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* Main Revenue Card */}
              <View style={[
                styles.mainCard,
                { backgroundColor: isDark ? colors.darkCard : colors.card }
              ]}>
                <Text style={[styles.periodLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  {revenueData.period}
                </Text>
                <Text style={[styles.revenueAmount, { color: colors.primary }]}>
                  ${revenueData.amount.toFixed(2)}
                </Text>
                <Text style={[styles.revenueLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Total Revenue
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={[
                  styles.statCard,
                  { backgroundColor: isDark ? colors.darkCard : colors.card }
                ]}>
                  <Text style={[styles.statIcon]}>💰</Text>
                  <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                    {revenueData.transactions}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Transactions
                  </Text>
                </View>

                <View style={[
                  styles.statCard,
                  { backgroundColor: isDark ? colors.darkCard : colors.card }
                ]}>
                  <Text style={[styles.statIcon]}>📊</Text>
                  <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                    ${revenueData.avgTransaction.toFixed(2)}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Avg Transaction
                  </Text>
                </View>
              </View>
            </>
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
  container: {
    flex: 1,
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
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
  },
  loadingContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  mainCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    marginBottom: spacing.xs,
  },
  revenueAmount: {
    fontSize: 48,
    fontWeight: typography.weights.bold as any,
    marginVertical: spacing.sm,
  },
  revenueLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    textAlign: 'center',
  },
});

