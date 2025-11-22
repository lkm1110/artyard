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
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Admin[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // RPC 함수로 실제 이메일 포함해서 가져오기
      const { data, error } = await supabase.rpc('get_admin_users');

      if (error) {
        console.error('RPC 에러, fallback 사용:', error);
        // Fallback: profiles만 조회
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, handle, created_at, is_admin')
          .eq('is_admin', true)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        const adminsData = (profiles || []).map((profile) => ({
          ...profile,
          email: `${profile.handle}@artyard.com`, // Fallback
        }));
        setAdmins(adminsData);
        return;
      }

      setAdmins(data || []);
    } catch (error: any) {
      console.error('관리자 목록 로드 실패:', error);
      alert('Error: Failed to load admin list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      alert('Notice: Please enter handle');
      return;
    }

    try {
      setSearching(true);
      
      console.log('🔍 검색 시작:', searchEmail);

      const searchTerm = searchEmail.trim();
      
      // RPC 함수로 실제 이메일 포함해서 검색
      const { data, error } = await supabase.rpc('search_users_with_email', {
        search_term: searchTerm
      });

      if (error) {
        console.error('RPC 에러, fallback 사용:', error);
        // Fallback: profiles만 검색
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, handle, created_at, is_admin')
          .ilike('handle', `%${searchTerm}%`);

        if (profilesError) throw profilesError;

        if (!profiles || profiles.length === 0) {
          alert(`Notice: No users found with handle containing "${searchTerm}"`);
          setSearchResults([]);
          return;
        }

        const results = profiles.map(p => ({
          id: p.id,
          email: `${p.handle}@artyard.com`, // Fallback
          handle: p.handle,
          created_at: p.created_at,
          is_admin: p.is_admin || false,
        }));
        setSearchResults(results);
        return;
      }

      console.log('📊 검색 결과:', data?.length || 0);

      if (!data || data.length === 0) {
        alert(`Notice: No users found with handle containing "${searchTerm}"`);
        setSearchResults([]);
        return;
      }

      setSearchResults(data);
    } catch (error: any) {
      console.error('사용자 검색 실패:', error);
      alert('Error: ' + (error.message || 'Failed to search users'));
    } finally {
      setSearching(false);
    }
  };

  const handleAddAdmin = async (userId: string, handle: string) => {
    console.log('🎯 Add Admin 클릭:', { userId, handle });
    
    // React Native Alert 사용
    Alert.alert(
      'Add Administrator',
      `Add "${handle}" as an administrator?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ 취소됨'),
        },
        {
          text: 'Add',
          onPress: async () => {
            try {
              console.log('✅ 관리자 추가 시작...');
              console.log('📝 대상 userId:', userId);
              console.log('📝 현재 admin userId:', user?.id);
              
              const { data, error } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', userId)
                .select();

              console.log('📊 업데이트 결과 (data):', data);
              console.log('📊 업데이트 결과 (data length):', data?.length);
              console.log('❌ 에러:', error);

              if (error) throw error;
              
              if (!data || data.length === 0) {
                throw new Error('Update succeeded but no rows were affected. This might be an RLS policy issue.');
              }

              console.log('✅ 관리자 추가 성공! 실제 업데이트된 데이터:', data[0]);

              Alert.alert('Success', `"${handle}" has been added as an administrator`);
              setModalVisible(false);
              setSearchEmail('');
              setSearchResults([]);
              loadAdmins();
            } catch (error: any) {
              console.error('💥 관리자 추가 실패:', error);
              Alert.alert('Error', error.message || 'Failed to add administrator');
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

    console.log('🗑️ Remove Admin 클릭:', { userId, handle });

    // React Native Alert 사용
    Alert.alert(
      'Remove Administrator',
      `Remove "${handle}" from administrators?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ 취소됨'),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ 관리자 제거 시작...');
              
              const { data, error } = await supabase
                .from('profiles')
                .update({ is_admin: false })
                .eq('id', userId)
                .select();

              console.log('📊 업데이트 결과:', data);
              console.log('❌ 에러:', error);

              if (error) throw error;

              console.log('✅ 관리자 제거 성공!');

              Alert.alert('Success', `"${handle}" has been removed from administrators`);
              loadAdmins();
            } catch (error: any) {
              console.error('💥 관리자 제거 실패:', error);
              Alert.alert('Error', error.message || 'Failed to remove administrator');
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
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBackground : colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
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
            Admin Management
          </Text>
          <View style={styles.headerSpacer} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAdmins(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
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
              Search by Handle (Username)
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
                placeholder="Enter username (e.g., kangmin)"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={searchEmail}
                onChangeText={setSearchEmail}
                keyboardType="default"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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

