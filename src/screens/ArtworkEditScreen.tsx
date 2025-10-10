/**
 * 작품 수정 화면
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../hooks/useTheme';
import { useUpdateArtwork } from '../hooks/useArtworks';
import { spacing, typography } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import type { Artwork, Material } from '../types';

type ArtworkEditScreenRouteProp = RouteProp<RootStackParamList, 'ArtworkEdit'>;
type ArtworkEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ArtworkEdit'>;

interface RouteParams {
  artwork: Artwork;
}

const MATERIALS: Material[] = [
  'Oil Paint',
  'Acrylic Paint',
  'Watercolor',
  'Digital Art',
  'Pencil Drawing',
  'Charcoal',
  'Mixed Media',
  'Photography',
  'Sculpture',
  'Printmaking',
  'Ink',
  'Pastel',
  'Other'
];

export const ArtworkEditScreen: React.FC = () => {
  const navigation = useNavigation<ArtworkEditScreenNavigationProp>();
  const route = useRoute<ArtworkEditScreenRouteProp>();
  const { colors, isDark } = useTheme();
  const updateArtworkMutation = useUpdateArtwork();

  const { artwork } = route.params as RouteParams;

  // 폼 상태
  const [formData, setFormData] = useState({
    title: artwork.title || '',
    description: artwork.description || '',
    material: artwork.material || 'Oil Paint',
    size: artwork.size || '',
    year: artwork.year?.toString() || new Date().getFullYear().toString(),
    edition: artwork.edition || '',
    price: artwork.price || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.size.trim()) {
      newErrors.size = 'Size is required';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
        newErrors.year = `Year must be between 1800 and ${currentYear}`;
      }
    }

    if (formData.price && !/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      newErrors.price = 'Price must be a valid number (e.g., 100 or 100.50)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('✏️ 작품 수정 시작:', artwork.id);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        material: formData.material,
        size: formData.size.trim(),
        year: parseInt(formData.year),
        edition: formData.edition.trim() || undefined,
        price: formData.price.trim() || undefined,
      };

      await updateArtworkMutation.mutateAsync({
        artworkId: artwork.id,
        updateData,
      });

      console.log('✅ 작품 수정 완료');

      // 성공 메시지
      const successMessage = 'Artwork updated successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }

      // 이전 화면으로 돌아가기
      navigation.goBack();

    } catch (error: any) {
      console.error('💥 작품 수정 실패:', error);
      
      const errorMessage = `Failed to update artwork: ${error.message}`;
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  }, [formData, validateForm, artwork.id, updateArtworkMutation, navigation]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <Screen style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Edit Artwork
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={updateArtworkMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, { color: colors.white }]}>
            {updateArtworkMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 로딩 상태 */}
      {updateArtworkMutation.isPending && (
        <LoadingSpinner message="Updating artwork..." />
      )}

      {/* 폼 */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 제목 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Title *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: errors.title ? colors.danger : (isDark ? colors.darkBorder : colors.border),
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            placeholder="Enter artwork title"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            maxLength={100}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.title}
            </Text>
          )}
        </View>

        {/* 설명 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Description *
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: errors.description ? colors.danger : (isDark ? colors.darkBorder : colors.border),
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your artwork"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          {errors.description && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.description}
            </Text>
          )}
        </View>

        {/* 재료 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Material *
          </Text>
          <View style={styles.materialGrid}>
            {MATERIALS.map((material) => (
              <TouchableOpacity
                key={material}
                style={[
                  styles.materialChip,
                  {
                    backgroundColor: formData.material === material 
                      ? colors.primary 
                      : (isDark ? colors.darkCard : colors.card),
                    borderColor: formData.material === material 
                      ? colors.primary 
                      : (isDark ? colors.darkBorder : colors.border),
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, material }))}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.materialChipText,
                  {
                    color: formData.material === material 
                      ? colors.white 
                      : (isDark ? colors.darkText : colors.text),
                  }
                ]}>
                  {material}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 크기 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Size * (e.g., "50 x 70 cm")
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: errors.size ? colors.danger : (isDark ? colors.darkBorder : colors.border),
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.size}
            onChangeText={(text) => setFormData(prev => ({ ...prev, size: text }))}
            placeholder="Enter artwork size"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            maxLength={50}
          />
          {errors.size && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.size}
            </Text>
          )}
        </View>

        {/* 제작년도 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Year *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: errors.year ? colors.danger : (isDark ? colors.darkBorder : colors.border),
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.year}
            onChangeText={(text) => setFormData(prev => ({ ...prev, year: text.replace(/[^0-9]/g, '') }))}
            placeholder="Enter creation year"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            keyboardType="numeric"
            maxLength={4}
          />
          {errors.year && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.year}
            </Text>
          )}
        </View>

        {/* 에디션 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Edition (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: isDark ? colors.darkBorder : colors.border,
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.edition}
            onChangeText={(text) => setFormData(prev => ({ ...prev, edition: text }))}
            placeholder="e.g., 1/10, Limited Edition"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            maxLength={50}
          />
        </View>

        {/* 가격 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
            Price (USD, Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderColor: errors.price ? colors.danger : (isDark ? colors.darkBorder : colors.border),
                color: isDark ? colors.darkText : colors.text,
              }
            ]}
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text.replace(/[^0-9.]/g, '') }))}
            placeholder="Enter price (e.g., 500)"
            placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.price && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.price}
            </Text>
          )}
        </View>

        {/* 하단 여백 */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  saveButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  materialChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  materialChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
