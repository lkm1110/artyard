/**
 * 작품 업로드 화면
 * 이미지 선택, 메타데이터 입력, 업로드
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
// import { LoadingSpinner } from '../components/LoadingSpinner'; // 더 이상 사용하지 않음
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { useUploadArtwork } from '../hooks/useArtworks';
import { uploadImagesToStorage } from '../services/imageUploadService';
import { supabase } from '../services/supabase';
import { CustomAlert } from '../components/CustomAlert';
import { getCurrentLocation, askForLocationConsent, formatLocationText, LocationInfo } from '../services/locationService';
import { Material } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface FormData {
  title: string;
  artistName: string;
  description: string;
  type: string; // Material과 Category 통합
  sizeWidth: string;
  sizeHeight: string;
  sizeDepth: string; // 깊이 (선택 사항) - 조각, 도자기, 설치미술 등
  year: number;
  edition: 'Original' | 'Limited' | 'Copy';
  editionNumber: string; // e.g., "1/300"
  price: string;
  images: string[];
  location?: LocationInfo;
  challengeId?: string; // 챌린지 참가
}

const TYPE_OPTIONS = [
  'Painting',          // 회화
  'Drawing',           // 드로잉
  'Illustration',      // 일러스트레이션
  'Photography',       // 사진
  'Digital Art',       // 디지털 아트
  'Printmaking',       // 판화
  'Sculpture',         // 조각
  'Ceramics',          // 도자기
  'Textile Art',       // 섬유 예술
  'Collage',           // 콜라주
  'Mixed Media',       // 혼합 매체
  'Street Art',        // 거리 예술
  'Craft',             // 공예
  'Installation',      // 설치 미술
  'Other',             // 기타
];

// PRICE_BAND_OPTIONS 제거됨 - 직접 입력으로 변경

export const ArtworkUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  // Challenge ID (챌린지에서 Submit Artwork 클릭 시 전달됨)
  const challengeId = (route.params as any)?.challengeId;
  const [challengeTitle, setChallengeTitle] = useState<string>('');

  // 챌린지 정보 로드
  useEffect(() => {
    if (challengeId) {
      supabase
        .from('challenges')
        .select('title')
        .eq('id', challengeId)
        .single()
        .then(({ data }) => {
          if (data) setChallengeTitle(data.title);
        });
    }
  }, [challengeId]);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    artistName: user?.handle || '',
    description: '',
    type: 'Painting',
    sizeWidth: '',
    sizeHeight: '',
    sizeDepth: '',
    year: 0,
    edition: 'Original',
    editionNumber: '',
    price: '',
    images: [],
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);
  
  // 실제 업로드 훅
  const uploadArtworkMutation = useUploadArtwork();

  const pickImageFromCamera = useCallback(async () => {
    try {
      // 시스템 권한 요청 (시스템 다이얼로그만 표시)
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permission.status !== 'granted') {
        // 권한 거부 시 아무 작업도 하지 않음 (Apple 요구사항)
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5], // 일반적인 작품 비율
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        // iOS에서 uri가 객체일 수 있으므로 명시적으로 문자열 변환
        const imageUri = String(result.assets[0].uri);
        console.log('Camera image URI:', imageUri, typeof imageUri);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUri].slice(0, 5), // 최대 5장
        }));
      }
    } catch (error) {
      console.error('카메라 에러:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to take photo. Please try again.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  }, []);

  const pickImageFromGallery = useCallback(async () => {
    try {
      // 시스템 권한 요청 (시스템 다이얼로그만 표시)
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') {
        // 권한 거부 시 아무 작업도 하지 않음 (Apple 요구사항)
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - formData.images.length, // 남은 슬롯만큼
      });

      if (!result.canceled && result.assets.length > 0) {
        // iOS에서 uri가 객체일 수 있으므로 명시적으로 문자열 변환
        const newImages = result.assets.map(asset => String(asset.uri));
        console.log('Gallery image URIs:', newImages, newImages.map(uri => typeof uri));
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 5),
        }));
      }
    } catch (error) {
      console.error('갤러리 에러:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to select images. Please try again.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  }, [formData.images.length]);

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
      setAlertTitle('Add Image');
      setAlertMessage('Choose how you want to add your artwork image');
      setAlertButtons([
        { text: 'Camera', style: 'default', onPress: pickImageFromCamera },
        { text: 'Photo Library', style: 'default', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
      setAlertVisible(true);
    }
  }, [pickImageFromCamera, pickImageFromGallery, pickImageFromWeb]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.artistName.trim()) {
      newErrors.artistName = 'Artist name is required';
    } else if (formData.artistName.length > 100) {
      newErrors.artistName = 'Artist name must be less than 100 characters';
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

    if (formData.edition === 'Limited' && !formData.editionNumber.trim()) {
      newErrors.editionNumber = 'Edition number required (e.g., 1/300)';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    } else if (parseFloat(formData.price) > 100000000) {
      newErrors.price = 'Price cannot exceed $100,000,000';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required' as any;
    }

    if (!formData.year || formData.year < 1000 || formData.year > new Date().getFullYear()) {
      newErrors.year = 'Please enter a valid year (1000 - ' + new Date().getFullYear() + ')' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleUpload = useCallback(async () => {
    console.log('🎨 Upload button clicked!');
    
    if (!user) {
      console.error('❌ No user logged in');
      setAlertTitle('Error');
      setAlertMessage('Please log in first');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
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
      const editionString = formData.edition === 'Limited' && formData.editionNumber
        ? `Limited Edition ${formData.editionNumber}`
        : formData.edition;
      
      // Size 계산 (깊이가 있으면 3D, 없으면 2D)
      const sizeString = formData.sizeDepth && formData.sizeDepth.trim()
        ? `${formData.sizeWidth}×${formData.sizeHeight}×${formData.sizeDepth}cm`
        : `${formData.sizeWidth}×${formData.sizeHeight}cm`;
      
      const artworkData = {
        title: formData.title.trim(),
        artist_name: formData.artistName.trim(),
        description: formData.description.trim(),
        material: formData.type, // Type으로 통합 (DB 컬럼명은 material 유지)
        category: formData.type, // Category도 같은 값 사용
        size: sizeString,
        year: formData.year,
        edition: editionString,
        price: formData.price,
        sale_status: 'available', // 판매 가능 상태로 설정
        images: uploadedImageUrls,
        // Location 정보 (있는 경우에만)
        ...(locationInfo && {
          location_country: locationInfo.country,
          location_city: locationInfo.city,
          location_full: formatLocationText(locationInfo),
        }),
      };

      const newArtwork = await uploadArtworkMutation.mutateAsync(artworkData);
      console.log('Artwork saved to database:', newArtwork.id);

      // 챌린지 참가 처리
      if (challengeId) {
        console.log('Adding artwork to challenge:', challengeId);
        try {
          const entryData: any = {
            challenge_id: challengeId,
            artwork_id: newArtwork.id,
            author_id: user.id,
          };
          
          // 경매 최소 금액 (price 필드 = auction_reserve_price)
          if (formData.price) {
            const priceValue = parseFloat(formData.price.replace(/[^0-9.]/g, ''));
            if (priceValue > 0) {
              entryData.auction_reserve_price = priceValue;
            }
          }
          
          const { error: challengeError } = await supabase
            .from('challenge_entries')
            .insert(entryData);
          
          if (challengeError) {
            console.error('Failed to add to challenge:', challengeError);
            // 챌린지 참가 실패는 무시 (작품 업로드는 성공)
          } else {
            console.log('Successfully added to challenge!');
          }
        } catch (error) {
          console.error('Challenge entry error:', error);
        }
      }

      console.log('Upload completed successfully!');
      
      // 성공 메시지 (챌린지 참가 여부에 따라 다름)
      const successMessage = challengeId 
        ? 'Your artwork has been uploaded and submitted to the challenge!'
        : 'Your artwork has been uploaded successfully!';
      
      // 성공 메시지 표시 (웹에서는 콘솔, 모바일에서는 Alert)
      if (Platform.OS === 'web') {
        console.log('Success! Navigating to main feed...');
        // 웹에서는 바로 이동 (2초 후)
        setTimeout(() => {
          console.log('Navigating to main feed...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' as never }],
          });
        }, 2000);
      } else {
        // 모바일에서는 CustomAlert 사용
        setAlertTitle('Success!');
        setAlertMessage(successMessage);
        setAlertButtons([{ 
          text: 'OK',
          style: 'default',
          onPress: () => {
            console.log('Navigating to main feed...');
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp' as never }],
            });
          }
        }]);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('💥 업로드 실패:', error);
      
      let errorMessage = 'Failed to upload your artwork. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setAlertTitle('Upload Failed');
      setAlertMessage(errorMessage);
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
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

        {/* Challenge Badge */}
        {challengeId && challengeTitle && (
          <>
            <View style={[styles.challengeBadge, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <View style={styles.challengeBadgeText}>
                <Text style={[styles.challengeBadgeLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Submitting to Challenge
                </Text>
                <Text style={[styles.challengeBadgeTitle, { color: isDark ? colors.darkText : colors.text }]}>
                  {challengeTitle}
                </Text>
            </View>
          </View>
          </>
        )}

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

            {/* Artist Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Artist Name *
              </Text>
              <Text style={[styles.helperText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Original artist (defaults to you, change if reselling)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.artistName ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Artist name"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.artistName}
                onChangeText={(text) => updateField('artistName', text)}
                maxLength={100}
              />
              {errors.artistName && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.artistName}
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

            {/* Type (통합: Material + Category) */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Type *
              </Text>
              <TouchableOpacity
                style={[
                  styles.picker,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    borderColor: 'transparent',
                  }
                ]}
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerText, { color: isDark ? colors.darkText : colors.text }]}>
                  {formData.type}
                </Text>
                <Text style={[styles.pickerArrow, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>

            {/* Size (Width × Height × Depth) */}
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
                  placeholder=""
                  value={formData.sizeWidth}
                  onChangeText={(text) => updateField('sizeWidth', text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  maxLength={6}
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
                  placeholder=""
                  value={formData.sizeHeight}
                  onChangeText={(text) => updateField('sizeHeight', text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
                <Text style={[styles.sizeMultiply, { color: isDark ? colors.darkText : colors.text }]}>×</Text>
                <TextInput
                  style={[
                    styles.sizeInput,
                    {
                      backgroundColor: isDark ? colors.darkCard : colors.card,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: 'transparent',
                    }
                  ]}
                  placeholder=""
                  value={formData.sizeDepth}
                  onChangeText={(text) => updateField('sizeDepth', text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
                <Text style={[styles.sizeUnit, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>cm</Text>
              </View>
              <Text style={[styles.helperText, { color: isDark ? colors.darkTextMuted : colors.textMuted, fontSize: 12, marginTop: spacing.xs }]}>
                For 3D artworks (Sculpture, Ceramics, Installation), please enter depth in the third field
              </Text>
              {(errors.sizeWidth || errors.sizeHeight) && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.sizeWidth || errors.sizeHeight}
                </Text>
              )}
            </View>

            {/* Year & Edition */}
            <View style={styles.rowContainer}>
              <View style={[styles.fieldContainer, { flex: 0.6, marginRight: spacing.md }]}>
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
                      textAlign: 'center',
                    }
                  ]}
                  placeholder=""
                  value={formData.year === 0 ? '' : formData.year.toString()}
                  onChangeText={(text) => {
                    const year = parseInt(text);
                    updateField('year', isNaN(year) ? 0 : year);
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.year && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.year as string}
                  </Text>
                )}
              </View>

              <View style={[styles.fieldContainer, { flex: 1.4 }]}>
                <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                  Edition *
                </Text>
                <View style={styles.editionOptionsContainer}>
                  {(['Original', 'Limited', 'Copy'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.editionOption,
                        { backgroundColor: formData.edition === option ? colors.primary : (isDark ? colors.darkCard : colors.card) }
                      ]}
                      onPress={() => updateField('edition', option)}
                    >
                      <Text style={[
                        styles.editionOptionText,
                        { color: formData.edition === option ? '#fff' : (isDark ? colors.darkText : colors.text) }
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {formData.edition === 'Limited' && (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.darkCard : colors.card,
                        color: isDark ? colors.darkText : colors.text,
                        borderColor: errors.editionNumber ? colors.danger : 'transparent',
                        marginTop: spacing.sm,
                      }
                    ]}
                    placeholder="e.g., 1/300"
                    placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                    value={formData.editionNumber}
                    onChangeText={(text) => updateField('editionNumber', text)}
                  />
                )}
                {errors.editionNumber && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.editionNumber}
                  </Text>
                )}
              </View>
            </View>

            {/* Price */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                {challengeId ? 'Auction Reserve Price (USD) *' : 'Price (USD) *'}
              </Text>
              {challengeId && (
                <Text style={[styles.helperText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Minimum price for quarterly auction if you win 1st place
                </Text>
              )}
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.price ? colors.danger : 'transparent',
                    textAlign: 'center',
                  }
                ]}
                placeholder=""
                value={formData.price}
                onChangeText={(text) => updateField('price', text.replace(/[^0-9\-$.,]/g, ''))}
                keyboardType="numeric"
                returnKeyType="done"
              />
              <Text style={[styles.helperText, { color: isDark ? colors.darkTextMuted : colors.textMuted, marginTop: spacing.xs }]}>
                💡 Please include international shipping costs in your price
              </Text>
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
            style={[
              styles.bottomButton, 
              styles.cancelButton,
              { backgroundColor: isDark ? colors.darkCard : colors.white }
            ]}
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

        {/* Type Picker Modal (Material + Category 통합) */}
        {showTypePicker && (
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: isDark ? colors.darkCard : colors.bg }]}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
                Select Artwork Type
              </Text>
              <ScrollView 
                style={styles.pickerScrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateField('type', type);
                      setShowTypePicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { 
                        color: formData.type === type ? colors.primary : (isDark ? colors.darkText : colors.text),
                        fontWeight: formData.type === type ? '600' : '400',
                      }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTypePicker(false)}
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
      
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
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
    paddingHorizontal: spacing.sm,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  headerSpacer: {
    width: 70,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  challengeBadgeText: {
    flex: 1,
  },
  challengeBadgeLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeBadgeTitle: {
    ...typography.body,
    fontWeight: '600',
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
    overflow: 'visible', // X 버튼이 잘리지 않도록
  },
  imageScrollContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md, // 위아래 여백 추가로 X 버튼 공간 확보
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
    overflow: 'visible', // X 버튼이 잘리지 않도록
  },
  uploadedImage: {
    width: 120,
    height: 150,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10, // 조금 더 위로
    right: -10, // 조금 더 오른쪽으로
    width: 28, // 크기 약간 증가
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // 그림자 추가로 더 잘 보이게
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10, // 다른 요소 위에 표시
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14, // 크기 증가
    fontWeight: '700',
    lineHeight: 14, // 중앙 정렬
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
  helperText: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.md, // iOS 텍스트 정렬
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 44,
    textAlignVertical: 'center', // 텍스트 세로 중앙 정렬 (Android)
    includeFontPadding: false, // Android 폰트 패딩 제거
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
  helperText: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    lineHeight: 16,
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
  // Edition 옵션 스타일
  editionOptionsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  editionOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs - 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 36,
  },
  editionOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
