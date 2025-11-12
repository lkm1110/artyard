/**
 * My Sales Screen (Seller) - Simplified
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMySales } from '../services/transactionService';
import { formatCurrency } from '../services/paymentService';
import { getTransactionStatusLabel, getTransactionStatusColor } from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Transaction } from '../types/transaction';

export const SalesScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState<Transaction[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadSales();
    }, [])
  );

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await getMySales();
      
      // 🔍 DEBUG: Check for duplicates
      console.log('💰 Total sales fetched:', data.length);
      console.log('💰 Sale IDs:', data.map(s => s.id));
      
      // 중복 제거 (ID 기준)
      const uniqueSales = data.filter((sale, index, self) =>
        index === self.findIndex((s) => s.id === sale.id)
      );
      
      console.log('💰 Unique sales:', uniqueSales.length);
      console.log('💰 Removed duplicates:', data.length - uniqueSales.length);
      
      setSales(uniqueSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  const handleSalePress = (saleId: string) => {
    navigation.navigate('SaleDetail' as never, { transactionId: saleId } as never);
  };

  const handleChatWithBuyer = (buyerId: string) => {
    navigation.navigate('Chat' as never, { userId: buyerId } as never);
  };

  const theme = {
    bg: isDark ? colors.darkBackground : colors.white,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    card: isDark ? colors.darkCard : colors.white,
    border: isDark ? colors.darkBorder : colors.border,
  };

  const renderSale = ({ item }: { item: Transaction }) => {
    const statusColor = getTransactionStatusColor(item.status);
    const statusLabel = getTransactionStatusLabel(item.status);
    const isNew = item.status === 'paid';

    return (
      <TouchableOpacity
        style={[styles.saleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => handleSalePress(item.id)}
      >
        {/* New Badge */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Artwork Image */}
        {item.artwork?.image_url && (
          <Image
            source={{ uri: item.artwork.image_url }}
            style={styles.artworkImage}
          />
        )}

        <View style={styles.saleInfo}>
          {/* Artwork Title */}
          <Text style={[styles.artworkTitle, { color: theme.text }]} numberOfLines={1}>
            {item.artwork?.title || 'Artwork'}
          </Text>

          {/* Buyer */}
          <Text style={[styles.buyerName, { color: theme.textSecondary }]} numberOfLines={1}>
            Sold to {item.buyer?.full_name || item.buyer?.handle || 'Buyer'}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          {/* Earnings */}
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>
              Your Earnings:
            </Text>
            <Text style={[styles.earningsValue, { color: colors.success }]}>
              {formatCurrency(item.seller_amount, 'KRW')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {item.status === 'paid' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleChatWithBuyer(item.buyer_id);
                }}
              >
                <Ionicons name="chatbubble" size={16} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Chat with Buyer
                </Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <View style={[styles.confirmedBadge, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.confirmedText, { color: colors.success }]}>
                  Paid Out
                </Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  // Calculate total earnings
  const totalEarnings = sales
    .filter((sale) => sale.status === 'confirmed')
    .reduce((sum, sale) => sum + sale.seller_amount, 0);

  const pendingEarnings = sales
    .filter((sale) => sale.status === 'paid')
    .reduce((sum, sale) => sum + sale.seller_amount, 0);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Sales</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.container, { backgroundColor: theme.bg }, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (sales.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Sales</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.container, { backgroundColor: theme.bg }, styles.centerContent]}>
          <Ionicons name="cash-outline" size={80} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Sales Yet
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            Your sales will appear here when someone purchases your artwork
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Sales</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Earnings Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Total Earnings
          </Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {formatCurrency(totalEarnings, 'KRW')}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            In Escrow
          </Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {formatCurrency(pendingEarnings, 'KRW')}
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.infoLight }]}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={[styles.infoBannerText, { color: theme.text }]}>
          Chat with buyers to arrange shipping. Payment released after delivery confirmation.
        </Text>
      </View>

      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
        />
      }
    />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoBannerText: {
    ...typography.caption,
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  saleCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  newBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  saleInfo: {
    flex: 1,
  },
  artworkTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  buyerName: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  earningsLabel: {
    ...typography.caption,
    marginRight: spacing.xs,
  },
  earningsValue: {
    ...typography.body,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  confirmedText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    textAlign: 'center',
  },
});
