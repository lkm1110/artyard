/**
 * 좋아요한 작품 페이지 - 사용자가 좋아요한 작품들 표시
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { ArtworkCard } from '../components/ArtworkCard';
import { useLikedArtworks } from '../hooks/useLikes';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../constants/theme';
import type { Artwork } from '../types';

export const LikedArtworksScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  // 좋아요한 작품들 조회
  const { data: likedArtworks = [], isLoading, error, refetch } = useLikedArtworks();

  const handleArtworkPress = (artwork: Artwork) => {
    navigation.navigate('ArtworkDetail', { artworkId: artwork.id });
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserArtworks', { userId });
  };

  const handleShare = async (artwork: Artwork) => {
    try {
      console.log('📤 공유 시작:', artwork.title);
      
      const shareMessage = `Check out this amazing artwork on ArtYard!\n\n"${artwork.title}" by @${artwork.author?.handle || 'artist'}\n\n${artwork.description ? artwork.description + '\n\n' : ''}Join the art community: https://artyard.app`;
      
      const shareOptions = {
        message: shareMessage,
        title: `${artwork.title} - ArtYard`,
      };

      if (Platform.OS === 'web') {
        if (navigator.share && navigator.canShare && navigator.canShare(shareOptions)) {
          await navigator.share(shareOptions);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Link copied!', 'The artwork link has been copied to your clipboard.', [{ text: 'OK' }]);
        } else {
          Alert.alert('Share Artwork', shareMessage, [{ text: 'Cancel', style: 'cancel' }, { text: 'OK' }]);
        }
      } else {
        await Share.share(shareOptions);
      }
    } catch (error) {
      console.error('💥 공유 실패:', error);
      Alert.alert('Share Failed', 'Unable to share this artwork.', [{ text: 'OK' }]);
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      title="No likes yet"
      description="Like artworks to see them here!"
      action={
        <TouchableOpacity
          style={[styles.exploreButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={[styles.exploreButtonText, { color: colors.white }]}>
            Explore Artworks
          </Text>
        </TouchableOpacity>
      }
    />
  );

  const renderArtwork = ({ item }: { item: Artwork }) => (
    <ArtworkCard
      artwork={item}
      onPress={() => handleArtworkPress(item)}
      onLike={() => {/* 좋아요 처리는 ArtworkCard 내부에서 */}}
      onBookmark={() => {/* 북마크 처리는 ArtworkCard 내부에서 */}}
      onUserPress={() => handleUserPress(item.author_id)}
      onShare={() => handleShare(item)}
    />
  );

  return (
    <Screen style={styles.container}>
      {/* 상단 네비게이션 바 */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
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
          My Likes
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 좋아요 통계 */}
      <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <Text style={[styles.statsText, { color: isDark ? colors.darkText : colors.text }]}>
          {likedArtworks.length} liked artwork{likedArtworks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* 좋아요한 작품 목록 */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingSpinner message="Loading liked artworks..." />
        ) : error ? (
          <EmptyState
            title="Error loading likes"
            description="Unable to load your liked artworks. Please try again."
            action={
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => refetch()}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryButtonText, { color: colors.white }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            }
          />
        ) : likedArtworks.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={likedArtworks}
            renderItem={renderArtwork}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refetch}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          />
        )}
      </View>
    </Screen>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // 균형을 위한 빈 공간
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statsText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  exploreButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  exploreButtonText: {
    fontSize: typography.button.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  retryButtonText: {
    fontSize: typography.button.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
});

