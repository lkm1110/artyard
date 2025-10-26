/**
 * 챌린지 관리 화면
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { selectWinners } from '../../services/challengeService';

interface Challenge {
  id: string;
  title: string;
  status: string;
  entries_count: number;
  created_at: string;
}

export const ChallengeManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleEndChallenge = async (challengeId: string) => {
    Alert.alert(
      'End Challenge',
      'Mark this challenge as ended?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          onPress: async () => {
            try {
              await supabase
                .from('challenges')
                .update({ status: 'ended' })
                .eq('id', challengeId);

              Alert.alert('Success', 'Challenge ended');
              loadChallenges();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={[styles.card, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
      <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>{item.title}</Text>
      <Text style={[styles.status, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        Status: {item.status} | Entries: {item.entries_count || 0}
      </Text>
      {item.status === 'active' && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#EF4444' }]}
          onPress={() => handleEndChallenge(item.id)}
        >
          <Text style={styles.buttonText}>End Challenge</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>Challenge Management</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
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
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: spacing.lg },
  card: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.xs },
  status: { fontSize: 14, marginBottom: spacing.sm },
  button: { paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});

