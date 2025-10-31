/**
 * 작품 카드 컴포넌트
 * 피드에서 사용되는 작품 정보 카드
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import type { Artwork } from '../types';

interface ArtworkCardProps {
  artwork: Artwork;
  onPress: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onUserPress?: () => void;
  onShare?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width; // 화면 전체 너비
const IMAGE_HEIGHT = CARD_WIDTH * 0.75; // 4:3 비율

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onPress,
  onLike,
  onBookmark,
  onUserPress,
  onShare,
}) => {
  const isDark = useColorScheme() === 'dark';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setCurrentImageIndex(index);
  };

  const cardStyle = [
    styles.container,
    {
      backgroundColor: isDark ? colors.darkCard : colors.card,
    },
    shadows.md,
  ];

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
      {/* 작품 이미지 슬라이더 */}
      <View style={styles.imageContainer}>
        {artwork.images && artwork.images.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.imageScrollView}
            >
              {artwork.images.map((imageUrl, index) => (
                <Image 
                  key={index}
                  source={{ uri: imageUrl }} 
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* 이미지 개수 및 페이지 표시 */}
            {artwork.images.length > 1 && (
              <View style={styles.imageCount}>
                <Text style={styles.imageCountText}>
                  {currentImageIndex + 1}/{artwork.images.length}
                </Text>
              </View>
            )}
            
            {/* 페이지 인디케이터 (점) */}
            {artwork.images.length > 1 && (
              <View style={styles.paginationDots}>
                {artwork.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentImageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[
            styles.placeholderImage,
            { backgroundColor: isDark ? colors.darkBg : colors.bg }
          ]}>
            <Text style={[
              styles.placeholderText,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              No Image
            </Text>
          </View>
        )}
      </View>

      {/* 작품 정보 */}
      <View style={styles.content}>
        {/* 제목과 가격 */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { color: isDark ? colors.darkText : colors.text }
            ]}
            numberOfLines={1}
          >
            {artwork.title}
          </Text>
          <Text
            style={[
              styles.price,
              { color: colors.primary }
            ]}
          >
            ${artwork.price?.replace(/[^0-9.,]/g, '') || '0'}
          </Text>
        </View>

        {/* 설명 */}
        <Text
          style={[
            styles.description,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}
          numberOfLines={2}
        >
          {artwork.description}
          {(artwork.location_city || artwork.location_country) && (
            <Text style={{ color: colors.accent, fontWeight: '500' }}>
              {'\n📍 '}{artwork.location_city && artwork.location_country 
                ? `${artwork.location_city}, ${artwork.location_country}`
                : artwork.location_full || 'Unknown Location'
              }
            </Text>
          )}
        </Text>

        {/* 작품 상세 정보 */}
        <View style={styles.detailsRow}>
          <Text style={[
            styles.details,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            {artwork.material} · {artwork.size} · {artwork.year}년
          </Text>
          
        </View>

        {/* 작가 정보와 액션 */}
        <View style={styles.bottomRow}>
          <TouchableOpacity 
            style={styles.authorInfo} 
            onPress={onUserPress}
            activeOpacity={0.7}
          >
            <View style={[
              styles.authorAvatar,
              { backgroundColor: colors.primary }
            ]}>
              <Text style={styles.authorAvatarText}>
                {artwork.author?.handle?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.authorText}>
              <Text style={[
                styles.authorName,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                @{artwork.author?.handle || 'unknown'}
              </Text>
              {artwork.author?.school && (
                <Text style={[
                  styles.authorSchool,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted }
                ]}>
                  {artwork.author.school}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* 액션 버튼들 */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onLike}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: artwork.is_liked ? '#FF0000' : (isDark ? colors.darkTextMuted : colors.textMuted) }
              ]}>
                {artwork.is_liked ? '❤️' : '🤍'}
              </Text>
              <Text style={[
                styles.actionCount,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                {artwork.likes_count || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onBookmark}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: artwork.is_bookmarked ? '#FFD700' : (isDark ? colors.darkTextMuted : colors.textMuted) }
              ]}>
                {artwork.is_bookmarked ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onShare}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                📤
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0, // 화면 꽉 채우기
    marginVertical: spacing.sm,
    borderRadius: 0, // 모서리 둥글기 제거
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  imageScrollView: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: typography.body.fontSize,
  },
  imageCount: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  paginationDots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginRight: spacing.sm,
  },
  price: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight * 1.2,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    marginBottom: spacing.md,
  },
  details: {
    fontSize: typography.caption.fontSize,
  },
  location: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  authorSchool: {
    fontSize: typography.small.fontSize,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  actionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
});

