/**
 * Auction Detail Screen
 * 경매 상세 & 입찰
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';
import { ConfirmModal } from '../components/ConfirmModal';

const { width: screenWidth } = Dimensions.get('window');

interface AuctionItem {
  id: string;
  auction_id: string;
  artwork: any;
  artist: any;
  starting_price: number;
  current_price: number;
  buyout_price?: number;
  highest_bidder_id?: string;
  highest_bid_amount?: number;
  bids_count: number;
  is_sold: boolean;
  sold_price?: number;
  views_count: number;
  watchers_count: number;
}

export const AuctionDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { auctionId } = route.params as { auctionId: string };
  const { user } = useAuthStore();
  const isDark = useColorScheme() === 'dark';
  
  const [auction, setAuction] = useState<any>(null);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Bidding state
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  
  // Modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [bidConfirmVisible, setBidConfirmVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    loadAuctionData();
  }, [auctionId]);
  
  // Countdown Timer
  useEffect(() => {
    if (!auction?.end_date) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_date).getTime();
      const distance = end - now;
      
      if (distance < 0) {
        setTimeRemaining('Auction Ended');
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [auction?.end_date]);
  
  const loadAuctionData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 1. 경매 정보
      const { data: auctionData, error: auctionError } = await supabase
        .from('challenge_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();
      
      if (auctionError) throw auctionError;
      setAuction(auctionData);
      
      // 2. 경매 아이템
      const { data: itemsData, error: itemsError } = await supabase
        .from('auction_items')
        .select(`
          *,
          artwork:artworks(*),
          artist:profiles!auction_items_artist_id_fkey(*)
        `)
        .eq('auction_id', auctionId)
        .order('current_price', { ascending: false });
      
      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error: any) {
      console.error('Failed to load auction:', error);
      setErrorMessage(error.message || 'Failed to load auction');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleBidPress = (item: AuctionItem) => {
    if (!user) {
      setErrorMessage('Please login to place a bid');
      setErrorModalVisible(true);
      return;
    }
    
    if (auction?.status !== 'active') {
      setErrorMessage('This auction is not active');
      setErrorModalVisible(true);
      return;
    }
    
    if (item.is_sold) {
      setErrorMessage('This item has been sold');
      setErrorModalVisible(true);
      return;
    }
    
    setSelectedItem(item);
    const minBid = (item.current_price + 1).toFixed(2);
    setBidAmount(minBid);
    setBidConfirmVisible(true);
  };
  
  const executeBid = async () => {
    if (!selectedItem || !user) return;
    
    try {
      setBidding(true);
      
      const amount = parseFloat(bidAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }
      
      if (amount <= selectedItem.current_price) {
        throw new Error(`Bid must be higher than current price ($${selectedItem.current_price})`);
      }
      
      // 입찰
      const { error } = await supabase
        .from('auction_bids')
        .insert({
          auction_item_id: selectedItem.id,
          bidder_id: user.id,
          bid_amount: amount,
          bid_type: 'normal',
        });
      
      if (error) throw error;
      
      setSuccessMessage(`Bid placed successfully! Your bid: $${amount}`);
      setSuccessModalVisible(true);
      setBidConfirmVisible(false);
      setSelectedItem(null);
      setBidAmount('');
      
      // 새로고침
      loadAuctionData(true);
    } catch (error: any) {
      console.error('Bid failed:', error);
      setErrorMessage(error.message || 'Failed to place bid');
      setErrorModalVisible(true);
    } finally {
      setBidding(false);
    }
  };
  
  const handlePayment = (item: AuctionItem) => {
    if (!user) {
      setErrorMessage('Please login to proceed with payment');
      setErrorModalVisible(true);
      return;
    }
    
    // 결제 화면으로 이동
    navigation.navigate('Checkout' as never, {
      artwork: item.artwork,
      finalPrice: item.current_price,
      shippingFee: 30, // 기본 배송비
      isAuction: true,
      auctionItemId: item.id,
    } as never);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBackground : colors.background}
      />
      
      {/* Header with Back Button */}
      <View style={[
        styles.navigationHeader,
        { 
          backgroundColor: isDark ? colors.darkCard : colors.card,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? colors.darkText : colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.navigationTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Auction Detail
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAuctionData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Auction Header */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
            {auction?.title}
          </Text>
          <Text style={[styles.quarter, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {auction?.quarter}
          </Text>
          
          {/* Countdown Timer */}
          {timeRemaining && (
            <View style={[
              styles.timerBadge, 
              { 
                backgroundColor: timeRemaining === 'Auction Ended' ? colors.error + '20' : colors.primary + '20',
              }
            ]}>
              <Ionicons 
                name={timeRemaining === 'Auction Ended' ? 'close-circle' : 'time-outline'} 
                size={18} 
                color={timeRemaining === 'Auction Ended' ? colors.error : colors.primary} 
              />
              <Text style={[
                styles.timerText, 
                { color: timeRemaining === 'Auction Ended' ? colors.error : colors.primary }
              ]}>
                {timeRemaining === 'Auction Ended' ? 'Auction Ended' : `Ends in: ${timeRemaining}`}
              </Text>
            </View>
          )}
          
          {auction?.description && (
            <Text style={[styles.description, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {auction.description}
            </Text>
          )}
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {items.length}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Artworks
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {auction?.total_bids || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Total Bids
              </Text>
            </View>
          </View>
          
          <View style={[styles.commissionBadge, { backgroundColor: `${colors.success}20` }]}>
            <Ionicons name="information-circle" size={16} color={colors.success} />
            <Text style={[styles.commissionText, { color: colors.success }]}>
              10% platform commission • 90% to artist
            </Text>
          </View>
        </View>
        
        {/* Auction Items */}
        <View style={styles.itemsList}>
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}
            >
              {/* Artwork Image */}
              {item.artwork?.images?.[0] && (
                <Image
                  source={{ uri: item.artwork.images[0] }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              )}
              
              {/* Sold Badge */}
              {item.is_sold && (
                <View style={[styles.soldBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              )}
              
              {/* Item Info */}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: isDark ? colors.darkText : colors.text }]}>
                  {item.artwork?.title}
                </Text>
                <Text style={[styles.artistName, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  by @{item.artist?.handle}
                </Text>
                
                {/* Artwork Size */}
                {item.artwork?.size && (
                  <View style={styles.artworkMetaRow}>
                    <Ionicons name="resize-outline" size={14} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                    <Text style={[styles.artworkMetaText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      {item.artwork.size}
                    </Text>
                  </View>
                )}
                
                {/* Artwork Description */}
                {item.artwork?.description && (
                  <TouchableOpacity
                    style={styles.descriptionContainer}
                    onPress={() => {
                      setSelectedDescription(item.artwork.description);
                      setDescriptionModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text 
                      style={[styles.artworkDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.artwork.description}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      Current Bid
                    </Text>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>
                      ${item.current_price.toLocaleString()}
                    </Text>
                  </View>
                  
                  {item.buyout_price && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                        Buy Now
                      </Text>
                      <Text style={[styles.priceValue, { color: colors.success }]}>
                        ${item.buyout_price.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemStats}>
                  <View style={styles.itemStat}>
                    <Ionicons name="people-outline" size={14} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                    <Text style={[styles.itemStatText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      {item.bids_count} bids
                    </Text>
                  </View>
                  {item.highest_bidder_id === user?.id && (
                    <View style={[styles.highestBidderBadge, { backgroundColor: `${colors.success}20` }]}>
                      <Text style={[styles.highestBidderText, { color: colors.success }]}>
                        Your highest bid
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Action Buttons */}
                {!item.is_sold && auction?.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.bidButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleBidPress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bidButtonText}>Place Bid</Text>
                  </TouchableOpacity>
                )}
                
                {/* 경매 종료 후 결제 버튼 - 최고 입찰자만 표시 */}
                {!item.is_sold && 
                 timeRemaining === 'Auction Ended' && 
                 item.highest_bidder_id === user?.id && (
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.success }]}
                    onPress={() => handlePayment(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.paymentButtonText}>결제하기 (${item.current_price.toLocaleString()})</Text>
                  </TouchableOpacity>
                )}
                
                {item.is_sold && (
                  <View style={[styles.soldInfo, { backgroundColor: `${colors.error}10` }]}>
                    <Text style={[styles.soldInfoText, { color: colors.error }]}>
                      Sold for ${item.sold_price?.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Modals */}
      <SuccessModal
        visible={successModalVisible}
        title="Success"
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
      />
      
      <ErrorModal
        visible={errorModalVisible}
        title="Error"
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
      
      {/* Description Modal */}
      <ConfirmModal
        visible={descriptionModalVisible}
        title="Artwork Description"
        message={selectedDescription}
        onConfirm={() => setDescriptionModalVisible(false)}
        confirmText="Close"
        iconName="document-text-outline"
        iconColor={colors.primary}
      />
      
      <ConfirmModal
        visible={bidConfirmVisible}
        title="Place Your Bid"
        message={`Current bid: $${selectedItem?.current_price}\nMinimum bid: $${selectedItem ? (selectedItem.current_price + 1).toFixed(2) : '0'}`}
        onConfirm={executeBid}
        onCancel={() => {
          setBidConfirmVisible(false);
          setSelectedItem(null);
          setBidAmount('');
        }}
        confirmText="Place Bid"
        cancelText="Cancel"
        confirmColor={colors.primary}
        iconName="cash-outline"
        iconColor={colors.primary}
        isProcessing={bidding}
      >
        <TextInput
          style={[
            styles.bidInput,
            {
              backgroundColor: isDark ? colors.darkBackground : colors.white,
              color: isDark ? colors.darkText : colors.text,
              borderColor: isDark ? colors.darkBorder : colors.border,
            }
          ]}
          placeholder="Enter bid amount"
          placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
          value={bidAmount}
          onChangeText={setBidAmount}
          keyboardType="numeric"
          editable={!bidding}
        />
      </ConfirmModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationHeader: {
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
  navigationTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  quarter: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
  },
  commissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  commissionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  itemsList: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  itemCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  itemImage: {
    width: '100%',
    height: screenWidth - (spacing.lg * 2),
    backgroundColor: colors.border,
  },
  soldBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  soldText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  itemInfo: {
    padding: spacing.lg,
  },
  itemTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  artistName: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  artworkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  artworkMetaText: {
    fontSize: typography.sizes.sm,
  },
  descriptionContainer: {
    marginBottom: spacing.sm,
  },
  artworkDescription: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  priceSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.body,
  },
  priceValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemStatText: {
    ...typography.caption,
  },
  highestBidderBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  highestBidderText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bidButton: {
    width: '100%',
    paddingVertical: spacing.md, // lg에서 md로 축소
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  paymentButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timerText: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  soldInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  soldInfoText: {
    ...typography.body,
    fontWeight: '600',
  },
  bidInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    ...typography.body,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

