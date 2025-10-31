/**
 * 작품 업로드 화면
 * 이미지 선택, 메타데이터 입력, 업로드
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
// import { LoadingSpinner } from '../components/LoadingSpinner'; // 더 이상 사용하지 않음
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { useUploadArtwork } from '../hooks/useArtworks';
import { uploadImagesToStorage } from '../services/imageUploadService';
import { getCurrentLocation, askForLocationConsent, formatLocationText, LocationInfo } from '../services/locationService';
import { Material } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface FormData {
  title: string;
  description: string;
  material: Material;
  category: string;
  sizeWidth: string;
  sizeHeight: string;
  year: number;
  edition: string;
  price: string;
  images: string[];
  location?: LocationInfo;
}

const MATERIAL_OPTIONS: Material[] = [
  'Illustration',
  'Photography', 
  'Printmaking',
  'Craft',
  'Design Poster',
  'Drawing',
  'Other'
];

const CATEGORY_OPTIONS = [
  'Painting',
  'Sculpture',
  'Photography',
  'Digital Art',
  'Drawing',
  'Print',
  'Mixed Media',
  'Other',
];

// PRICE_BAND_OPTIONS 제거됨 - 직접 입력으로 변경

export const ArtworkUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    material: 'Illustration',
    category: 'Painting',
    sizeWidth: '',
    sizeHeight: '',
    year: new Date().getFullYear(),
    edition: '',
    price: '',
    images: [],
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // 실제 업로드 훅
  const uploadArtworkMutation = useUploadArtwork();

  const requestPermissions = useCallback(async () => {
    // 카메라 권한 요청
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'ArtYard needs camera and photo library access to upload artwork images. Please enable permissions in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }, []);

  const pickImageFromCamera = useCallback(async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5], // 일반적인 작품 비율
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUri].slice(0, 5), // 최대 5장
        }));
      }
    } catch (error) {
      console.error('카메라 에러:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [requestPermissions]);

  const pickImageFromGallery = useCallback(async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - formData.images.length, // 남은 슬롯만큼
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 5),
        }));
      }
    } catch (error) {
      console.error('갤러리 에러:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  }, [requestPermissions, formData.images.length]);

  const removeImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  // 웹용 파일 선택
  const pickImageFromWeb = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const remainingSlots = 5 - formData.images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        
        filesToProcess.forEach((file: any) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setFormData(prev => ({
                ...prev,
                images: [...prev.images, e.target!.result as string].slice(0, 5),
              }));
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    
    input.click();
  }, [formData.images.length]);

  const showImagePickerOptions = useCallback(() => {
    if (Platform.OS === 'web') {
      // 웹에서는 직접 파일 선택
      pickImageFromWeb();
    } else {
      // 모바일에서는 카메라/갤러리 선택
      Alert.alert(
        'Add Image',
        'Choose how you want to add your artwork image',
        [
          { text: 'Camera', onPress: pickImageFromCamera },
          { text: 'Photo Library', onPress: pickImageFromGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [pickImageFromCamera, pickImageFromGallery, pickImageFromWeb]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.sizeWidth.trim()) {
      newErrors.sizeWidth = 'Width is required';
    } else if (parseInt(formData.sizeWidth) <= 0 || parseInt(formData.sizeWidth) > 9999) {
      newErrors.sizeWidth = 'Width must be between 1-9999 cm';
    }

    if (!formData.sizeHeight.trim()) {
      newErrors.sizeHeight = 'Height is required';
    } else if (parseInt(formData.sizeHeight) <= 0 || parseInt(formData.sizeHeight) > 9999) {
      newErrors.sizeHeight = 'Height must be between 1-9999 cm';
    }

    if (!formData.edition.trim()) {
      newErrors.edition = 'Edition is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required' as any;
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear()) {
      newErrors.year = 'Please enter a valid year' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleUpload = useCallback(async () => {
    console.log('🎨 Upload button clicked!');
    
    if (!user) {
      console.error('❌ No user logged in');
      Alert.alert('Error', 'Please log in first');
      return;
    }

    console.log('✅ User found:', user.handle);
    console.log('📝 Form data:', formData);
    
    const isValid = validateForm();
    console.log('📋 Form validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Form validation failed');
      console.log('🚨 Form errors:', errors);
      return;
    }

    setIsUploading(true);
    console.log('⬆️ Starting real upload process...');
    
    try {
      console.log('📸 Step 1: Uploading images to Supabase Storage...');
      const uploadedImageUrls = await uploadImagesToStorage(formData.images);
      console.log('✅ Images uploaded successfully:', uploadedImageUrls);

      console.log('📍 Step 2: Getting location information...');
      let locationInfo: LocationInfo | null = null;
      
      // 사용자에게 위치 정보 수집 동의 요청
      const userConsent = await askForLocationConsent();
      if (userConsent) {
        try {
          locationInfo = await getCurrentLocation({
            timeout: 10000,
            accuracy: Location.Accuracy.Balanced
          });
          console.log('✅ Location collected:', locationInfo);
        } catch (error) {
          console.log('⚠️ Failed to get location, proceeding without it:', error);
        }
      } else {
        console.log('ℹ️ User declined location sharing');
      }

      console.log('💾 Step 3: Saving artwork data to database...');
      const artworkData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        material: formData.material,
        category: formData.category,
        size: `${formData.sizeWidth}×${formData.sizeHeight}cm`,
        year: formData.year,
        edition: formData.edition.trim(),
        price: formData.price,
        images: uploadedImageUrls,
        // 위치 정보 추가 (있는 경우에만)
        ...(locationInfo && {
          location_latitude: locationInfo.latitude,
          location_longitude: locationInfo.longitude,
          location_country: locationInfo.country,
          location_state: locationInfo.state,
          location_city: locationInfo.city,
          location_district: locationInfo.district,
          location_street: locationInfo.street,
          location_name: locationInfo.name,
          location_full: formatLocationText(locationInfo),
          location_accuracy: locationInfo.accuracy,
          location_timestamp: locationInfo.timestamp,
        }),
      };

      const newArtwork = await uploadArtworkMutation.mutateAsync(artworkData);
      console.log('🎉 Artwork saved to database:', newArtwork.id);

      console.log('🚀 Upload completed successfully!');
      
      // 성공 메시지 표시 (웹에서는 콘솔, 모바일에서는 Alert)
      if (Platform.OS === 'web') {
        console.log('🎉 성공! 작품이 성공적으로 업로드되었습니다! 메인 페이지로 이동합니다...');
        // 웹에서는 바로 이동 (2초 후)
        setTimeout(() => {
          console.log('👈 Navigating to main feed...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' as never }],
          });
        }, 2000);
      } else {
        // 모바일에서는 Alert 사용
        Alert.alert(
          'Success!',
          'Your artwork has been uploaded successfully! 🎉',
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('👈 Navigating to main feed...');
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' as never }],
              });
            }
          }]
        );
      }
    } catch (error) {
      console.error('💥 업로드 실패:', error);
      
      let errorMessage = 'Failed to upload your artwork. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      console.log('🔄 Upload process finished');
    }
  }, [user, formData, validateForm, navigation, errors, uploadArtworkMutation]);

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  if (!user) {
    return (
      <Screen>
        <Text style={{ textAlign: 'center', padding: 20, color: isDark ? colors.darkText : colors.text }}>
          Loading...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerButtonText, { color: isDark ? colors.darkText : colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Upload Artwork
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Upload Section */}
          <View style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Images * (Max 5)
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageScrollContainer}
            >
              {/* Existing Images */}
              {formData.images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add Image Button */}
              {formData.images.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    { 
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      borderColor: isDark ? colors.darkTextMuted : colors.textMuted,
                    }
                  ]}
                  onPress={showImagePickerOptions}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.addImageIcon,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted }
                  ]}>
                    📷
                  </Text>
                  <Text style={[
                    styles.addImageText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted }
                  ]}>
                    {Platform.OS === 'web' ? 'Upload from PC' : 'Add Image'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            {errors.images && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.images as string}
              </Text>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.title ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Enter artwork title"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
                maxLength={100}
              />
              {errors.title && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.title}
                </Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Description *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.description ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Describe your artwork, inspiration, techniques used..."
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                maxLength={1000}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.description && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.description}
                </Text>
              )}
              <Text style={[styles.characterCount, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {formData.description.length}/1000 characters
              </Text>
            </View>

            {/* Material */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Medium *
              </Text>
              <TouchableOpacity
                style={[
                  styles.picker,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    borderColor: 'transparent',
                  }
                ]}
                onPress={() => setShowMaterialPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerText, { color: isDark ? colors.darkText : colors.text }]}>
                  {formData.material}
                </Text>
                <Text style={[styles.pickerArrow, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Category *
              </Text>
              <TouchableOpacity
                style={[
                  styles.picker,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    borderColor: 'transparent',
                  }
                ]}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerText, { color: isDark ? colors.darkText : colors.text }]}>
                  {formData.category}
                </Text>
                <Text style={[styles.pickerArrow, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>

            {/* Size (Width × Height) */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Size (cm) *
              </Text>
              <View style={styles.sizeRow}>
                <TextInput
                  style={[
                    styles.sizeInput,
                    {
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: errors.sizeWidth ? colors.danger : 'transparent',
                    }
                  ]}
                  placeholder="Width"
                  placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                  value={formData.sizeWidth}
                  onChangeText={(text) => updateField('sizeWidth', text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={[styles.sizeMultiply, { color: isDark ? colors.darkText : colors.text }]}>×</Text>
                <TextInput
                  style={[
                    styles.sizeInput,
                    {
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: errors.sizeHeight ? colors.danger : 'transparent',
                    }
                  ]}
                  placeholder="Height"
                  placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                  value={formData.sizeHeight}
                  onChangeText={(text) => updateField('sizeHeight', text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={[styles.sizeUnit, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>cm</Text>
              </View>
              {(errors.sizeWidth || errors.sizeHeight) && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.sizeWidth || errors.sizeHeight}
                </Text>
              )}
            </View>

            {/* Year & Edition */}
            <View style={styles.rowContainer}>
              <View style={[styles.fieldContainer, { flex: 1, marginRight: spacing.md }]}>
                <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                  Year *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: errors.year ? colors.danger : 'transparent',
                    }
                  ]}
                  placeholder="2024"
                  placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                  value={formData.year.toString()}
                  onChangeText={(text) => updateField('year', parseInt(text) || new Date().getFullYear())}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.year && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.year as string}
                  </Text>
                )}
              </View>

              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                  Edition *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: errors.edition ? colors.danger : 'transparent',
                    }
                  ]}
                  placeholder="e.g. Original, 1/10"
                  placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                  value={formData.edition}
                  onChangeText={(text) => updateField('edition', text)}
                  maxLength={30}
                />
                {errors.edition && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.edition}
                  </Text>
                )}
              </View>
            </View>

            {/* Price */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Price (USD) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.price ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Enter price (e.g., 50, 100-200, 100)"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.price}
                onChangeText={(text) => updateField('price', text.replace(/[^0-9\-$.,]/g, ''))}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {errors.price && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.price as string}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={[
          styles.bottomButtonContainer,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderTopColor: isDark ? colors.darkBorder : colors.border,
          }
        ]}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text 
              style={[styles.cancelButtonText, { color: isDark ? colors.darkText : colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.bottomButton, 
              styles.uploadButton,
              { 
                backgroundColor: colors.primary,
                opacity: isUploading ? 0.7 : 1 
              }
            ]}
            onPress={handleUpload}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            <Text 
              style={styles.uploadButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit={true}
              minimumFontScale={0.85}
            >
              {isUploading ? 'Uploading...' : 'Upload Artwork'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Material Picker Modal */}
        {showMaterialPicker && (
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: isDark ? colors.darkCard : colors.bg }]}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
                Select Medium
              </Text>
              <ScrollView 
                style={styles.pickerScrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {MATERIAL_OPTIONS.map((material) => (
                  <TouchableOpacity
                    key={material}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateField('material', material);
                      setShowMaterialPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { 
                        color: formData.material === material ? colors.primary : (isDark ? colors.darkText : colors.text),
                        fontWeight: formData.material === material ? '600' : '400',
                      }
                    ]}>
                      {material}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMaterialPicker(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCloseText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: isDark ? colors.darkCard : colors.bg }]}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
                Select Category
              </Text>
              <ScrollView 
                style={styles.pickerScrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateField('category', category);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { 
                        color: formData.category === category ? colors.primary : (isDark ? colors.darkText : colors.text),
                        fontWeight: formData.category === category ? '600' : '400',
                      }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryPicker(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCloseText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Price Picker Modal 제거됨 - 직접 입력으로 변경 */}
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
    zIndex: 1000,
  },
  headerButton: {
    paddingVertical: spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    ...typography.body,
    fontSize: 16,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 350, // 하단 버튼 공간 확보 (안드로이드 네비게이션 바 고려)
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  imageSection: {
    padding: spacing.md,
  },
  imageScrollContainer: {
    paddingHorizontal: spacing.xs,
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  uploadedImage: {
    width: 120,
    height: 150,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addImageButton: {
    width: 120,
    height: 150,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  addImageText: {
    ...typography.caption,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.xl,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  textArea: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 120,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  pickerText: {
    ...typography.body,
  },
  pickerArrow: {
    ...typography.caption,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  characterCount: {
    ...typography.small,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  pickerModal: {
    width: screenWidth * 0.8,
    maxHeight: screenWidth * 1.2, // 최대 높이 제한
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden', // 스크롤 가능하도록
  },
  pickerScrollView: {
    maxHeight: screenWidth * 0.9, // 모달 내용이 스크롤 가능하도록
  },
  modalTitle: {
    ...typography.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerOptionText: {
    ...typography.body,
    textAlign: 'center',
  },
  modalCloseButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  modalCloseText: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: '600',
  },
  // 헤더 스페이서
  headerSpacer: {
    width: 60, // headerButton과 동일한 너비로 균형 맞추기
  },
  // 하단 버튼 컨테이너
  bottomButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg, // 적절한 하단 여백
    borderTopWidth: 1,
    gap: spacing.md,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: spacing.md + 6, // 패딩 더 증가
    paddingHorizontal: spacing.md, // 좌우 패딩 증가
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // 최소 높이 더 증가
    overflow: 'hidden', // 텍스트가 밖으로 나가지 않도록
    ...shadows.sm,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  uploadButton: {
    // backgroundColor는 동적으로 설정됨
  },
  cancelButtonText: {
    ...typography.button,
    fontSize: 15, // 폰트 크기 명시
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20, // 라인 높이 명시
  },
  uploadButtonText: {
    ...typography.button,
    fontSize: 15, // 폰트 크기 명시
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20, // 라인 높이 명시
  },
  // 사이즈 입력 필드 관련 스타일
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body.fontSize,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    textAlign: 'center',
  },
  sizeMultiply: {
    fontSize: typography.heading.fontSize,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
  },
  sizeUnit: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    minWidth: 24,
  },
});
