/**
 * My Orders Screen (Buyer)
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
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { formatPrice } from '../types/complete-system';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
  artwork: {
    id: string;
    title: string;
    images: string[];
    author: {
      handle: string;
    };
  };
}

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('transactions')
        .select(`
          *,
          shipping_address:shipping_addresses(*),
          artwork:artworks(
            id,
            title,
            images,
            author:profiles!artworks_author_id_fkey(handle)
          )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'refunded':
        return '#6B7280';
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const artwork = item.artwork;

    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          { backgroundColor: isDark ? colors.darkCard : colors.card },
        ]}
        onPress={() => {
          // Navigate to order detail (to be implemented)
          Alert.alert('Order Detail', `Order ID: ${item.id}`);
        }}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={[styles.orderDate, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* 작품 정보 */}
        <View style={styles.orderContent}>
          {artwork && artwork.images?.[0] && (
            <Image
              source={{ uri: artwork.images[0] }}
              style={styles.artworkImage}
            />
          )}

          <View style={styles.orderInfo}>
            <Text
              style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}
              numberOfLines={1}
            >
              {artwork?.title || 'Unknown Artwork'}
            </Text>
            <Text style={[styles.artistName, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              by {artwork?.author?.handle || 'Unknown'}
            </Text>


            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatPrice(item.total_amount, 'USD')}
            </Text>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.orderActions}>
          {item.status === 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                navigation.navigate('Review' as never, { 
                  orderId: item.id,
                  artworkId: artwork?.id,
                } as never);
              }}
            >
              <Text style={styles.actionButtonText}>Write Review</Text>
            </TouchableOpacity>
          )}

          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes',
                      onPress: async () => {
                        try {
                          await supabase
                            .from('transactions')
                            .update({ status: 'cancelled' })
                            .eq('id', item.id);
                          
                          Alert.alert('Success', 'Order cancelled');
                          loadOrders();
                        } catch (error: any) {
                          Alert.alert('Error', error.message);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.actionButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          My Orders
        </Text>
        <Text style={[styles.headerSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {orders.length} total orders
        </Text>
      </View>

      {/* 필터 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
            { backgroundColor: filter === 'all' ? colors.primary : (isDark ? colors.darkCard : colors.card) },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === 'all' ? colors.white : (isDark ? colors.darkText : colors.text) },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pending' && styles.filterButtonActive,
            { backgroundColor: filter === 'pending' ? colors.primary : (isDark ? colors.darkCard : colors.card) },
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === 'pending' ? colors.white : (isDark ? colors.darkText : colors.text) },
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'completed' && styles.filterButtonActive,
            { backgroundColor: filter === 'completed' ? colors.primary : (isDark ? colors.darkCard : colors.card) },
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === 'completed' ? colors.white : (isDark ? colors.darkText : colors.text) },
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            No orders yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterButtonActive: {},
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    padding: spacing.lg,
  },
  orderCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
  },
  orderContent: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  artistName: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  itemCount: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

