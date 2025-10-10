/**
 * 고급 필터링 모달 컴포넌트
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
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography } from '../constants/theme';
import { Button } from './Button';
import { AdvancedFilter, ArtworkStyle } from '../types/advanced';
import { getArtworkStyles, getFilterStatistics } from '../services/advancedFilterService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: AdvancedFilter) => void;
  initialFilter?: AdvancedFilter;
}

export const AdvancedFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  onApplyFilter,
  initialFilter,
}) => {
  const isDark = useColorScheme() === 'dark';
  
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

  // 인기 색상 팔레트
  const popularColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#C44569', '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8',
  ];

  useEffect(() => {
    if (visible) {
      loadFilterData();
      if (initialFilter) {
        applyInitialFilter(initialFilter);
      }
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

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const sortOptions = [
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'price_low', label: 'Price: Low to High' },
    { key: 'price_high', label: 'Price: High to Low' },
    { key: 'popular', label: 'Most Popular' },
    { key: 'trending', label: 'Trending' },
  ];

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
          { backgroundColor: isDark ? colors.darkCard : colors.card }
        ]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerButton, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            { color: isDark ? colors.darkText : colors.text }
          ]}>
            Advanced Filters
          </Text>
          <TouchableOpacity onPress={handleResetFilter}>
            <Text style={[styles.headerButton, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 가격 범위 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Price Range
            </Text>
            <View style={styles.rangeContainer}>
              <Text style={[styles.rangeLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                ${priceRange.min} - ${priceRange.max}
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Min: ${priceRange.min}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={statistics?.priceRange?.max || 10000}
                value={priceRange.min}
                onValueChange={(value) => setPriceRange(prev => ({ ...prev, min: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Max: ${priceRange.max}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={priceRange.min}
                maximumValue={statistics?.priceRange?.max || 10000}
                value={priceRange.max}
                onValueChange={(value) => setPriceRange(prev => ({ ...prev, max: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>
          </View>

          {/* 작품 크기 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Artwork Size (cm)
            </Text>
            <View style={styles.sizeInputContainer}>
              <View style={styles.sizeInputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Width: {sizeRange.width.min} - {sizeRange.width.max} cm
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={500}
                  value={sizeRange.width.min}
                  onValueChange={(value) => setSizeRange(prev => ({
                    ...prev,
                    width: { ...prev.width, min: Math.round(value) }
                  }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={sizeRange.width.min}
                  maximumValue={500}
                  value={sizeRange.width.max}
                  onValueChange={(value) => setSizeRange(prev => ({
                    ...prev,
                    width: { ...prev.width, max: Math.round(value) }
                  }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                />
              </View>
              <View style={styles.sizeInputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Height: {sizeRange.height.min} - {sizeRange.height.max} cm
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={500}
                  value={sizeRange.height.min}
                  onValueChange={(value) => setSizeRange(prev => ({
                    ...prev,
                    height: { ...prev.height, min: Math.round(value) }
                  }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={sizeRange.height.min}
                  maximumValue={500}
                  value={sizeRange.height.max}
                  onValueChange={(value) => setSizeRange(prev => ({
                    ...prev,
                    height: { ...prev.height, max: Math.round(value) }
                  }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                />
              </View>
            </View>
          </View>

          {/* 제작 연도 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Year Created
            </Text>
            <Text style={[styles.rangeLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {yearRange.min} - {yearRange.max}
            </Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1900}
                maximumValue={new Date().getFullYear()}
                value={yearRange.min}
                onValueChange={(value) => setYearRange(prev => ({ ...prev, min: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
              />
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={yearRange.min}
                maximumValue={new Date().getFullYear()}
                value={yearRange.max}
                onValueChange={(value) => setYearRange(prev => ({ ...prev, max: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
              />
            </View>
          </View>

          {/* 색상 팔레트 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Color Palette
            </Text>
            <View style={styles.colorGrid}>
              {popularColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedColors.includes(color) && styles.selectedColorItem
                  ]}
                  onPress={() => toggleColor(color)}
                >
                  {selectedColors.includes(color) && (
                    <Text style={styles.colorCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 스타일 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Art Style
            </Text>
            <View style={styles.tagContainer}>
              {styles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: selectedStyles.includes(style.id)
                        ? colors.primary
                        : (isDark ? colors.darkCard : colors.card),
                      borderColor: selectedStyles.includes(style.id)
                        ? colors.primary
                        : (isDark ? colors.darkBorder : colors.border),
                    }
                  ]}
                  onPress={() => toggleStyle(style.id)}
                >
                  <Text style={[
                    styles.tagText,
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
              Material
            </Text>
            <View style={styles.tagContainer}>
              {materials.map((material) => (
                <TouchableOpacity
                  key={material.material}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: selectedMaterials.includes(material.material)
                        ? colors.primary
                        : (isDark ? colors.darkCard : colors.card),
                      borderColor: selectedMaterials.includes(material.material)
                        ? colors.primary
                        : (isDark ? colors.darkBorder : colors.border),
                    }
                  ]}
                  onPress={() => toggleMaterial(material.material)}
                >
                  <Text style={[
                    styles.tagText,
                    {
                      color: selectedMaterials.includes(material.material)
                        ? colors.white
                        : (isDark ? colors.darkText : colors.text)
                    }
                  ]}>
                    {material.material} ({material.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 정렬 옵션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Sort By
            </Text>
            <View style={styles.tagContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: sortBy === option.key
                        ? colors.primary
                        : (isDark ? colors.darkCard : colors.card),
                      borderColor: sortBy === option.key
                        ? colors.primary
                        : (isDark ? colors.darkBorder : colors.border),
                    }
                  ]}
                  onPress={() => setSortBy(option.key as AdvancedFilter['sortBy'])}
                >
                  <Text style={[
                    styles.tagText,
                    {
                      color: sortBy === option.key
                        ? colors.white
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.md,
  },
  rangeContainer: {
    marginBottom: spacing.sm,
  },
  rangeLabel: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  sliderContainer: {
    marginVertical: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sizeInputContainer: {
    gap: spacing.md,
  },
  sizeInputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorItem: {
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  colorCheckmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    width: '100%',
  },
});
