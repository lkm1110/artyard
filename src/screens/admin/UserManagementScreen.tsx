/**
 * 사용자 관리 화면
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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface User {
  id: string;
  handle: string;
  email: string;
  created_at: string;
  is_banned?: boolean;
}

export const UserManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error('사용자 목록 로드 실패:', error);
      alert('Error: Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, handle: string) => {
    const confirmed = window.confirm(`Ban user "${handle}"?`);
    
    if (!confirmed) {
      console.log('❌ Ban cancelled');
      return;
    }
    
    try {
      console.log('🚫 Banning user:', userId);
      
      await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: user?.id,
        reason: 'Manual ban by admin',
        ban_type: 'permanent',
      });

      console.log('✅ User banned successfully');
      alert('Success: User banned');
      loadUsers();
    } catch (error: any) {
      console.error('💥 Ban 실패:', error);
      alert('Error: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u =>
    u.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: isDark ? colors.darkText : colors.text }]}>
          {item.handle}
        </Text>
        <Text style={[styles.userDate, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.banButton, { backgroundColor: '#EF4444' }]}
        onPress={() => handleBanUser(item.id, item.handle)}
      >
        <Text style={styles.banButtonText}>Ban</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
          User Management
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: isDark ? colors.darkCard : colors.card, color: isDark ? colors.darkText : colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
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
  backButton: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchInput: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  list: { padding: spacing.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', marginBottom: spacing.xs },
  userDate: { fontSize: 12 },
  banButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  banButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});

