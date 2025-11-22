/**
 * 작품 관리 화면
 * - 전체 작품 조회
 * - 검색/필터
 * - 작품 삭제
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
  Image,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface Artwork {
  id: string;
  title: string;
  price: number;
  image_urls: string[];
  created_at: string;
  author: {
    handle: string;
  } | null;
}

export const ArtworkManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async (isRefreshing = false) => {
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
        'https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/artworks?select=*,author:profiles!artworks_author_id_fkey(handle)&order=created_at.desc&limit=100',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load artworks: ${response.status}`);
      }

      const data = await response.json();
      setArtworks(data || []);
    } catch (error: any) {
      console.error('작품 목록 로드 실패:', error);
      alert('Error: Failed to load artworks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteArtwork = async (artworkId: string, artworkTitle: string) => {
    console.log('🔍 [Delete] 버튼 클릭됨:', { artworkId, artworkTitle });
    
    // 크로스 플랫폼 confirm
    if (Platform.OS === 'web') {
      if (!window.confirm(
        `Are you sure you want to delete "${artworkTitle}"?\n\nThis action cannot be undone.`
      )) {
        console.log('❌ Deletion cancelled');
        return;
      }
    } else {
      // React Native (모바일)
      Alert.alert(
        'Delete Artwork',
        `Are you sure you want to delete "${artworkTitle}"?\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('❌ Deletion cancelled') },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await executeDelete(artworkId, artworkTitle);
            }
          }
        ]
      );
      return;
    }
    
    await executeDelete(artworkId, artworkTitle);
  };

  const executeDelete = async (artworkId: string, artworkTitle: string) => {
    try {
      setDeleting(artworkId);
      console.log('🗑️ Deleting artwork:', artworkId);

      // 직접 fetch 사용 (SDK 우회)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/artworks?id=eq.${artworkId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
      }

      console.log('✅ Artwork deleted successfully');
      
      // admin_actions 로그 기능 제거 (CHECK constraint 문제로 비활성화)

      Alert.alert('Success', 'Artwork deleted successfully');
      loadArtworks();
    } catch (error: any) {
      console.error('💥 작품 삭제 실패:', error);
      Alert.alert('Error', error.message || 'Failed to delete artwork');
    } finally {
      setDeleting(null);
    }
  };

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artwork.author?.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderArtwork = ({ item }: { item: Artwork }) => (
    <TouchableOpacity
      style={[
        styles.artworkCard,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
      onPress={() => navigation.navigate('ArtworkDetail' as never, { artwork: item } as never)}
    >
      {item.image_urls && item.image_urls[0] && (
        <Image
          source={{ uri: item.image_urls[0] }}
          style={styles.artworkImage}
        />
      )}

      <View style={styles.artworkInfo}>
        <Text
          style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.artworkAuthor, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          by {item.author?.handle || 'Unknown'}
        </Text>
        <Text style={[styles.artworkPrice, { color: colors.primary }]}>
          ${item.price}
        </Text>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
          onPress={() => handleDeleteArtwork(item.id, item.title)}
          disabled={deleting === item.id}
        >
          {deleting === item.id ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
            Artwork Management
          </Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* 검색 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? colors.darkCard : colors.card,
              color: isDark ? colors.darkText : colors.text,
            },
          ]}
          placeholder="Search by title or artist..."
          placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredArtworks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {searchQuery ? 'No artworks found matching your search' : 'No artworks yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredArtworks}
          renderItem={renderArtwork}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadArtworks(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    padding: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  artworkCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    aspectRatio: 1,
  },
  artworkInfo: {
    padding: spacing.sm,
  },
  artworkTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  artworkAuthor: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  artworkPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  deleteButton: {
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

