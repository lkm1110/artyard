/**
 * 결제 화면 (2Checkout + USD)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { formatPrice } from '../types/complete-system';

const CURRENCY = 'USD';

export const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { artworkId } = route.params as { artworkId: string };
  
  const [loading, setLoading] = useState(false);
  const [artwork, setArtwork] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      // 사용자 정보
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData);
      
      // 작품 정보
      const { data: artworkData } = await supabase
        .from('artworks')
        .select('*, author:profiles!artworks_author_id_fkey(*)')
        .eq('id', artworkId)
        .single();
      
      setArtwork(artworkData);
      
      // 배송지 목록
      const { data: addressData } = await supabase
        .from('shipping_addresses')
        .select('*')
        .order('is_default', { ascending: false });
      
      setAddresses(addressData || []);
      
      const defaultAddress = addressData?.find(a => a.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const getArtworkPrice = () => {
    if (!artwork) return 0;
    // artwork.price가 "$50" 또는 "50" 형식
    const priceStr = artwork.price.toString().replace(/[^\d.]/g, '');
    return parseFloat(priceStr) || 0;
  };
  
  const calculateShipping = (price: number) => {
    // $100 이상 무료 배송
    if (price >= 100) return 0;
    return 5;
  };
  
  const handlePayment = async () => {
    try {
      if (!selectedAddressId) {
        Alert.alert('Notice', 'Please select a shipping address');
        return;
      }
      
      setLoading(true);
      
      const artworkPrice = getArtworkPrice();
      const shippingFee = calculateShipping(artworkPrice);
      const platformFee = artworkPrice * 0.05;
      const paymentFee = artworkPrice * 0.035 + 0.30; // 2Checkout 3.5%
      const sellerAmount = artworkPrice - platformFee - paymentFee;
      const totalAmount = artworkPrice + shippingFee;
      
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('Address not found');
      }
      
      // Transaction 생성
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          artwork_id: artworkId,
          buyer_id: user?.id,
          seller_id: artwork.author_id,
          amount: Math.round(artworkPrice * 100), // 센트 단위
          shipping_fee: Math.round(shippingFee * 100),
          platform_fee: Math.round(platformFee * 100),
          seller_amount: Math.round(sellerAmount * 100),
          payment_method: '2checkout',
          status: 'pending',
          shipping_recipient: selectedAddress.recipient_name,
          shipping_phone: selectedAddress.phone,
          shipping_postal_code: selectedAddress.postal_code,
          shipping_address: selectedAddress.address,
          shipping_address_detail: selectedAddress.address_detail,
          shipping_country: selectedAddress.country || 'US',
          shipping_zone: 'domestic',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 프로필 정보 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', user?.id)
        .single();
      
      // 2Checkout 결제 화면으로 이동
      navigation.navigate('TwoCheckoutPayment', {
        transactionId: transaction.id,
        amount: totalAmount,
        description: `${artwork.title} by ${artwork.author.handle}`,
        buyerEmail: user?.email || '',
        buyerName: profile?.handle || 'Customer',
      });
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!artwork) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0070BA" />
      </View>
    );
  }
  
  const artworkPrice = getArtworkPrice();
  const shippingFee = calculateShipping(artworkPrice);
  const totalAmount = artworkPrice + shippingFee;
  
  return (
    <ScrollView style={styles.container}>
      {/* 작품 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.artworkInfo}>
          {artwork.images && artwork.images[0] && (
            <Image
              source={{ uri: artwork.images[0] }}
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
      
      {/* 배송지 선택 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddressForm')}>
            <Text style={styles.addButton}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        
        {addresses.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyAddressBox}
            onPress={() => navigation.navigate('AddressForm')}
          >
            <Text style={styles.emptyAddressText}>No addresses yet</Text>
            <Text style={styles.emptyAddressSubtext}>Tap to add your first address</Text>
          </TouchableOpacity>
        ) : (
          addresses.map((address) => (
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
                <Text style={styles.addressName}>{address.recipient_name}</Text>
                <Text style={styles.addressText}>
                  {address.address}
                  {address.address_detail && `, ${address.address_detail}`}
                </Text>
                <Text style={styles.addressText}>
                  {address.city && `${address.city}, `}
                  {address.state && `${address.state} `}
                  {address.postal_code}
                </Text>
                <Text style={styles.addressText}>{address.country || 'US'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
      
      {/* 금액 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Artwork</Text>
          <Text style={styles.priceValue}>{formatPrice(artworkPrice, CURRENCY)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Shipping</Text>
          <Text style={styles.priceValue}>
            {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee, CURRENCY)}
          </Text>
        </View>
        {artworkPrice >= 100 && (
          <Text style={styles.freeShippingNote}>
            🎉 Free shipping on orders over $100!
          </Text>
        )}
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalAmount, CURRENCY)}</Text>
        </View>
      </View>
      
      {/* 결제 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading || addresses.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Continue to Payment
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.secureNote}>
          <Text style={styles.secureText}>🔒 Secured by 2Checkout</Text>
          <Text style={styles.secureSubtext}>Your payment info is safe and encrypted</Text>
        </View>
      </View>
      
      {/* 안내 */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>• 7-day buyer protection</Text>
        <Text style={styles.noticeText}>• Fast worldwide shipping</Text>
        <Text style={styles.noticeText}>• Secure payment processing</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    color: '#333',
  },
  addButton: {
    color: '#0070BA',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 작품 정보
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
    color: '#333',
  },
  artworkAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  artworkPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  
  // 배송지
  emptyAddressBox: {
    padding: 30,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyAddressSubtext: {
    fontSize: 14,
    color: '#666',
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
    borderColor: '#0070BA',
    backgroundColor: '#F0F7FF',
  },
  addressRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0070BA',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0070BA',
  },
  addressContent: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    color: '#333',
  },
  freeShippingNote: {
    fontSize: 13,
    color: '#28a745',
    marginBottom: 12,
    fontWeight: '500',
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
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  
  // 결제 버튼
  payButton: {
    backgroundColor: '#0070BA',
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
  secureNote: {
    marginTop: 16,
    alignItems: 'center',
  },
  secureText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  secureSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  
  // 안내
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

