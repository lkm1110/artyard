/**
 * 관리자 등록/관리 화면
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
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface Admin {
  id: string;
  handle: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export const AdminManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Admin[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);

      // is_admin = true인 사용자 조회 (handle만 사용)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, handle, created_at, is_admin')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // email 대신 handle 사용
      const adminsData = (data || []).map((profile) => ({
        ...profile,
        email: `${profile.handle}@artyard.com`, // 이메일은 표시용으로만
      }));

      setAdmins(adminsData);
    } catch (error: any) {
      console.error('관리자 목록 로드 실패:', error);
      Alert.alert('Error', 'Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('Notice', 'Please enter handle or email');
      return;
    }

    try {
      setSearching(true);

      // profiles 테이블에서 handle로 검색 (이메일 대신)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, handle, created_at, is_admin')
        .ilike('handle', `%${searchEmail}%`);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        Alert.alert('Notice', 'No users found with that handle');
        setSearchResults([]);
        return;
      }

      const results = profiles.map(p => ({
        id: p.id,
        email: `${p.handle}@artyard.com`, // 표시용
        handle: p.handle,
        created_at: p.created_at,
        is_admin: p.is_admin || false,
      }));

      setSearchResults(results);
    } catch (error: any) {
      console.error('사용자 검색 실패:', error);
      Alert.alert('Error', error.message || 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddAdmin = async (userId: string, handle: string) => {
    Alert.alert(
      'Confirm',
      `Add "${handle}" as an administrator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', userId);

              if (error) throw error;

              // 관리자 액션 로그
              await supabase.from('admin_actions').insert({
                admin_id: user?.id,
                action_type: 'admin_added' as any,
                target_type: 'user',
                target_id: userId,
                reason: 'New admin added',
              });

              Alert.alert('Success', 'Administrator added');
              setModalVisible(false);
              setSearchEmail('');
              setSearchResults([]);
              loadAdmins();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveAdmin = async (userId: string, handle: string) => {
    if (userId === user?.id) {
      Alert.alert('Notice', 'You cannot remove yourself as admin');
      return;
    }

    Alert.alert(
      'Confirm',
      `Remove "${handle}" from administrators?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_admin: false })
                .eq('id', userId);

              if (error) throw error;

              // 관리자 액션 로그
              await supabase.from('admin_actions').insert({
                admin_id: user?.id,
                action_type: 'admin_removed' as any,
                target_type: 'user',
                target_id: userId,
                reason: 'Admin removed',
              });

              Alert.alert('Success', 'Administrator removed');
              loadAdmins();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderAdmin = ({ item }: { item: Admin }) => (
    <View style={[styles.adminCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
      <View style={styles.adminInfo}>
        <Text style={[styles.adminHandle, { color: isDark ? colors.darkText : colors.text }]}>
          {item.handle}
        </Text>
        <Text style={[styles.adminEmail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {item.email}
        </Text>
        <Text style={[styles.adminDate, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          Admin since {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {item.id !== user?.id && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: '#EF4444' }]}
          onPress={() => handleRemoveAdmin(item.id, item.handle)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}

      {item.id === user?.id && (
        <View style={styles.youBadge}>
          <Text style={styles.youBadgeText}>You</Text>
        </View>
      )}
    </View>
  );

  const renderSearchResult = ({ item }: { item: Admin }) => (
    <View style={[styles.searchResultCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
      <View style={styles.adminInfo}>
        <Text style={[styles.adminHandle, { color: isDark ? colors.darkText : colors.text }]}>
          {item.handle}
        </Text>
        <Text style={[styles.adminEmail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {item.email}
        </Text>
        {item.is_admin && (
          <Text style={[styles.alreadyAdmin, { color: colors.primary }]}>
            Already an admin
          </Text>
        )}
      </View>

      {!item.is_admin && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAddAdmin(item.id, item.handle)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Admin Management
        </Text>
        <Text style={[styles.headerSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {admins.length} total administrators
        </Text>
      </View>

      {/* 관리자 추가 버튼 */}
      <TouchableOpacity
        style={[styles.addAdminButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addAdminButtonText}>+ Add New Administrator</Text>
      </TouchableOpacity>

      {/* 관리자 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={admins}
          renderItem={renderAdmin}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* 관리자 추가 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Add Administrator
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.darkText : colors.text }]}>
              Search by Email
            </Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: isDark ? colors.darkBorder : colors.border,
                  },
                ]}
                placeholder="Enter email address..."
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={searchEmail}
                onChangeText={setSearchEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleSearchUser}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <Text style={[styles.resultsTitle, { color: isDark ? colors.darkText : colors.text }]}>
                  Search Results
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  addAdminButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addAdminButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.lg,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminHandle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  adminEmail: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  adminDate: {
    fontSize: 11,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  youBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
  },
  youBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
  },
  modalContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchResults: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  alreadyAdmin: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

