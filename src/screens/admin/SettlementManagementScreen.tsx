/**
 * Settlement Management Screen (Admin)
 * 관리자가 작가 정산을 관리하는 화면
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
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { Screen } from '../../components/Screen';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { supabase } from '../../services/supabase';

interface Settlement {
  id: string;
  artist_id: string;
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
  artist: {
    handle: string;
    avatar_url?: string;
  };
}

export const SettlementManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadSettlements();
  }, [filter]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      
      const query = supabase
        .from('settlements')
        .select(`
          *,
          artist:profiles!settlements_artist_id_fkey(handle, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query.eq('status', 'pending');
      }

      const { data, error } = await query;

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

  const handleApprove = async (settlementId: string) => {
    Alert.alert(
      'Approve Settlement',
      'Are you sure you want to approve this settlement? The artist will receive the payment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('settlements')
                .update({
                  status: 'approved',
                  approved_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', settlementId);

              if (error) throw error;

              Alert.alert('Success', 'Settlement approved successfully!');
              loadSettlements();
            } catch (error: any) {
              console.error('Approve error:', error);
              Alert.alert('Error', error.message || 'Failed to approve settlement');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (settlementId: string) => {
    Alert.prompt(
      'Reject Settlement',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const { error } = await supabase
                .from('settlements')
                .update({
                  status: 'failed',
                  reject_reason: reason || 'Rejected by admin',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', settlementId);

              if (error) throw error;

              Alert.alert('Success', 'Settlement rejected');
              loadSettlements();
            } catch (error: any) {
              console.error('Reject error:', error);
              Alert.alert('Error', error.message || 'Failed to reject settlement');
            }
          },
        },
      ],
      'plain-text'
    );
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

  const renderSettlement = ({ item }: { item: Settlement }) => (
    <View
      style={[
        styles.settlementCard,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.artistInfo}>
          <Text style={[styles.artistName, { color: isDark ? colors.darkText : colors.text }]}>
            @{item.artist.handle}
          </Text>
          <Text style={[styles.artistEmail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {item.transaction_count} transactions
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Period */}
      <Text style={[styles.period, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        📅 {formatDate(item.period_start)} - {formatDate(item.period_end)}
      </Text>

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
            Net Amount:
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
          <Text style={[styles.bankLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Bank Account:
          </Text>
          <Text style={[styles.bankText, { color: isDark ? colors.darkText : colors.text }]}>
            🏦 {item.bank_name}
          </Text>
          <Text style={[styles.bankText, { color: isDark ? colors.darkText : colors.text }]}>
            {item.account_number}
          </Text>
          <Text style={[styles.bankText, { color: isDark ? colors.darkText : colors.text }]}>
            {item.account_holder}
          </Text>
        </View>
      )}

      {/* Actions (only for pending) */}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.buttonText}>✅ Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.buttonText}>❌ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
          styles.topHeader,
          {
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
            Settlement Management
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'pending' && styles.activeFilterButton,
              { backgroundColor: filter === 'pending' ? colors.primary : (isDark ? colors.darkCard : colors.card) }
            ]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[
              styles.filterText,
              { color: filter === 'pending' ? '#FFFFFF' : (isDark ? colors.darkText : colors.text) }
            ]}>
              ⏳ Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilterButton,
              { backgroundColor: filter === 'all' ? colors.primary : (isDark ? colors.darkCard : colors.card) }
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              { color: filter === 'all' ? '#FFFFFF' : (isDark ? colors.darkText : colors.text) }
            ]}>
              📊 All
            </Text>
          </TouchableOpacity>
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
              title="No settlements"
              subtitle={filter === 'pending' ? 'No pending settlements' : 'No settlements found'}
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
  topHeader: {
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
  title: {
    fontSize: typography.sizes?.xl || 20,
    fontWeight: typography.weights?.bold as any || '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  activeFilterButton: {
    ...shadows.md,
  },
  filterText: {
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
  artistInfo: {
    flex: 1,
  },
  artistName: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistEmail: {
    ...typography.caption,
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
  period: {
    ...typography.body,
    marginBottom: spacing.md,
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
  bankLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  bankText: {
    ...typography.body,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

