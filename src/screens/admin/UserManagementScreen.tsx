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
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface User {
  id: string;
  handle: string;
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [banConfirmVisible, setBanConfirmVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [banningUserId, setBanningUserId] = useState<string>('');
  const [banningUserHandle, setBanningUserHandle] = useState<string>('');
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // 직접 fetch 사용 (SDK 우회)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/profiles?select=*&order=created_at.desc&limit=100',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error: any) {
      console.error('사용자 목록 로드 실패:', error);
      setErrorMessage({
        title: 'Error',
        message: 'Failed to load users',
      });
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = (userId: string, handle: string) => {
    console.log('🔍 [Ban] 버튼 클릭됨:', { userId, handle });
    setBanningUserId(userId);
    setBanningUserHandle(handle);
    setBanConfirmVisible(true);
  };

  const executeBan = async () => {
    setIsBanning(true);
    try {
      console.log('🚫 Banning user:', banningUserId);
      
      // 직접 fetch 사용 (SDK 우회)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/user_bans',
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: banningUserId,
            banned_by: user?.id,
            reason: 'Manual ban by admin',
            ban_type: 'permanent',
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ban failed: ${response.status} ${errorText}`);
      }

      console.log('✅ User banned successfully');
      setBanConfirmVisible(false);
      setSuccessMessage({
        title: 'Success',
        message: 'User banned',
      });
      setSuccessModalVisible(true);
      loadUsers();
    } catch (error: any) {
      console.error('💥 Ban 실패:', error);
      setBanConfirmVisible(false);
      setErrorMessage({
        title: 'Error',
        message: error.message,
      });
      setErrorModalVisible(true);
    } finally {
      setIsBanning(false);
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

      {/* Ban Confirm Modal */}
      <ConfirmModal
        visible={banConfirmVisible}
        title="Ban User"
        message={`Ban user "${banningUserHandle}"?`}
        confirmText="Ban"
        cancelText="Cancel"
        confirmColor="#EF4444"
        iconName="ban-outline"
        iconColor="#EF4444"
        isProcessing={isBanning}
        onConfirm={executeBan}
        onCancel={() => setBanConfirmVisible(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setSuccessModalVisible(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setErrorModalVisible(false)}
      />
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

