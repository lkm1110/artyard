/**
 * 주문 관리 화면 (간소화 버전)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export const OrderManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Transaction[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Transaction }) => (
    <View style={[styles.card, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
      <Text style={[styles.amount, { color: colors.primary }]}>${item.amount.toFixed(2)}</Text>
      <Text style={[styles.status, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        Status: {item.status}
      </Text>
      <Text style={[styles.date, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>Order Management</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
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
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  back: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: spacing.lg },
  card: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  amount: { fontSize: 20, fontWeight: 'bold', marginBottom: spacing.xs },
  status: { fontSize: 14, marginBottom: spacing.xs },
  date: { fontSize: 12 },
});

