/**
 * Checkout Screen - Simplified Marketplace Model
 * Shipping arranged directly between buyer and seller
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
  TextInput,
  Linking,
  Platform,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { createPaymentIntent } from '../services/transactionService';
import { create2CheckoutPayment, formatCurrency } from '../services/paymentService';
import { calculateFees } from '../types/transaction';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const { artworkId } = route.params as { artworkId: string };
  
  const [loading, setLoading] = useState(false);
  const [artwork, setArtwork] = useState<any>(null);
  
  // Optional contact info for seller reference
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  useEffect(() => {
    loadArtwork();
  }, []);
  
  const loadArtwork = async () => {
    try {
      const { data: artworkData } = await supabase
        .from('artworks')
        .select('*, author:profiles!artworks_author_id_fkey(*)')
        .eq('id', artworkId)
        .single();
      
      setArtwork(artworkData);
      
      // Load current user's profile info for pre-filling
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setContactName(profile.full_name || '');
          setContactPhone(profile.phone || '');
        }
      }
    } catch (error: any) {
      console.error('Error loading artwork:', error);
      Alert.alert('Error', 'Failed to load artwork information');
    }
  };
  
  const handlePurchase = async () => {
    try {
      if (!artwork) {
        Alert.alert('Error', 'Artwork information not loaded');
        return;
      }
      
      setLoading(true);
      
      // Parse sale price
      const salePrice = parseInt(artwork.price.replace(/\D/g, ''));
      
      // Calculate fees
      const fees = calculateFees(salePrice);
      
      // Create transaction
      const { transaction_id } = await createPaymentIntent({
        artwork_id: artworkId,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_address: contactAddress,
        delivery_notes: deliveryNotes,
      });
      
      // Get user email for payment
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create 2Checkout payment
      const { payment_url } = await create2CheckoutPayment({
        transaction_id,
        amount: salePrice,
        currency: 'USD',
        buyer_email: user?.email || '',
        buyer_name: contactName || 'Buyer',
        artwork_title: artwork.title,
        artwork_id: artwork.id,
        artwork_image_url: artwork.images?.[0],
        seller_id: artwork.author_id,
      });
      
      // Open 2Checkout payment page
      const supported = await Linking.canOpenURL(payment_url);
      if (supported) {
        await Linking.openURL(payment_url);
        // 사용자는 2Checkout 페이지에서 결제 완료 후 x_receipt_link_url로 돌아옴
        // artyard://payment-success?txId=... 로 자동 리다이렉트됨
        console.log('✅ Payment page opened, waiting for user to complete payment...');
      } else {
        throw new Error('Cannot open payment page');
      }
      
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };
  
  if (!artwork) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  const salePrice = parseInt(artwork.price.replace(/\D/g, ''));
  const fees = calculateFees(salePrice);
  
  const theme = {
    bg: isDark ? colors.darkBackground : colors.white,
    text: isDark ? colors.darkText : colors.text,
    textSecondary: isDark ? colors.darkTextMuted : colors.textMuted,
    border: isDark ? colors.darkBorder : colors.border,
    card: isDark ? colors.darkCard : colors.white,
  };
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Checkout
          </Text>
          <View style={styles.headerSpacer} />
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Artwork Preview */}
        <View style={[styles.artworkCard, { backgroundColor: theme.card }]}>
          <Image source={{ uri: artwork.image_url }} style={styles.artworkImage} />
          <View style={styles.artworkInfo}>
            <Text style={[styles.artworkTitle, { color: theme.text }]}>
              {artwork.title}
            </Text>
            <Text style={[styles.artistName, { color: theme.textSecondary }]}>
              by {artwork.artist_name || artwork.author?.handle || 'Unknown Artist'}
            </Text>
          </View>
        </View>
        
        {/* Price Breakdown */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Price Details
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Sale Price
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              ${salePrice.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>
              Platform Fee (10%)
            </Text>
            <Text style={[styles.feeValue, { color: theme.textSecondary }]}>
              Included
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${salePrice.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.infoBox, { backgroundColor: theme.bg }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              The displayed price includes a 10% platform fee. No additional charges.
            </Text>
          </View>
        </View>
        
        {/* Seller Earnings Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Artist Receives
          </Text>
          
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>
              After fees
            </Text>
            <Text style={[styles.earningsValue, { color: colors.success }]}>
              ${fees.seller_amount.toLocaleString()}
            </Text>
          </View>
          
          <Text style={[styles.earningsNote, { color: theme.textSecondary }]}>
            Paid after delivery confirmation
          </Text>
        </View>
        
        {/* Shipping Notice */}
        <View style={[styles.shippingNotice, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="alert-circle" size={24} color={colors.warning} />
          <View style={styles.shippingNoticeText}>
            <Text style={[styles.shippingNoticeTitle, { color: colors.warning }]}>
              Shipping Arrangement
            </Text>
            <Text style={[styles.shippingNoticeBody, { color: '#1F2937' }]}>
              After payment, you'll chat with the artist to arrange shipping/delivery directly. Shipping method and costs are agreed between you and the artist.
            </Text>
          </View>
        </View>
        
        {/* Optional Contact Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Contact Information (Optional)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Share your contact info with the artist for delivery coordination
          </Text>
          
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Your Name"
            placeholderTextColor={theme.textSecondary}
            value={contactName}
            onChangeText={setContactName}
          />
          
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Phone Number"
            placeholderTextColor={theme.textSecondary}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
            placeholder="Delivery Address (optional)"
            placeholderTextColor={theme.textSecondary}
            value={contactAddress}
            onChangeText={setContactAddress}
            multiline
            numberOfLines={3}
          />
          
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
            placeholder="Notes for artist (delivery preferences, etc.)"
            placeholderTextColor={theme.textSecondary}
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={2}
          />
        </View>
        
        {/* Terms Notice */}
        <View style={[styles.termsBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            By purchasing, you agree that shipping is arranged directly with the artist. ArtYard facilitates payment only and is not responsible for delivery.
          </Text>
          <TouchableOpacity onPress={() => {
            if (Platform.OS === 'web') {
              window.open('https://lkm1110.github.io/artyard/terms-of-service.html', '_blank');
            } else {
              Linking.openURL('https://lkm1110.github.io/artyard/terms-of-service.html');
            }
          }}>
            <Text style={[styles.termsLink, { color: colors.primary }]}>
              View Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>
      
      {/* Bottom Purchase Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border, marginBottom: spacing.lg }]}>
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomLabel, { color: theme.textSecondary }]}>
            Total Amount
          </Text>
          <Text style={[styles.bottomPrice, { color: theme.text }]}>
            ${salePrice.toLocaleString()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="card" size={20} color={colors.white} />
              <Text style={styles.purchaseButtonText}>Proceed to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  containerDark: {
    backgroundColor: colors.darkBackground,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  artworkCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
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
  },
  artworkInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  artworkTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  artistName: {
    ...typography.body,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    ...typography.body,
  },
  priceValue: {
    ...typography.h3,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feeLabel: {
    ...typography.caption,
  },
  feeValue: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.h2,
  },
  totalValue: {
    ...typography.h1,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  earningsLabel: {
    ...typography.body,
  },
  earningsValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  earningsNote: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  shippingNotice: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  shippingNoticeText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  shippingNoticeTitle: {
    ...typography.h4,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  shippingNoticeBody: {
    ...typography.body,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  termsBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  termsText: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  termsLink: {
    ...typography.caption,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
  bottomInfo: {
    marginBottom: spacing.sm,
  },
  bottomLabel: {
    ...typography.caption,
  },
  bottomPrice: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
