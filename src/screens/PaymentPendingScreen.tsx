/**
 * Payment Pending Screen
 * Shows after redirecting to 2Checkout
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export const PaymentPendingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const { transaction_id } = route.params as { transaction_id: string };
  
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  
  useEffect(() => {
    checkPaymentStatus();
    
    // Poll every 3 seconds
    const interval = setInterval(checkPaymentStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const checkPaymentStatus = async () => {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('id', transaction_id)
        .single();
      
      if (transaction?.status === 'paid') {
        setStatus('success');
        setChecking(false);
      } else if (transaction?.status === 'cancelled' || transaction?.status === 'refunded') {
        setStatus('failed');
        setChecking(false);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };
  
  const handleContinue = () => {
    if (status === 'success') {
      navigation.navigate('PaymentSuccess' as never, { transaction_id } as never);
    } else {
      navigation.navigate('MainApp' as never);
    }
  };
  
  const theme = {
    bg: isDark ? colors.darkBackground : colors.white,
    text: isDark ? colors.white : colors.black,
    textSecondary: isDark ? colors.lightGray : colors.darkGray,
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>
        {checking ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.title, { color: theme.text }]}>
              Processing Payment
            </Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              Please wait while we confirm your payment...
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              If you completed the payment, this page will update automatically.
            </Text>
          </>
        ) : status === 'success' ? (
          <>
            <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Payment Successful! 🎉
            </Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              Your payment has been confirmed and is held securely in escrow.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.iconContainer, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="close-circle" size={80} color={colors.error} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Payment Failed
            </Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              We couldn't process your payment. Please try again.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});

