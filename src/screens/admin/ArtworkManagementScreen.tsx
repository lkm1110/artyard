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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

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
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('artworks')
        .select(`
          *,
          author:profiles!artworks_author_id_fkey(handle)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setArtworks(data || []);
    } catch (error: any) {
      console.error('작품 목록 로드 실패:', error);
      alert('Error: Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtwork = async (artworkId: string, artworkTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${artworkTitle}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      console.log('❌ Deletion cancelled');
      return;
    }
    
    try {
      setDeleting(artworkId);
      console.log('🗑️ Deleting artwork:', artworkId);

      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artworkId);

      if (error) throw error;

      console.log('✅ Artwork deleted successfully');
      
      // admin_actions 로그 기능 제거 (CHECK constraint 문제로 비활성화)

      alert('Success: Artwork deleted successfully');
      loadArtworks();
    } catch (error: any) {
      console.error('💥 작품 삭제 실패:', error);
      alert('Error: ' + (error.message || 'Failed to delete artwork'));
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
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Artwork Management
        </Text>
        <Text style={[styles.headerSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {filteredArtworks.length} artworks
        </Text>
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
        />
      )}
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

