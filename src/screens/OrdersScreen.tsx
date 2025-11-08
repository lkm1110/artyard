/**
 * My Orders Screen (Buyer) - Simplified
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders } from '../services/transactionService';
import { formatCurrency } from '../services/paymentService';
import { getTransactionStatusLabel, getTransactionStatusColor } from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Transaction } from '../types/transaction';

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Transaction[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetail' as never, { transactionId: orderId } as never);
  };

  const handleChatWithSeller = (sellerId: string) => {
    navigation.navigate('Chat' as never, { userId: sellerId } as never);
  };

  const theme = {
    bg: isDark ? colors.darkBackground : colors.white,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    card: isDark ? colors.darkCard : colors.white,
    border: isDark ? colors.darkBorder : colors.border,
  };

  const renderOrder = ({ item }: { item: Transaction }) => {
    const statusColor = getTransactionStatusColor(item.status);
    const statusLabel = getTransactionStatusLabel(item.status);

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => handleOrderPress(item.id)}
      >
        {/* Artwork Image */}
        {item.artwork?.image_url && (
          <Image
            source={{ uri: item.artwork.image_url }}
            style={styles.artworkImage}
          />
        )}

        <View style={styles.orderInfo}>
          {/* Artwork Title */}
          <Text style={[styles.artworkTitle, { color: theme.text }]} numberOfLines={1}>
            {item.artwork?.title || 'Artwork'}
          </Text>

          {/* Artist */}
          <Text style={[styles.artistName, { color: theme.textSecondary }]} numberOfLines={1}>
            by {item.seller?.full_name || item.seller?.handle || 'Artist'}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          {/* Price */}
          <Text style={[styles.price, { color: theme.text }]}>
            {formatCurrency(item.amount, 'KRW')}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {item.status === 'paid' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleChatWithSeller(item.seller_id);
                  }}
                >
                  <Ionicons name="chatbubble" size={16} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    Chat with Artist
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }, styles.centerContent]}>
        <Ionicons name="cart-outline" size={80} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No Orders Yet
        </Text>
        <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
          Your purchase history will appear here
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('MainApp' as never)}
        >
          <Text style={styles.browseButtonText}>Browse Artworks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.infoLight }]}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={[styles.infoBannerText, { color: theme.text }]}>
          Chat with artists to arrange shipping and delivery
        </Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoBannerText: {
    ...typography.body,
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  orderCard: {
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
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  artworkTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  artistName: {
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
  price: {
    ...typography.h4,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
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
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
