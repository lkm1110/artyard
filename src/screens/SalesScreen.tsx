/**
 * My Sales Screen (Seller)
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
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { formatPrice } from '../types/complete-system';

interface Sale {
  id: string;
  total_amount: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  created_at: string;
  buyer: {
    handle: string;
  };
  shipping_address: any;
  artwork: {
    id: string;
    title: string;
    images: string[];
    author_id: string;
  };
  tracking_number?: string;
}

export const SalesScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);

      // Step 1: 내 작품 ID 목록 가져오기
      const { data: myArtworks, error: artworksError } = await supabase
        .from('artworks')
        .select('id')
        .eq('author_id', user?.id);

      if (artworksError) {
        console.error('Artworks query error:', artworksError);
        throw artworksError;
      }

      const myArtworkIds = myArtworks?.map(a => a.id) || [];

      if (myArtworkIds.length === 0) {
        setSales([]);
        return;
      }

      // Step 2: 내 작품이 포함된 거래 조회 (단순 쿼리)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .in('artwork_id', myArtworkIds)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Transactions query error:', transactionsError);
        throw transactionsError;
      }

      if (!transactions || transactions.length === 0) {
        setSales([]);
        return;
      }

      // Step 3: 관련 데이터 병렬로 가져오기
      const salesWithDetails = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            // Buyer 정보
            let buyer = null;
            if (transaction.buyer_id) {
              const { data: buyerData } = await supabase
                .from('profiles')
                .select('handle')
                .eq('id', transaction.buyer_id)
                .maybeSingle();
              
              buyer = buyerData;
            }

            // Artwork 정보
            let artwork = null;
            if (transaction.artwork_id) {
              const { data: artworkData } = await supabase
                .from('artworks')
                .select('id, title, images, author_id')
                .eq('id', transaction.artwork_id)
                .maybeSingle();
              
              artwork = artworkData;
            }

            // Shipping address 정보
            let shipping_address = null;
            if (transaction.shipping_address_id) {
              const { data: addressData } = await supabase
                .from('shipping_addresses')
                .select('*')
                .eq('id', transaction.shipping_address_id)
                .maybeSingle();
              
              shipping_address = addressData;
            }

            return {
              ...transaction,
              buyer,
              artwork,
              shipping_address,
            };
          } catch (detailError) {
            console.warn('Failed to load detail for sale:', transaction.id, detailError);
            return {
              ...transaction,
              buyer: null,
              artwork: null,
              shipping_address: null,
            };
          }
        })
      );

      setSales(salesWithDetails);
    } catch (error: any) {
      console.error('Failed to load sales:', error);
      // 에러가 발생해도 빈 배열로 설정하여 UI가 계속 작동하도록
      setSales([]);
      Alert.alert('Error', 'Failed to load sales. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = (sale: Sale) => {
    setSelectedSale(sale);
    setTrackingNumber(sale.tracking_number || '');
    setTrackingModalVisible(true);
  };

  const handleSubmitTracking = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Notice', 'Please enter tracking number');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          tracking_number: trackingNumber,
          status: 'shipped',
        })
        .eq('id', selectedSale?.id);

      if (error) throw error;

      Alert.alert('Success', 'Tracking number updated');
      setTrackingModalVisible(false);
      loadSales();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'shipped':
        return '#3B82F6';
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Payment';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const artwork = item.artwork;

    return (
      <View
        style={[
          styles.saleCard,
          { backgroundColor: isDark ? colors.darkCard : colors.card },
        ]}
      >
        {/* Sale Header */}
        <View style={styles.saleHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={[styles.saleDate, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* 작품 정보 */}
        <View style={styles.saleContent}>
          {artwork && artwork.images?.[0] && (
            <Image
              source={{ uri: artwork.images[0] }}
              style={styles.artworkImage}
            />
          )}

          <View style={styles.saleInfo}>
            <Text
              style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}
              numberOfLines={1}
            >
              {artwork?.title || 'Unknown Artwork'}
            </Text>
            <Text style={[styles.buyerName, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              Buyer: {item.buyer?.handle || 'Unknown'}
            </Text>

            <View style={styles.amounts}>
              <Text style={[styles.amountLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Total: {formatPrice(item.total_amount, 'USD')}
              </Text>
              <Text style={[styles.amountLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Platform Fee: {formatPrice(item.platform_fee || 0, 'USD')}
              </Text>
              <Text style={[styles.sellerAmount, { color: colors.primary }]}>
                You Get: {formatPrice(item.seller_amount || (item.total_amount * 0.9), 'USD')}
              </Text>
            </View>

            {item.tracking_number && (
              <Text style={[styles.trackingNumber, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Tracking: {item.tracking_number}
              </Text>
            )}
          </View>
        </View>

        {/* 액션 */}
        {item.status === 'processing' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAddTracking(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.tracking_number ? 'Update Tracking' : 'Add Tracking Number'}
            </Text>
          </TouchableOpacity>
        )}

        {item.status === 'shipped' && (
          <View style={styles.shippedInfo}>
            <Text style={[styles.shippedText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              ✓ Shipped - Waiting for delivery confirmation
            </Text>
          </View>
        )}
      </View>
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
          My Sales
        </Text>
        <Text style={[styles.headerSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {sales.length} total sales
        </Text>
      </View>

      {/* Sales List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            No sales yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={renderSale}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Tracking Number Modal */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Enter Tracking Number
            </Text>
            <TouchableOpacity onPress={() => setTrackingModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.darkText : colors.text }]}>
              Tracking Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                },
              ]}
              placeholder="Enter tracking number..."
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitTracking}
            >
              <Text style={styles.submitButtonText}>Submit & Mark as Shipped</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  saleCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  saleHeader: {
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
  saleDate: {
    fontSize: 12,
  },
  saleContent: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  saleInfo: {
    flex: 1,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  buyerName: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  amounts: {
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  sellerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackingNumber: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  shippedInfo: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shippedText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
  },
  modalContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

