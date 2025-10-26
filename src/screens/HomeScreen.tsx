/**
 * 홈 스크린 (작품 피드)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AIOrchestrationService from '../services/ai/aiOrchestrationService';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { ArtworkFeed } from '../components/ArtworkFeed';
import { SearchModal } from '../components/SearchModal';
import { SimpleFilterModal } from '../components/SimpleFilterModal';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import type { Artwork } from '../types';
// Simple filter interface
interface SimpleFilter {
  priceRange?: { min: number; max: number };
  sizeRange?: { min: number; max: number };
  categories?: string[];
}

// Material filter options
const MATERIAL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Illustration', label: 'Illustration' },
  { key: 'Photography', label: 'Photography' },
  { key: 'Printmaking', label: 'Printmaking' },
  { key: 'Craft', label: 'Craft' },
  { key: 'Design Poster', label: 'Poster' },
  { key: 'Drawing', label: 'Drawing' },
];

export const HomeScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const { user, isAuthenticated } = useAuthStore();
  const navigation = useNavigation<any>(); // TODO: 타입 정의 개선
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchModalVisible, setSearchModalVisible] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [simpleFilter, setSimpleFilter] = useState<SimpleFilter>({});

  const handleUploadPress = () => {
    if (!isAuthenticated) {
      console.log('Login required');
      return;
    }
    navigation.navigate('ArtworkUpload');
  };

  const handleArtworkPress = (artwork: Artwork) => {
    console.log('View artwork details:', artwork.title);
    
    // AI 시스템에 사용자 행동 알림
    try {
      AIOrchestrationService.handleUserAction(
        user?.id || 'anonymous',
        'view',
        artwork.id,
        { 
          artworkTitle: artwork.title,
          artworkMaterial: artwork.material,
          timestamp: new Date().toISOString()
        },
        'artwork_view'
      ).catch(error => console.warn('AI 시스템 연동 실패:', error));
    } catch (error) {
      console.warn('AI 시스템 연동 실패:', error);
    }
    
    navigation.navigate('ArtworkDetail', { artworkId: artwork.id });
  };

  const handleUserPress = (userId: string) => {
    console.log('View user artworks:', userId);
    navigation.navigate('UserArtworks', { userId });
  };

  const handleNotificationPress = () => {
    console.log('Notifications screen');
    navigation.navigate('Notifications');
  };

  const handleSimpleFilterApply = (filter: SimpleFilter) => {
    setSimpleFilter(filter);
    setFilterModalVisible(false);
    console.log('필터 적용:', filter);
  };

  const handleSearchArtworkPress = (artworkId: string) => {
    navigation.navigate('ArtworkDetail', { artworkId });
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={[
          styles.header,
          { borderBottomColor: isDark ? colors.darkCard : colors.card }
        ]}>
          <View style={styles.headerTop}>
            <Text style={[
              styles.title,
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              ArtYard
            </Text>
            
            <View style={styles.headerActions}>
              {isAuthenticated && (
                <Text style={[
                  styles.welcomeText,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted }
                ]}>
                  Hello, {user?.handle || 'Artist'}!
                </Text>
              )}
              
              <TouchableOpacity
                style={[
                  styles.iconOnlyButton,
                  { 
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    shadowOpacity: 0,
                    elevation: 0
                  }
                ]}
                onPress={() => setSearchModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.iconOnlyIcon,
                  { color: isDark ? colors.darkText : colors.text }
                ]}>
                  🔍
                </Text>
              </TouchableOpacity>
              
              {/* 필터 버튼 */}
              <TouchableOpacity
                style={[
                  styles.iconOnlyButton,
                  { 
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    shadowOpacity: 0,
                    elevation: 0
                  }
                ]}
                onPress={() => setFilterModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.iconOnlyIcon,
                  { color: isDark ? colors.darkText : colors.text }
                ]}>
                  📊
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.actionIcon,
                  { color: colors.primary }
                ]}>
                  🔔
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 광고 슬롯 */}
          <View style={[
            styles.adSlot,
            { 
              backgroundColor: isDark ? colors.darkCard : colors.card,
              borderColor: isDark ? colors.darkCard : colors.card,
            }
          ]}>
            <Text style={[
              styles.adText,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              📢 College Art Community - Ad Space
            </Text>
          </View>
          
          {/* 재료 필터 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {MATERIAL_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedFilter === filter.key 
                      ? colors.primary 
                      : (isDark ? colors.darkCard : colors.card),
                  }
                ]}
                onPress={() => setSelectedFilter(filter.key)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterText,
                  {
                    color: selectedFilter === filter.key
                      ? '#FFFFFF'
                      : (isDark ? colors.darkText : colors.text),
                  }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 작품 피드 */}
        <ArtworkFeed 
          onUploadPress={handleUploadPress}
          onArtworkPress={handleArtworkPress}
          onUserPress={handleUserPress}
          filter={{
            material: selectedFilter !== 'all' ? selectedFilter : undefined,
            ...simpleFilter,
          }}
        />
        
        {/* 검색 모달 */}
        <SearchModal
          visible={searchModalVisible}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => setSearchModalVisible(false)}
          onArtworkPress={handleSearchArtworkPress}
        />
        
        {/* 간단한 필터 모달 */}
        <SimpleFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApplyFilter={handleSimpleFilterApply}
          initialFilter={simpleFilter}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionIcon: {
    fontSize: 20,
  },
  adSlot: {
    height: 60,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  adText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  filterContainer: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernActionIcon: {
    fontSize: 16,
  },
  modernActionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  iconOnlyButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconOnlyIcon: {
    fontSize: 20,
  },
});
