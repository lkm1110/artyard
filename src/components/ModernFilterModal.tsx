/**
 * 모던한 디자인의 고급 필터링 모달 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Animated,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // 웹에서 오류 발생으로 임시 비활성화
import Slider from '@react-native-community/slider';
import { colors, spacing, typography } from '../constants/theme';
import { Button } from './Button';
import { AdvancedFilter, ArtworkStyle } from '../types/advanced';
import { getArtworkStyles, getFilterStatistics } from '../services/advancedFilterService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: AdvancedFilter) => void;
  initialFilter?: AdvancedFilter;
}

export const ModernFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  onApplyFilter,
  initialFilter,
}) => {
  const isDark = useColorScheme() === 'dark';
  const slideAnim = new Animated.Value(screenHeight);
  
  // 필터 상태
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sizeRange, setSizeRange] = useState({
    width: { min: 10, max: 200 },
    height: { min: 10, max: 200 },
  });
  const [yearRange, setYearRange] = useState({ min: 2020, max: new Date().getFullYear() });
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<AdvancedFilter['sortBy']>('newest');

  // 데이터 상태
  const [styles, setStyles] = useState<ArtworkStyle[]>([]);
  const [materials, setMaterials] = useState<{ material: string; count: number }[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // 인기 색상 팔레트 (그라데이션과 트렌디한 색상)
  const trendyColors = [
    { hex: '#FF6B6B', name: 'Coral Red' },
    { hex: '#4ECDC4', name: 'Turquoise' },
    { hex: '#45B7D1', name: 'Sky Blue' },
    { hex: '#96CEB4', name: 'Mint Green' },
    { hex: '#FECA57', name: 'Sunny Yellow' },
    { hex: '#FF9FF3', name: 'Pink' },
    { hex: '#54A0FF', name: 'Royal Blue' },
    { hex: '#5F27CD', name: 'Purple' },
    { hex: '#00D2D3', name: 'Cyan' },
    { hex: '#FF9F43', name: 'Orange' },
    { hex: '#C44569', name: 'Magenta' },
    { hex: '#F8B500', name: 'Amber' },
    { hex: '#6C5CE7', name: 'Violet' },
    { hex: '#A29BFE', name: 'Lavender' },
    { hex: '#FD79A8', name: 'Rose' },
  ];

  useEffect(() => {
    if (visible) {
      loadFilterData();
      if (initialFilter) {
        applyInitialFilter(initialFilter);
      }
      // 모달 애니메이션
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialFilter]);

  const loadFilterData = async () => {
    try {
      const [stylesData, statsData] = await Promise.all([
        getArtworkStyles(),
        getFilterStatistics(),
      ]);

      setStyles(stylesData);
      setStatistics(statsData);
      setMaterials(statsData.materials);

      // 통계 데이터로 초기 범위 설정
      if (statsData.priceRange) {
        setPriceRange(statsData.priceRange);
      }
      if (statsData.sizeRange) {
        setSizeRange(statsData.sizeRange);
      }
      if (statsData.yearRange) {
        setYearRange(statsData.yearRange);
      }
    } catch (error) {
      console.error('필터 데이터 로드 오류:', error);
    }
  };

  const applyInitialFilter = (filter: AdvancedFilter) => {
    if (filter.priceRange) setPriceRange(filter.priceRange);
    if (filter.sizeRange) setSizeRange(filter.sizeRange);
    if (filter.yearRange) setYearRange(filter.yearRange);
    if (filter.styles) setSelectedStyles(filter.styles);
    if (filter.materials) setSelectedMaterials(filter.materials);
    if (filter.colors) setSelectedColors(filter.colors);
    if (filter.sortBy) setSortBy(filter.sortBy);
  };

  const handleApplyFilter = () => {
    const filter: AdvancedFilter = {
      priceRange,
      sizeRange,
      yearRange,
      styles: selectedStyles.length > 0 ? selectedStyles : undefined,
      materials: selectedMaterials.length > 0 ? selectedMaterials : undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sortBy,
    };

    onApplyFilter(filter);
    onClose();
  };

  const handleResetFilter = () => {
    if (statistics) {
      setPriceRange(statistics.priceRange);
      setSizeRange(statistics.sizeRange);
      setYearRange(statistics.yearRange);
    }
    setSelectedStyles([]);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setSortBy('newest');
  };

  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: (items: string[]) => void) => {
    setSelectedItems(
      selectedItems.includes(item)
        ? selectedItems.filter(i => i !== item)
        : [...selectedItems, item]
    );
  };

  const sortOptions = [
    { key: 'newest', label: 'Latest', icon: '🆕' },
    { key: 'oldest', label: 'Oldest', icon: '📅' },
    { key: 'price_low', label: 'Price ↗', icon: '💰' },
    { key: 'price_high', label: 'Price ↘', icon: '💎' },
    { key: 'popular', label: 'Popular', icon: '❤️' },
    { key: 'trending', label: 'Trending', icon: '🔥' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* <BlurView intensity={20} style={StyleSheet.absoluteFill} /> */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        
        <Animated.View 
          style={[
            styles.container,
            {
              backgroundColor: isDark ? colors.darkBackground : colors.background,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* 핸들 바 */}
          <View style={styles.handleBar}>
            <View style={[
              styles.handle,
              { backgroundColor: isDark ? colors.darkBorder : colors.border }
            ]} />
          </View>

          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeIcon, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                ✕
              </Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
              Smart Filters
            </Text>
            <TouchableOpacity onPress={handleResetFilter} style={styles.resetButton}>
              <Text style={[styles.resetText, { color: colors.primary }]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 가격 범위 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                💰 Price Range
              </Text>
              <View style={styles.priceContainer}>
                <View style={styles.priceDisplay}>
                  <Text style={[styles.priceText, { color: colors.primary }]}>
                    ${priceRange.min.toLocaleString()}
                  </Text>
                  <Text style={[styles.priceSeparator, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    —
                  </Text>
                  <Text style={[styles.priceText, { color: colors.primary }]}>
                    ${priceRange.max.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={statistics?.priceRange?.max || 10000}
                    value={priceRange.min}
                    onValueChange={(value) => setPriceRange(prev => ({ ...prev, min: Math.round(value) }))}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                    thumbStyle={styles.sliderThumb}
                  />
                  <Slider
                    style={styles.slider}
                    minimumValue={priceRange.min}
                    maximumValue={statistics?.priceRange?.max || 10000}
                    value={priceRange.max}
                    onValueChange={(value) => setPriceRange(prev => ({ ...prev, max: Math.round(value) }))}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                    thumbStyle={styles.sliderThumb}
                  />
                </View>
              </View>
            </View>

            {/* 색상 팔레트 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                🎨 Color Palette
              </Text>
              <View style={styles.colorGrid}>
                {trendyColors.map((color) => (
                  <TouchableOpacity
                    key={color.hex}
                    style={[
                      styles.colorItem,
                      { backgroundColor: color.hex },
                      selectedColors.includes(color.hex) && styles.selectedColorItem
                    ]}
                    onPress={() => toggleSelection(color.hex, selectedColors, setSelectedColors)}
                    activeOpacity={0.8}
                  >
                    {selectedColors.includes(color.hex) && (
                      <View style={styles.colorCheckContainer}>
                        <Text style={styles.colorCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 스타일 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                🖼️ Art Style
              </Text>
              <View style={styles.chipContainer}>
                {styles.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedStyles.includes(style.id)
                          ? colors.primary
                          : (isDark ? colors.darkCard : colors.card),
                        borderColor: selectedStyles.includes(style.id)
                          ? colors.primary
                          : (isDark ? colors.darkBorder : colors.border),
                      }
                    ]}
                    onPress={() => toggleSelection(style.id, selectedStyles, setSelectedStyles)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      {
                        color: selectedStyles.includes(style.id)
                          ? colors.white
                          : (isDark ? colors.darkText : colors.text)
                      }
                    ]}>
                      {style.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 재료 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                🎭 Material
              </Text>
              <View style={styles.chipContainer}>
                {materials.map((material) => (
                  <TouchableOpacity
                    key={material.material}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedMaterials.includes(material.material)
                          ? colors.primary
                          : (isDark ? colors.darkCard : colors.card),
                        borderColor: selectedMaterials.includes(material.material)
                          ? colors.primary
                          : (isDark ? colors.darkBorder : colors.border),
                      }
                    ]}
                    onPress={() => toggleSelection(material.material, selectedMaterials, setSelectedMaterials)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      {
                        color: selectedMaterials.includes(material.material)
                          ? colors.white
                          : (isDark ? colors.darkText : colors.text)
                      }
                    ]}>
                      {material.material}
                    </Text>
                    <Text style={[
                      styles.chipCount,
                      {
                        color: selectedMaterials.includes(material.material)
                          ? colors.white + '80'
                          : (isDark ? colors.darkTextMuted : colors.textMuted)
                      }
                    ]}>
                      {material.count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 정렬 옵션 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                📊 Sort By
              </Text>
              <View style={styles.sortContainer}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: sortBy === option.key
                          ? colors.primary + '20'
                          : (isDark ? colors.darkCard : colors.card),
                        borderColor: sortBy === option.key
                          ? colors.primary
                          : (isDark ? colors.darkBorder : colors.border),
                      }
                    ]}
                    onPress={() => setSortBy(option.key as AdvancedFilter['sortBy'])}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sortIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.sortText,
                      {
                        color: sortBy === option.key
                          ? colors.primary
                          : (isDark ? colors.darkText : colors.text)
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={[
            styles.footer,
            { backgroundColor: isDark ? colors.darkCard : colors.card }
          ]}>
            <Button
              title="Apply Filters"
              onPress={handleApplyFilter}
              style={styles.applyButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: screenHeight * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
  },
  resetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resetText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  priceContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: spacing.lg,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceText: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
  },
  priceSeparator: {
    fontSize: typography.h3.fontSize,
    marginHorizontal: spacing.md,
  },
  sliderContainer: {
    gap: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColorItem: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  colorCheckContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  chipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  chipCount: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    minWidth: (screenWidth - spacing.lg * 2 - spacing.sm) / 2,
  },
  sortIcon: {
    fontSize: 18,
  },
  sortText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    width: '100%',
  },
});
