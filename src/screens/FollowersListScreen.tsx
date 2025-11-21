/**
 * Followers List Screen
 * 팔로워 목록 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

interface Follower {
  id: string;
  follower_id: string;
  created_at: string;
  follower: {
    id: string;
    handle: string;
    avatar_url?: string;
    bio?: string;
  };
}

export const FollowersListScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  const userId = (route.params as any)?.userId || user?.id;
  
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          created_at,
          follower:profiles!follows_follower_id_fkey(
            id,
            handle,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFollowers(data || []);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollowerPress = (followerId: string) => {
    navigation.navigate('UserArtworks' as never, { userId: followerId } as never);
  };

  const renderFollower = ({ item }: { item: Follower }) => {
    const followerData = item.follower;
    
    return (
      <TouchableOpacity
        style={[
          styles.followerCard,
          { backgroundColor: isDark ? colors.darkCard : colors.card }
        ]}
        onPress={() => handleFollowerPress(followerData.id)}
        activeOpacity={0.7}
      >
        <View style={styles.followerContent}>
          {followerData.avatar_url ? (
            <Image
              source={{ uri: followerData.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {followerData.handle?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          
          <View style={styles.followerInfo}>
            <Text style={[styles.handle, { color: isDark ? colors.darkText : colors.text }]}>
              @{followerData.handle}
            </Text>
            {followerData.bio && (
              <Text
                style={[styles.bio, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
                numberOfLines={2}
              >
                {followerData.bio}
              </Text>
            )}
          </View>
          
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? colors.darkTextMuted : colors.textMuted}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={64}
        color={isDark ? colors.darkTextMuted : colors.textMuted}
      />
      <Text style={[styles.emptyTitle, { color: isDark ? colors.darkText : colors.text }]}>
        No Followers Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
        Share your artworks to gain followers!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}
        edges={['top']}
      >
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? colors.darkText : colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Followers
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}
      edges={['top']}
    >
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? colors.darkText : colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Followers ({followers.length})
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        renderItem={renderFollower}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          followers.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFollowers(true)}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyListContent: {
    flex: 1,
  },
  followerCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  followerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  followerInfo: {
    flex: 1,
  },
  handle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.caption,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});

