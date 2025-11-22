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
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface User {
  id: string;
  handle: string;
  created_at: string;
  is_banned?: boolean;
}

type TabType = 'active' | 'pending';

export const UserManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');
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

  const loadUsers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 직접 fetch 사용 (SDK 우회)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/profiles?select=*&order=created_at.desc&limit=500',
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
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Active/Pending 필터링
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filteredUsers = users
    .filter(u => {
      // 검색어 필터
      const matchesSearch = u.handle?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Active/Pending 탭 필터
      const createdDate = new Date(u.created_at);
      const isRecent = createdDate > sevenDaysAgo;

      if (activeTab === 'active') {
        return isRecent; // 최근 7일 이내 가입
      } else {
        return !isRecent; // 7일 이전 가입
      }
    });

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

  if (loading) {
    return (
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? colors.darkBackground : colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? colors.darkText : colors.text }]}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            User Management
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* 탭 */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'active' && styles.tabActive,
              { borderBottomColor: activeTab === 'active' ? colors.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'active' ? colors.primary : (isDark ? colors.darkTextMuted : colors.textMuted) }
            ]}>
              Active Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pending' && styles.tabActive,
              { borderBottomColor: activeTab === 'pending' ? colors.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : (isDark ? colors.darkTextMuted : colors.textMuted) }
            ]}>
              Older Users
            </Text>
          </TouchableOpacity>
        </View>

        {/* 검색 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput, 
              { 
                backgroundColor: isDark ? colors.darkCard : colors.card, 
                color: isDark ? colors.darkText : colors.text,
                borderColor: isDark ? colors.darkBorder : colors.border,
              }
            ]}
            placeholder="Search users..."
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 사용자 목록 */}
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUsers(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                No users found
              </Text>
            </View>
          }
        />
      </View>

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
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabActive: {
    // Active state handled by borderBottomColor
  },
  tabText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: typography.sizes.md,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    marginBottom: spacing.xs,
  },
  userDate: {
    fontSize: typography.sizes.sm,
  },
  banButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  banButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
  },
});

