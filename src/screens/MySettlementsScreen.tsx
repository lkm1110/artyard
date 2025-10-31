/**
 * My Settlements Screen (Artist)
 * 작가가 자신의 정산 내역을 확인하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_sales_amount: number;
  platform_fee: number;
  payment_fee: number;
  net_amount: number;
  transaction_count: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  created_at: string;
  approved_at?: string;
  completed_at?: string;
  reject_reason?: string;
}

export const MySettlementsScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('artist_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSettlements(data || []);
    } catch (error: any) {
      console.error('Load settlements error:', error);
      Alert.alert('Error', error.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettlements();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.info;
      case 'processing': return colors.info;
      case 'completed': return colors.success;
      case 'failed': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'processing': return '⏳';
      case 'completed': return '💰';
      case 'failed': return '❌';
      default: return '📝';
    }
  };

  // 총 정산액 계산
  const totalEarnings = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.net_amount, 0);

  const pendingAmount = settlements
    .filter(s => s.status === 'pending' || s.status === 'approved' || s.status === 'processing')
    .reduce((sum, s) => sum + s.net_amount, 0);

  const renderSettlement = ({ item }: { item: Settlement }) => (
    <TouchableOpacity
      style={[
        styles.settlementCard,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.periodInfo}>
          <Text style={[styles.periodText, { color: isDark ? colors.darkText : colors.text }]}>
            📅 {formatDate(item.period_start)} - {formatDate(item.period_end)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)} {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.amounts}>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Total Sales:
          </Text>
          <Text style={[styles.amountValue, { color: isDark ? colors.darkText : colors.text }]}>
            {formatCurrency(item.total_sales_amount)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Platform Fee (10%):
          </Text>
          <Text style={[styles.amountValue, { color: colors.error }]}>
            -{formatCurrency(item.platform_fee)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Payment Fee (3%):
          </Text>
          <Text style={[styles.amountValue, { color: colors.error }]}>
            -{formatCurrency(item.payment_fee)}
          </Text>
        </View>
        <View style={[styles.amountRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: isDark ? colors.darkText : colors.text }]}>
            You Receive:
          </Text>
          <Text style={[styles.totalValue, { color: colors.success }]}>
            {formatCurrency(item.net_amount)}
          </Text>
        </View>
      </View>

      {/* Transactions Count */}
      <Text style={[styles.transactions, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        📦 {item.transaction_count} transactions
      </Text>

      {/* Bank Info */}
      {item.bank_name && (
        <View style={[styles.bankInfo, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
          <Text style={[styles.bankText, { color: isDark ? colors.darkText : colors.text }]}>
            🏦 {item.bank_name} • {item.account_number}
          </Text>
        </View>
      )}

      {/* Reject Reason */}
      {item.status === 'failed' && item.reject_reason && (
        <View style={[styles.rejectBox, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.rejectLabel, { color: colors.error }]}>
            ❌ Rejection Reason:
          </Text>
          <Text style={[styles.rejectText, { color: colors.error }]}>
            {item.reject_reason}
          </Text>
        </View>
      )}

      {/* Dates */}
      <View style={styles.dates}>
        {item.approved_at && (
          <Text style={[styles.dateText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            ✅ Approved: {formatDate(item.approved_at)}
          </Text>
        )}
        {item.completed_at && (
          <Text style={[styles.dateText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            💰 Completed: {formatDate(item.completed_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen>
        <LoadingSpinner />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
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
            My Settlements
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <Text style={[styles.summaryTitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            💰 Total Earnings
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            {formatCurrency(totalEarnings)}
          </Text>

          {pendingAmount > 0 && (
            <View style={styles.pendingInfo}>
              <Text style={[styles.pendingLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                ⏳ Pending:
              </Text>
              <Text style={[styles.pendingAmount, { color: colors.warning }]}>
                {formatCurrency(pendingAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* List */}
        <FlatList
          data={settlements}
          renderItem={renderSettlement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No settlements yet"
              subtitle="Your settlements will appear here once you make sales"
              icon="💰"
            />
          }
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  summary: {
    padding: spacing.xl,
    margin: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    alignItems: 'center',
  },
  summaryTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    ...typography.h1,
    fontWeight: '700',
  },
  pendingInfo: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pendingLabel: {
    ...typography.body,
  },
  pendingAmount: {
    ...typography.body,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  settlementCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  periodInfo: {
    flex: 1,
  },
  periodText: {
    ...typography.body,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  amounts: {
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  amountLabel: {
    ...typography.body,
  },
  amountValue: {
    ...typography.body,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.card,
  },
  totalLabel: {
    ...typography.h4,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  transactions: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  bankInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  bankText: {
    ...typography.body,
  },
  rejectBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  rejectLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  rejectText: {
    ...typography.body,
  },
  dates: {
    marginTop: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    marginBottom: 2,
  },
});

