/**
 * Payment Success Screen
 * Shows after successful payment with next steps
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../services/paymentService';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export const PaymentSuccessScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const { transaction_id } = route.params as { transaction_id: string };
  
  const [transaction, setTransaction] = useState<any>(null);
  
  useEffect(() => {
    loadTransaction();
  }, []);
  
  const loadTransaction = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          artwork:artworks(*),
          seller:profiles!transactions_seller_id_fkey(*)
        `)
        .eq('id', transaction_id)
        .single();
      
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
    }
  };
  
  const handleStartChat = () => {
    if (transaction?.seller_id) {
      navigation.navigate('Chat' as never, { 
        userId: transaction.seller_id 
      } as never);
    }
  };
  
  const handleViewOrder = () => {
    navigation.navigate('OrderDetail' as never, { 
      transactionId: transaction_id 
    } as never);
  };
  
  const theme = {
    bg: isDark ? colors.darkBackground : colors.white,
    text: isDark ? colors.white : colors.black,
    textSecondary: isDark ? colors.lightGray : colors.darkGray,
    card: isDark ? colors.darkCard : colors.white,
    border: isDark ? colors.darkGray : colors.lightGray,
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={60} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Payment Successful! 🎉
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your payment is held securely in escrow until delivery confirmation
          </Text>
        </View>
        
        {/* Transaction Info */}
        {transaction && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Purchase Summary
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Artwork
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {transaction.artwork?.title}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Amount Paid
              </Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {formatCurrency(transaction.amount, 'KRW')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  In Escrow
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Next Steps */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            What's Next?
          </Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Chat with the Artist
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Discuss shipping method, delivery address, and timing
              </Text>
              <TouchableOpacity style={styles.stepButton} onPress={handleStartChat}>
                <Ionicons name="chatbubble" size={16} color={colors.primary} />
                <Text style={[styles.stepButtonText, { color: colors.primary }]}>
                  Start Chat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Artist Ships Artwork
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                The artist will arrange shipping and keep you updated
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Confirm Receipt
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                When you receive the artwork, confirm delivery to release payment to the artist
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Artist Gets Paid! 💰
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Payment is automatically released after 7 days if no issues reported
              </Text>
            </View>
          </View>
        </View>
        
        {/* Shipping Cost Guide */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, marginLeft: spacing.sm }]}>
              Shipping Cost Guide
            </Text>
          </View>
          <Text style={[styles.guideText, { color: theme.textSecondary }]}>
            • Domestic courier: ₩3,000-5,000
          </Text>
          <Text style={[styles.guideText, { color: theme.textSecondary }]}>
            • Express delivery: ₩10,000+
          </Text>
          <Text style={[styles.guideText, { color: theme.textSecondary }]}>
            • Local pickup: Free
          </Text>
        </View>
        
        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewOrder}
        >
          <Text style={styles.primaryButtonText}>View Order Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => navigation.navigate('MainApp' as never)}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Continue Shopping
          </Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
  },
  infoValue: {
    ...typography.body,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  step: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  stepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stepButtonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  guideText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
  },
});

