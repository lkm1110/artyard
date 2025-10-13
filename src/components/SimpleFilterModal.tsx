/**
 * 간단한 필터 모달 - 가격과 사이즈만
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Button } from './Button';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleFilter {
  priceRange?: { min: number; max: number };
  sizeRange?: { min: number; max: number };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: SimpleFilter) => void;
  initialFilter?: SimpleFilter;
}

export const SimpleFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  onApplyFilter,
  initialFilter,
}) => {
  const isDark = useColorScheme() === 'dark';
  
  // 필터 상태 (기본값 설정)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sizeRange, setSizeRange] = useState({ min: 10, max: 150 });

  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.priceRange) {
        setPriceRange(initialFilter.priceRange);
      }
      if (initialFilter.sizeRange) {
        setSizeRange(initialFilter.sizeRange);
      }
    }
  }, [initialFilter]);

  const handleApplyFilter = () => {
    const filter: SimpleFilter = {
      priceRange: priceRange.min > 0 || priceRange.max < 1000 ? priceRange : undefined,
      sizeRange: sizeRange.min > 10 || sizeRange.max < 150 ? sizeRange : undefined,
    };

    onApplyFilter(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setPriceRange({ min: 0, max: 1000 });
    setSizeRange({ min: 10, max: 150 });
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
          
          <Text style={[
            styles.title,
            { color: isDark ? colors.darkText : colors.text }
          ]}>
            Filters
          </Text>
          
          <TouchableOpacity
            onPress={handleResetFilter}
            style={styles.resetButton}
          >
            <Text style={[styles.resetText, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* 필터 내용 */}
        <View style={styles.content}>
          
          {/* 가격 필터 */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              💰 Price Range
            </Text>
            
            <View style={[
              styles.filterCard,
              { backgroundColor: isDark ? colors.darkCard : colors.card }
            ]}>
              <View style={styles.priceDisplay}>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Min
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>
                    ${priceRange.min}
                  </Text>
                </View>
                
                <Text style={[styles.priceSeparator, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  —
                </Text>
                
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Max
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>
                    ${priceRange.max}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Minimum Price
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={500}
                  step={10}
                  value={priceRange.min}
                  onValueChange={(value) => setPriceRange(prev => ({ ...prev, min: Math.round(value) }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                  thumbStyle={{ backgroundColor: colors.primary, width: 20, height: 20 }}
                />
                
                <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Maximum Price
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={priceRange.min}
                  maximumValue={1000}
                  step={10}
                  value={priceRange.max}
                  onValueChange={(value) => setPriceRange(prev => ({ ...prev, max: Math.round(value) }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                  thumbStyle={{ backgroundColor: colors.primary, width: 20, height: 20 }}
                />
              </View>
            </View>
          </View>

          {/* 사이즈 필터 */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              📏 Size Range (cm)
            </Text>
            
            <View style={[
              styles.filterCard,
              { backgroundColor: isDark ? colors.darkCard : colors.card }
            ]}>
              <View style={styles.priceDisplay}>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Min
                  </Text>
                  <Text style={[styles.priceValue, { color: '#FF6B6B' }]}>
                    {sizeRange.min}cm
                  </Text>
                </View>
                
                <Text style={[styles.priceSeparator, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  —
                </Text>
                
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    Max
                  </Text>
                  <Text style={[styles.priceValue, { color: '#FF6B6B' }]}>
                    {sizeRange.max}cm
                  </Text>
                </View>
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Minimum Size
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={10}
                  maximumValue={75}
                  step={5}
                  value={sizeRange.min}
                  onValueChange={(value) => setSizeRange(prev => ({ ...prev, min: Math.round(value) }))}
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                  thumbStyle={{ backgroundColor: '#FF6B6B', width: 20, height: 20 }}
                />
                
                <Text style={[styles.sliderLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Maximum Size
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={sizeRange.min}
                  maximumValue={150}
                  step={5}
                  value={sizeRange.max}
                  onValueChange={(value) => setSizeRange(prev => ({ ...prev, max: Math.round(value) }))}
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor={isDark ? colors.darkBorder : colors.border}
                  thumbStyle={{ backgroundColor: '#FF6B6B', width: 20, height: 20 }}
                />
              </View>
            </View>
          </View>
          
        </View>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
  },
  resetButton: {
    padding: spacing.sm,
  },
  resetText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  filterCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
  },
  priceSeparator: {
    fontSize: typography.h3.fontSize,
    fontWeight: '300',
  },
  sliderContainer: {
    gap: spacing.md,
  },
  sliderLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
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
