/**
 * Checkout Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { createPaymentIntent } from '../services/transactionService';
import { formatPrice } from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const CURRENCY = 'USD';

export const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const { artworkId } = route.params as { artworkId: string };
  
  const [loading, setLoading] = useState(false);
  const [artwork, setArtwork] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  // Load artwork info (once)
  useEffect(() => {
    loadArtwork();
  }, []);
  
  const loadArtwork = async () => {
    try {
      console.log('🎨 Loading artwork info...');
      const { data: artworkData } = await supabase
        .from('artworks')
        .select('*, author:profiles!artworks_author_id_fkey(*)')
        .eq('id', artworkId)
        .single();
      
      setArtwork(artworkData);
      console.log('✅ Artwork info loaded');
    } catch (error: any) {
      console.error('❌ Failed to load artwork:', error);
      Alert.alert('Error', error.message);
    }
  };
  
  // Load shipping addresses (on screen focus)
  const loadAddresses = useCallback(async () => {
    try {
      console.log('📦 Loading shipping addresses...');
      const { data: addressData } = await supabase
        .from('shipping_addresses')
        .select('*')
        .order('is_default', { ascending: false });
      
      console.log('✅ Shipping addresses loaded:', addressData?.length || 0);
      setAddresses(addressData || []);
      
      // Select default address (or keep existing selection)
      if (!selectedAddressId) {
        const defaultAddress = addressData?.find(a => a.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          console.log('✅ Default address selected:', defaultAddress.id);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load shipping addresses:', error);
    }
  }, [selectedAddressId]);
  
  // Refresh shipping addresses when screen focuses
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 CheckoutScreen focus - refreshing addresses');
      loadAddresses();
    }, [loadAddresses])
  );
  
  const handlePayment = async () => {
    try {
      if (!selectedAddressId) {
        Alert.alert('Notice', 'Please select a shipping address');
        return;
      }
      
      if (!artwork) {
        Alert.alert('Error', 'Unable to load artwork information.');
        return;
      }
      
      setLoading(true);
      
      // Calculate artwork price
      const artworkPrice = parseFloat(artwork.price || '0');
      
      // Get shipping address info
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) {
        Alert.alert('Error', 'Shipping address not found.');
        setLoading(false);
        return;
      }
      
      // Calculate shipping fee (USD)
      // Domestic: $5, International: $20
      // Free shipping for orders over $100
      const isDomestic = selectedAddress.country === 'KR';
      let shippingFee = 0;
      
      if (artworkPrice < 100) {
        shippingFee = isDomestic ? 5 : 20;
      }
      
      // Platform fee (10%)
      const platformFee = artworkPrice * 0.10;
      
      // Total amount
      const totalAmount = artworkPrice + shippingFee + platformFee;
      
      // Navigate to 2Checkout payment screen
      console.log('💳 Navigating to payment:', {
        totalAmount,
        artworkPrice,
        shippingFee,
        platformFee,
        artworkTitle: artwork.title,
      });
      
      navigation.navigate('TwoCheckoutPayment' as never, {
        transactionId: `temp_${Date.now()}`, // 임시 ID (실제로는 transactionService에서 생성)
        amount: totalAmount,
        description: `${artwork.title} by ${artwork.author.handle}`,
        currency: CURRENCY,
        buyerEmail: artwork.author.email || 'buyer@artyard.com',
        buyerName: artwork.author.handle || 'Buyer',
        artworkId: artwork.id,
        shippingAddressId: selectedAddressId,
        artworkPrice: artworkPrice,
        shippingFee: shippingFee,
        platformFee: platformFee,
      } as never);
      
    } catch (error: any) {
      Alert.alert('Payment Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!artwork) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // Artwork price (USD)
  const artworkPrice = parseFloat(artwork.price || '0');
  
  // Get shipping address info
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  
  // Calculate shipping fee (USD)
  // Domestic: $5, International: $20
  // Free shipping for orders over $100
  const isDomestic = selectedAddress?.country === 'KR';
  let shippingFee = 0;
  
  if (artworkPrice < 100) {
    shippingFee = isDomestic ? 5 : 20;
  }
  
  // Platform fee (10%)
  const platformFee = artworkPrice * 0.10;
  
  // Total amount
  const totalAmount = artworkPrice + shippingFee + platformFee;
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
      {/* Header */}
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
          Purchase Artwork
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Artwork Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.artworkInfo}>
          {artwork.image_urls && artwork.image_urls[0] && (
            <Image
              source={{ uri: artwork.image_urls[0] }}
              style={styles.artworkImage}
            />
          )}
          <View style={styles.artworkDetails}>
            <Text style={styles.artworkTitle}>{artwork.title}</Text>
            <Text style={styles.artworkAuthor}>by {artwork.author.handle}</Text>
            <Text style={styles.artworkPrice}>{formatPrice(artworkPrice, CURRENCY)}</Text>
          </View>
        </View>
      </View>
      
      {/* Shipping Address */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddressForm' as never)}
          >
            <Text style={styles.addButton}>+ Add Address</Text>
          </TouchableOpacity>
        </View>
        
        {addresses.length === 0 && (
          <View style={styles.emptyAddress}>
            <Text style={styles.emptyAddressText}>No shipping address registered</Text>
            <TouchableOpacity
              style={styles.emptyAddressButton}
              onPress={() => navigation.navigate('AddressForm' as never)}
            >
              <Text style={styles.emptyAddressButtonText}>Add Shipping Address</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {addresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[
              styles.addressItem,
              selectedAddressId === address.id && styles.addressItemSelected,
            ]}
            onPress={() => setSelectedAddressId(address.id)}
          >
            <View style={styles.addressRadio}>
              {selectedAddressId === address.id && (
                <View style={styles.addressRadioInner} />
              )}
            </View>
            <View style={styles.addressContent}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{address.recipient_name}</Text>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressText}>
                [{address.postal_code}] {address.address}
              </Text>
              {address.address_detail && (
                <Text style={styles.addressText}>{address.address_detail}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentInfoBox}>
          <Text style={styles.paymentInfoTitle}>💳 2Checkout Secure Payment</Text>
          <Text style={styles.paymentInfoText}>
            You will be redirected to 2Checkout secure payment page.{'\n'}
            Credit card and debit card accepted.
          </Text>
        </View>
      </View>
      
      {/* Price Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Artwork Price</Text>
          <Text style={styles.priceValue}>{formatPrice(artworkPrice, CURRENCY)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Platform Fee (10%)</Text>
          <Text style={styles.priceValue}>{formatPrice(platformFee, CURRENCY)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            Shipping {isDomestic ? '(Domestic)' : '(International)'}
          </Text>
          <Text style={styles.priceValue}>
            {shippingFee === 0 ? 'Free' : formatPrice(shippingFee, CURRENCY)}
          </Text>
        </View>
        {artworkPrice >= 100 && (
          <Text style={styles.freeShippingNote}>
            🎉 Free shipping over $100!
          </Text>
        )}
        {artworkPrice < 100 && !isDomestic && (
          <Text style={styles.shippingNote}>
            💡 International shipping applies
          </Text>
        )}
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatPrice(totalAmount, CURRENCY)}</Text>
        </View>
      </View>
      
      {/* Payment Button */}
      <TouchableOpacity
        style={[styles.payButton, (!loading && !selectedAddressId) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading || !selectedAddressId}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay {formatPrice(totalAmount, CURRENCY)}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          • Transaction will be completed automatically if no delivery confirmation within 7 days.
        </Text>
        <Text style={styles.noticeText}>
          • You can raise a dispute if any problem occurs.
        </Text>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor는 동적으로 설정됨
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    // backgroundColor와 borderBottomColor는 동적으로 설정됨
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
    width: 40, // backButton과 동일한 너비로 중앙 정렬
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Artwork info
  artworkInfo: {
    flexDirection: 'row',
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  artworkDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artworkAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  artworkPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  
  // Shipping address
  emptyAddress: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  emptyAddressText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 16,
  },
  emptyAddressButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  addressItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressItemSelected: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF5F7',
  },
  addressRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E91E63',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E91E63',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  // 카드 입력
  card: {
    backgroundColor: '#FFFFFF',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  
  // 금액
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  freeShippingNote: {
    fontSize: 13,
    color: '#E91E63',
    marginBottom: 12,
  },
  shippingNote: {
    fontSize: 13,
    color: '#FF9800',
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  
  // Payment button
  payButton: {
    backgroundColor: '#E91E63',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Payment info notice
  paymentInfoBox: {
    backgroundColor: '#F3F8FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // Notice
  notice: {
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});

