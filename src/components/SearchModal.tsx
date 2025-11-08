/**
 * 검색 모달 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { ArtworkCard } from './ArtworkCard';
import { Button } from './Button';
import { searchArtworksAdvanced } from '../services/advancedFilterService';
import { AdvancedFilter, ExtendedArtwork } from '../types/advanced';

interface SearchModalProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  onArtworkPress?: (artworkId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  onArtworkPress,
}) => {
  const isDark = useColorScheme() === 'dark';
  
  // 검색 상태
  const [searchResults, setSearchResults] = useState<ExtendedArtwork[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<AdvancedFilter>({});
  
  // 검색 실행 (최소 2글자)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, currentFilter]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const filter: AdvancedFilter = {
        ...currentFilter,
        // 검색어를 필터에 추가 (실제로는 서비스에서 처리)
      };
      
      // 임시로 기본 검색 수행 (실제로는 텍스트 검색 기능 추가 필요)
      const result = await searchArtworksAdvanced(filter, 1, 20);
      
      // 검색어가 포함된 작품 필터링 (클라이언트 사이드)
      const filteredResults = result.artworks.filter(artwork =>
        artwork.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.author?.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.material?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(filteredResults);
      setHasSearched(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleArtworkPress = (artwork: ExtendedArtwork) => {
    onArtworkPress?.(artwork.id);
    onClose();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.length > 0 && searchQuery.length < 2) {
      Alert.alert(
        'Search Requirements',
        'Please enter at least 2 characters to search.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[
        styles.container,
        { backgroundColor: isDark ? colors.darkBackground : colors.background }
      ]}>
        {/* 헤더 */}
        <View style={[
          styles.header,
          { borderBottomColor: isDark ? colors.darkBorder : colors.border }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.backIcon,
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              ←
            </Text>
          </TouchableOpacity>
          
          <View style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? colors.darkCard : colors.card,
              borderColor: isDark ? colors.darkBorder : colors.border,
            }
          ]}>
            <Text style={[
              styles.searchIcon,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              🔍
            </Text>
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? colors.darkText : colors.text }
              ]}
              placeholder="Search artworks..."
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => onSearchChange('')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.clearIcon,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted }
                ]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 검색 결과 영역 */}
        <View style={styles.content}>
          {searchQuery.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[
                styles.emptyIcon,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                🔍
              </Text>
              <Text style={[
                styles.emptyTitle,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                Search Artworks
              </Text>
              <Text style={[
                styles.emptyDescription,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                Find amazing artworks by title, artist, or material
              </Text>
            </View>
          ) : (
            <View style={styles.searchResults}>
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[
                    styles.loadingText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted }
                  ]}>
                    Searching...
                  </Text>
                </View>
              ) : hasSearched ? (
                searchResults.length > 0 ? (
                  <>
                    <Text style={[
                      styles.resultsCount,
                      { color: isDark ? colors.darkTextMuted : colors.textMuted }
                    ]}>
                      {searchResults.length} artwork{searchResults.length !== 1 ? 's' : ''} found
                    </Text>
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <ArtworkCard
                          artwork={item}
                          onPress={() => handleArtworkPress(item)}
                          onLike={() => {}} // TODO: 좋아요 기능 연결
                          onBookmark={() => {}} // TODO: 북마크 기능 연결
                          onShare={() => {}} // TODO: 공유 기능 연결
                        />
                      )}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.resultsList}
                    />
                  </>
                ) : (
                  <View style={styles.noResults}>
                    <Text style={[
                      styles.noResultsIcon,
                      { color: isDark ? colors.darkTextMuted : colors.textMuted }
                    ]}>
                      😔
                    </Text>
                    <Text style={[
                      styles.noResultsTitle,
                      { color: isDark ? colors.darkText : colors.text }
                    ]}>
                      No artworks found
                    </Text>
                    <Text style={[
                      styles.noResultsDescription,
                      { color: isDark ? colors.darkTextMuted : colors.textMuted }
                    ]}>
                      Try adjusting your search terms or filters
                    </Text>
                  </View>
                )
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    maxWidth: 280,
  },
  searchResults: {
    paddingTop: spacing.lg,
  },
  resultsText: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    marginTop: spacing.md,
  },
  resultsCount: {
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  resultsList: {
    paddingBottom: spacing.lg,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  noResultsTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noResultsDescription: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    maxWidth: 280,
  },
});
