/**
 * 내 작품 페이지 - 사용자가 업로드한 작품들 표시
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
import { useUserArtworks } from '../hooks/useUserArtworks';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../constants/theme';
import type { Artwork } from '../types';

export const MyArtworksScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  // 사용자의 작품들 조회
  const { data: userArtworks = [], isLoading, error, refetch } = useUserArtworks();

  const handleArtworkPress = (artwork: Artwork) => {
    navigation.navigate('ArtworkDetail', { artworkId: artwork.id });
  };

  const handleUserPress = (userId: string) => {
    // 자신의 프로필로 이동 (현재는 로그만)
    console.log('View own profile:', userId);
  };

  const handleShare = async (artwork: Artwork) => {
    try {
      console.log('📤 공유 시작:', artwork.title);
      
      const shareMessage = `Check out this amazing artwork on ArtYard!\n\n"${artwork.title}" by @${artwork.author?.handle || 'artist'}\n\n${artwork.description ? artwork.description + '\n\n' : ''}Join the college art community: https://artyard.app`;
      
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
      title="No artworks yet"
      description="Start sharing your creative work with the ArtYard community!"
      action={
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ArtworkUpload')}
          activeOpacity={0.8}
        >
          <Text style={[styles.uploadButtonText, { color: colors.white }]}>
            Upload Artwork
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
          My Artworks
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 작품 통계 */}
      <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <Text style={[styles.statsText, { color: isDark ? colors.darkText : colors.text }]}>
          {userArtworks.length} artwork{userArtworks.length !== 1 ? 's' : ''} created
        </Text>
        <Text style={[styles.subStatsText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          @{user?.handle || 'artist'}
        </Text>
      </View>

      {/* 작품 목록 */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingSpinner message="Loading your artworks..." />
        ) : error ? (
          <EmptyState
            title="Error loading artworks"
            description="Unable to load your artworks. Please try again."
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
        ) : userArtworks.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={userArtworks}
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
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subStatsText: {
    fontSize: typography.caption.fontSize,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  uploadButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  uploadButtonText: {
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
