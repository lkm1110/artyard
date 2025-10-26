/**
 * 작품 피드 컴포넌트 - 실제 데이터만 사용
 */

import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Platform, Share } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors } from '../constants/theme';
import { ArtworkCard } from './ArtworkCard';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { useArtworks, useToggleArtworkLike, useToggleArtworkBookmark } from '../hooks/useArtworks';
import { useAuthStore } from '../store/authStore';
import type { Artwork } from '../types';

interface ArtworkFeedProps {
  onUploadPress?: () => void;
  onArtworkPress?: (artwork: Artwork) => void;
  onUserPress?: (userId: string) => void;
  filter?: {
    material?: string;
    search?: string;
    price?: string;
    priceRange?: { min: number; max: number };
    sizeRange?: { min: number; max: number };
    categories?: string[];
  };
}

export const ArtworkFeed: React.FC<ArtworkFeedProps> = ({
  onUploadPress,
  onArtworkPress,
  onUserPress,
  filter,
}) => {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  // 실제 데이터만 조회
  const { data: artworksData, isLoading, error, refetch } = useArtworks(1, 10, filter);
  const toggleLikeMutation = useToggleArtworkLike();
  const toggleBookmarkMutation = useToggleArtworkBookmark();

  // 실제 데이터만 사용
  const artworks = artworksData?.data || [];

  const handleLike = async (artworkId: string) => {
    console.log('🩷 Like button clicked for artwork:', artworkId);
    console.log('👤 Current user:', user?.id);
    
    if (!user) {
      console.error('❌ Login required for like action');
      return;
    }

    try {
      console.log('⏳ Calling toggleLikeMutation...');
      const isLiked = await toggleLikeMutation.mutateAsync(artworkId);
      console.log('✅ Like toggle successful, new state:', isLiked ? 'liked' : 'unliked');
    } catch (error) {
      console.error('💥 Like failed:', error);
    }
  };

  const handleBookmark = async (artworkId: string) => {
    console.log('⭐ Bookmark button clicked for artwork:', artworkId);
    console.log('👤 Current user:', user?.id);
    
    if (!user) {
      console.error('❌ Login required for bookmark action');
      return;
    }

    try {
      console.log('⏳ Calling toggleBookmarkMutation...');
      const isBookmarked = await toggleBookmarkMutation.mutateAsync(artworkId);
      console.log('✅ Bookmark toggle successful, new state:', isBookmarked ? 'bookmarked' : 'unbookmarked');
    } catch (error) {
      console.error('💥 Bookmark failed:', error);
    }
  };

  const handleArtworkPress = (artwork: Artwork) => {
    console.log('View artwork details:', artwork.title);
    onArtworkPress?.(artwork);
  };

  const handleUserPress = (userId: string) => {
    console.log('View user profile:', userId);
    onUserPress?.(userId);
  };

  const handleShare = async (artwork: Artwork) => {
    try {
      console.log('📤 공유 시작:', artwork.title);
      
      // 공유할 메시지 구성
      const shareMessage = `Check out this amazing artwork on ArtYard!\n\n"${artwork.title}" by @${artwork.author?.handle || 'artist'}\n\n${artwork.description ? artwork.description + '\n\n' : ''}Join the college art community: https://artyard.app`;
      
      const shareOptions = {
        message: shareMessage,
        title: `${artwork.title} - ArtYard`,
      };

      // 웹에서는 Web Share API 사용 (지원되는 경우)
      if (Platform.OS === 'web') {
        if (navigator.share && navigator.canShare && navigator.canShare(shareOptions)) {
          console.log('🌐 Web Share API 사용');
          await navigator.share(shareOptions);
        } else {
          console.log('📋 클립보드 복사로 대체');
          // Web Share API를 지원하지 않으면 클립보드에 복사
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareMessage);
            Alert.alert(
              'Link copied!',
              'The artwork link has been copied to your clipboard. You can now paste it to share with others.',
              [{ text: 'OK' }]
            );
          } else {
            // 클립보드도 지원하지 않으면 텍스트 선택할 수 있는 Alert
            Alert.alert(
              'Share Artwork',
              shareMessage,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK' }
              ]
            );
          }
        }
      } else {
        // 모바일에서는 React Native Share API 사용
        console.log('📱 React Native Share API 사용');
        const result = await Share.share(shareOptions);
        
        if (result.action === Share.sharedAction) {
          console.log('✅ 공유 완료');
        } else if (result.action === Share.dismissedAction) {
          console.log('❌ 공유 취소됨');
        }
      }
    } catch (error) {
      console.error('💥 공유 실패:', error);
      Alert.alert(
        'Share Failed', 
        'Unable to share this artwork. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      title="No artworks yet"
      description="Be the first to share your artwork with the ArtYard community!"
      action={
        <Button
          title="Upload Artwork"
          onPress={onUploadPress}
        />
      }
    />
  );

  const renderArtwork = ({ item }: { item: Artwork }) => (
    <ArtworkCard
      artwork={item}
      onPress={() => handleArtworkPress(item)}
      onLike={() => handleLike(item.id)}
      onBookmark={() => handleBookmark(item.id)}
      onUserPress={() => handleUserPress(item.author_id)}
      onShare={() => handleShare(item)}
    />
  );

  if (isLoading && artworks.length === 0) {
    return <LoadingSpinner message="Loading artworks..." />;
  }

  if (error && artworks.length === 0) {
    return (
      <EmptyState
        title="Unable to load artworks"
        description="Please check your connection and try again."
        action={
          <Button
            title="Retry"
            onPress={() => refetch()}
          />
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={artworks}
        renderItem={renderArtwork}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={artworks.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});