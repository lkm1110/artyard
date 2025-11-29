/**
 * 작품 피드 컴포넌트 - 실제 데이터만 사용
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Platform, Share } from 'react-native';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { ArtworkCard } from './ArtworkCard';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { useInfiniteArtworks, useToggleArtworkLike, useToggleArtworkBookmark } from '../hooks/useArtworks';
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
  
  // 무한 스크롤로 데이터 조회
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteArtworks(20, filter);
  
  const toggleLikeMutation = useToggleArtworkLike();
  const toggleBookmarkMutation = useToggleArtworkBookmark();

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 홈 화면 포커스 - 데이터 새로고침');
      refetch();
    }, [refetch])
  );

  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const artworks = data?.pages.flatMap(page => page.data) || [];

  const handleLike = async (artworkId: string) => {
    console.log('🩷 Like button clicked for artwork:', artworkId);
    console.log('👤 Current user:', user?.id);
    
    // 중복 클릭 방지
    if (toggleLikeMutation.isPending) {
      console.log('⏳ Already processing like request, ignoring...');
      return;
    }
    
    if (!user) {
      console.log('❌ Login required for like action');
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
      
      // 작품 딥링크 생성
      const artworkUrl = `artyard://artwork/${artwork.id}`;
      const artistHandle = artwork.author?.handle || 'artist';
      
      // 공유할 메시지 구성
      const shareMessage = `Check out this amazing artwork on ArtYard!\n\n"${artwork.title}" by @${artistHandle}\n\n${artwork.description ? artwork.description + '\n\n' : ''}${artworkUrl}`;
      
      const shareOptions = {
        message: shareMessage,
        title: `${artwork.title} - ArtYard`,
        url: artworkUrl,
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
      action={onUploadPress ? (
        <Button
          title="Upload Artwork"
          onPress={onUploadPress}
        />
      ) : undefined}
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
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && artworks.length === 0}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        // 무한 스크롤 설정
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            console.log('📜 Loading next page...');
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5} // 50% 남았을 때 로드
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <LoadingSpinner message="Loading more..." />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    paddingVertical: 20,
  },
  list: {
    paddingVertical: 0,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});