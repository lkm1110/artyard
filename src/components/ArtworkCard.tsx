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

// 한글 지명을 영문으로 번역
const translateLocationToEnglish = (text: string | undefined): string | undefined => {
  if (!text) return text;

  const translations: Record<string, string> = {
    '대한민국': 'South Korea', '한국': 'South Korea',
    '서울특별시': 'Seoul', '서울': 'Seoul',
    '부산광역시': 'Busan', '부산': 'Busan',
    '대구광역시': 'Daegu', '대구': 'Daegu',
    '인천광역시': 'Incheon', '인천': 'Incheon',
    '광주광역시': 'Gwangju', '광주': 'Gwangju',
    '대전광역시': 'Daejeon', '대전': 'Daejeon',
    '울산광역시': 'Ulsan', '울산': 'Ulsan',
    '세종특별자치시': 'Sejong', '세종': 'Sejong',
    '경기도': 'Gyeonggi', '경기': 'Gyeonggi',
    '강원도': 'Gangwon', '강원': 'Gangwon',
    '충청북도': 'North Chungcheong', '충북': 'North Chungcheong',
    '충청남도': 'South Chungcheong', '충남': 'South Chungcheong',
    '전라북도': 'North Jeolla', '전북': 'North Jeolla',
    '전라남도': 'South Jeolla', '전남': 'South Jeolla',
    '경상북도': 'North Gyeongsang', '경북': 'North Gyeongsang',
    '경상남도': 'South Gyeongsang', '경남': 'South Gyeongsang',
    '제주특별자치도': 'Jeju', '제주': 'Jeju',
    // 경기도 주요 도시
    '수원시': 'Suwon', '수원': 'Suwon',
    '성남시': 'Seongnam', '성남': 'Seongnam',
    '고양시': 'Goyang', '고양': 'Goyang',
    '용인시': 'Yongin', '용인': 'Yongin',
    '부천시': 'Bucheon', '부천': 'Bucheon',
    '안산시': 'Ansan', '안산': 'Ansan',
    '남양주시': 'Namyangju', '남양주': 'Namyangju',
    '화성시': 'Hwaseong', '화성': 'Hwaseong',
    '평택시': 'Pyeongtaek', '평택': 'Pyeongtaek',
    '의정부시': 'Uijeongbu', '의정부': 'Uijeongbu',
  };

  return translations[text] || text;
};

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
    <View style={cardStyle}>
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
              nestedScrollEnabled={true}
              scrollEnabled={true}
              directionalLockEnabled={true}
            >
              {artwork.images.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={onPress}
                >
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={[
                      styles.image,
                      artwork.sale_status === 'sold' && styles.imageSold
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* SOLD 오버레이 */}
            {artwork.sale_status === 'sold' && (
              <View style={styles.soldOverlay}>
                <View style={styles.soldBadge}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              </View>
            )}
            
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

      {/* 작품 정보 - 클릭 가능 영역 */}
      <TouchableOpacity 
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
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
        </Text>

        {/* 위치 정보 (별도 줄) */}
        {(artwork.location_city || artwork.location_country || artwork.location_full) && (
          <Text style={[
            styles.location,
            { color: colors.accent }
          ]}>
            📍 {(() => {
              const city = translateLocationToEnglish(artwork.location_city);
              const state = translateLocationToEnglish(artwork.location_state);
              const country = translateLocationToEnglish(artwork.location_country);
              
              const parts = [];
              if (city) parts.push(city);
              if (state && state !== city) parts.push(state);
              if (country && country !== city) parts.push(country);
              
              return parts.length > 0 ? parts.join(', ') : artwork.location_full || '';
            })()}
          </Text>
        )}

        {/* 작품 상세 정보 */}
        <View style={styles.detailsRow}>
          <Text style={[
            styles.details,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            {artwork.material} · {artwork.size} · {artwork.year}
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
      </TouchableOpacity>
    </View>
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
  imageSold: {
    opacity: 0.4, // 블러 효과 대신 투명도로 표현
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  soldBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // 고급스러운 반투명 검은색
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)', // 흰색 테두리
    transform: [{ rotate: '-15deg' }],
    ...shadows.lg,
  },
  soldText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
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
    paddingVertical: 4,
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
    lineHeight: typography.body.lineHeight * 0.95,
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
    marginTop: 4,
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
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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

