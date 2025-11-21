/**
 * 프로필 편집 화면
 * 닉네임, 학교, 전공, 자기소개 수정
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { updateProfile, checkHandleAvailability } from '../services/profileService';
import { validateNickname, suggestNickname } from '../services/nicknameValidationService';
import { uploadImagesToStorage } from '../services/imageUploadService';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { CustomAlert } from '../components/CustomAlert';

interface FormData {
  handle: string;
  school: string;
  department: string;
  bio: string;
}

interface FormErrors extends Partial<FormData> {
  handleSuggestions?: string[];
}

export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    handle: user?.handle || '',
    school: user?.school || '',
    department: user?.department || '',
    bio: user?.bio || '',
  });
  const [originalData, setOriginalData] = useState<FormData>();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      const initial = {
        handle: user.handle || '',
        school: user.school || '',
        department: user.department || '',
        bio: user.bio || '',
      };
      setFormData(initial);
      setOriginalData(initial);
    }
  }, [user]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    console.log('📝 validateForm 시작:', { formData: formData.handle, original: originalData?.handle });
    const newErrors: FormErrors = {};

    // 강화된 닉네임 검증
    console.log('🔍 닉네임 기본 검증 시작...');
    const nicknameValidation = validateNickname(formData.handle);
    if (!nicknameValidation.isValid) {
      console.log('❌ 닉네임 기본 검증 실패:', nicknameValidation.error);
      newErrors.handle = nicknameValidation.error;
      
      // 제안 닉네임 생성
      if (formData.handle.trim()) {
        newErrors.handleSuggestions = suggestNickname(formData.handle);
      }
    } else if (formData.handle !== originalData?.handle) {
      console.log('🔄 닉네임 변경 감지 - 중복 체크 시작...');
      // 닉네임이 변경된 경우 중복 체크
      try {
        const isAvailable = await checkHandleAvailability(formData.handle, user?.id);
        console.log('✅ 닉네임 중복 체크 완료:', { handle: formData.handle, available: isAvailable });
        if (!isAvailable) {
          newErrors.handle = 'This nickname is already taken';
          newErrors.handleSuggestions = suggestNickname(formData.handle);
        }
      } catch (error) {
        console.error('💥 닉네임 중복 체크 실패:', error);
        newErrors.handle = 'Unable to verify nickname availability';
      }
    } else {
      console.log('ℹ️ 닉네임 변경 없음 - 중복 체크 스킵');
    }

    // School validation (선택사항)
    if (formData.school.trim() && formData.school.length > 100) {
      newErrors.school = 'School name must be less than 100 characters';
    }

    // Department validation (선택사항)
    if (formData.department.trim() && formData.department.length > 100) {
      newErrors.department = 'Department must be less than 100 characters';
    }

    // Bio validation (선택사항)
    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    console.log('📋 폼 검증 완료:', { errors: Object.keys(newErrors), isValid: Object.keys(newErrors).length === 0 });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, originalData, user]);

  const hasChanges = useCallback((): boolean => {
    if (!originalData) return false;
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    const avatarChanged = avatarUrl !== user?.avatar_url;
    return formChanged || avatarChanged;
  }, [formData, originalData, avatarUrl, user]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      console.log('🔄 프로필 저장 시작...');
      
      // 폼 검증 (닉네임 중복 체크 포함)
      console.log('🔄 validateForm 호출 시작...');
      const isValid = await validateForm();
      console.log('🔄 validateForm 호출 완료:', { isValid });
      
      if (!isValid) {
        console.log('❌ 폼 검증 실패 - 저장 중단');
        setIsSaving(false);
        return;
      }

      console.log('✅ 폼 검증 통과 - 백엔드 업데이트 시작');

      // 백엔드에 프로필 업데이트 요청
      const updatedProfile = await updateProfile(user.id, formData);
      
      console.log('✅ 백엔드 업데이트 성공:', updatedProfile);

      // 닉네임 변경 여부 확인
      const nicknameChanged = formData.handle !== originalData?.handle;

      // 로컬 상태 업데이트 - 기존 user 객체와 병합
      setUser({
        ...user,
        ...updatedProfile,
        // null 값을 undefined로 변환하여 Native 모듈 타입 충돌 방지
        avatar_url: updatedProfile.avatar_url || user.avatar_url,
        bio: updatedProfile.bio || user.bio || '',
        school: updatedProfile.school || user.school || '',
        department: updatedProfile.department || user.department || '',
      });
      setOriginalData({ ...formData });

      // React Query 캐시 무효화 - 항상 실행 (프로필 정보가 여러 곳에서 사용되므로)
      console.log('🔄 프로필 변경으로 인한 캐시 무효화 시작...');
      
      // 채팅 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      
      // 작품 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworks-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['userArtworks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      
      // 댓글 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      console.log('✅ 모든 캐시 무효화 완료');

      // 닉네임 변경 시 특별 메시지
      setAlertTitle('Success!');
      setAlertMessage(
        nicknameChanged 
          ? `Profile updated successfully!\n\nYour nickname has been changed to "@${formData.handle}"\n\nAll your existing artworks and chats will now show the new nickname automatically.\n\nThe app will refresh to show your changes.`
          : `Your profile has been updated successfully!\n\nChanges saved:\n${Object.entries(formData)
              .filter(([key, value]) => value !== originalData?.[key] && value?.trim())
              .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${key === 'bio' ? (value as string).substring(0, 30) + '...' : value}`)
              .join('\n') || '• Profile information updated'}`
      );
      setAlertButtons([{ 
        text: 'OK', 
        style: 'default',
        onPress: () => {
          console.log('✅ 사용자가 성공 메시지를 확인했습니다.');
          navigation.goBack();
        }
      }]);
      setAlertVisible(true);
    } catch (error) {
      console.error('💥 프로필 업데이트 실패:', error);
      
      // 사용자 친화적 오류 메시지 생성
      let errorTitle = 'Update Failed';
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.message) {
        // profileService에서 생성된 사용자 친화적 메시지 사용
        errorMessage = error.message;
        
        // 특정 오류에 따른 제목 변경
        if (error.message.includes('already taken')) {
          errorTitle = 'Nickname Unavailable';
        } else if (error.message.includes('permission')) {
          errorTitle = 'Access Denied';
        } else if (error.message.includes('Invalid')) {
          errorTitle = 'Invalid Information';
        } else if (error.message.includes('login')) {
          errorTitle = 'Authentication Required';
        }
      } else {
        // 기본 오류 처리
        if (error.code === '23505') {
          errorTitle = 'Duplicate Information';
          errorMessage = 'This nickname is already in use by another user.';
        } else if (error.code === '23514') {
          errorTitle = 'Invalid Data';
          errorMessage = 'Please check your profile information and try again.';
        } else if (error.code === '42501') {
          errorTitle = 'Permission Denied';
          errorMessage = 'You do not have permission to update this profile.';
        } else if (error.name === 'NetworkError' || error.message?.includes('network')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Please check your internet connection and try again.';
        }
      }
      
      setAlertTitle(errorTitle);
      setAlertMessage(errorMessage);
      setAlertButtons([
        { 
          text: 'Try Again', 
          style: 'default',
          onPress: () => {
            // 재시도 로직 - 폼 상태 유지
            console.log('사용자가 재시도를 선택했습니다.');
          }
        },
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log('사용자가 취소를 선택했습니다.');
          }
        }
      ]);
      setAlertVisible(true);
    } finally {
      setIsSaving(false);
    }
  }, [user, formData, validateForm, setUser, navigation, originalData, queryClient]);

  const handleCancel = useCallback(() => {
    if (hasChanges()) {
      setAlertTitle('Discard Changes?');
      setAlertMessage('You have unsaved changes. Are you sure you want to go back?');
      setAlertButtons([
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive', 
          onPress: () => navigation.goBack() 
        },
      ]);
      setAlertVisible(true);
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handlePickImage = async () => {
    try {
      console.log('📸 프로필 사진 선택 시작...');
      
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertTitle('Permission Required');
        setAlertMessage('Please allow access to your photos to change your profile picture.');
        setAlertButtons([{ text: 'OK', style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploadingAvatar(true);
        const selectedImage = result.assets[0];
        console.log('✅ 이미지 선택됨:', selectedImage.uri);

        try {
          // 이미지 업로드
          console.log('⬆️ 이미지 업로드 시작...');
          const uploadedUrls = await uploadImagesToStorage([selectedImage.uri]);
          
          if (uploadedUrls && uploadedUrls.length > 0) {
            const newAvatarUrl = uploadedUrls[0];
            console.log('✅ 프로필 사진 업로드 성공:', newAvatarUrl);
            
            // 로컬 상태 업데이트
            setAvatarUrl(newAvatarUrl);
            
            // Supabase에 즉시 업데이트
            if (user?.id) {
              const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: newAvatarUrl })
                .eq('id', user.id);

              if (error) {
                console.error('❌ 프로필 사진 DB 업데이트 실패:', error);
                throw error;
              }

              // 로컬 user 상태 업데이트
              setUser({ ...user, avatar_url: newAvatarUrl });
              
              console.log('✅ 프로필 사진 DB 업데이트 성공');
              
              setAlertTitle('Success!');
              setAlertMessage('Your profile picture has been updated successfully.');
              setAlertButtons([{ text: 'OK', style: 'default' }]);
              setAlertVisible(true);
            }
          }
        } catch (error) {
          console.error('❌ 프로필 사진 업로드 실패:', error);
          setAlertTitle('Upload Failed');
          setAlertMessage('Failed to upload profile picture. Please try again.');
          setAlertButtons([{ text: 'OK', style: 'default' }]);
          setAlertVisible(true);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('❌ 이미지 선택 오류:', error);
      setIsUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <LoadingSpinner message="Loading profile..." />
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
            Edit Profile
          </Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: hasChanges() && !isSaving ? colors.primary : 'transparent',
                opacity: hasChanges() && !isSaving ? 1 : 0.5 
              }
            ]}
            onPress={handleSave}
            disabled={!hasChanges() || isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <View style={styles.savingContainer}>
                <LoadingSpinner size="small" />
                <Text style={[styles.savingText, { color: colors.white }]}>
                  Saving...
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.saveButtonText, 
                { color: hasChanges() && !isSaving ? colors.white : colors.primary }
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: avatarUrl || user.avatar_url || 'https://via.placeholder.com/100/EC4899/FFFFFF?text=' + (user?.handle?.[0]?.toUpperCase() || 'U')
                }}
                style={styles.avatar}
              />
              {isUploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={colors.white} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
                onPress={handlePickImage}
                disabled={isUploadingAvatar}
                activeOpacity={0.8}
              >
                <Text style={styles.changePhotoText}>📷</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.avatarHint, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              Tap the camera icon to change your profile picture
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Nickname */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Nickname *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.handle ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Enter your nickname"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.handle}
                onChangeText={(text) => updateField('handle', text)}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.handle && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.handle}
                </Text>
              )}
              
              {/* 제안 닉네임 표시 */}
              {errors.handleSuggestions && errors.handleSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={[styles.suggestionsTitle, { color: isDark ? colors.darkText : colors.text }]}>
                    💡 Suggested nicknames:
                  </Text>
                  <View style={styles.suggestionsRow}>
                    {errors.handleSuggestions.slice(0, 3).map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionChip, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          updateField('handle', suggestion);
                          setErrors(prev => ({ ...prev, handle: undefined, handleSuggestions: undefined }));
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.suggestionText, { color: colors.white }]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <Text style={[styles.helperText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Only English letters and numbers allowed • No profanity
              </Text>
            </View>

            {/* School */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                School
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.school ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Enter your school name (optional)"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.school}
                onChangeText={(text) => updateField('school', text)}
                maxLength={100}
                autoCapitalize="words"
              />
              {errors.school && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.school}
                </Text>
              )}
            </View>

            {/* Department */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Department
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.department ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="e.g. Fine Arts, Visual Design (optional)"
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.department}
                onChangeText={(text) => updateField('department', text)}
                maxLength={100}
                autoCapitalize="words"
              />
              {errors.department && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.department}
                </Text>
              )}
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Bio
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: errors.bio ? colors.danger : 'transparent',
                  }
                ]}
                placeholder="Tell us about yourself, your art style, and what inspires you..."
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.bio && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.bio}
                </Text>
              )}
              <Text style={[styles.characterCount, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {(formData.bio || '').length}/500 characters
              </Text>
            </View>

            {/* Additional Info */}
            <View style={[styles.infoBox, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
              <Text style={[styles.infoTitle, { color: isDark ? colors.darkText : colors.text }]}>
                📝 Profile Tips
              </Text>
              <Text style={[styles.infoText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                • Choose a unique nickname that represents you (required){'\n'}
                • Add your school and department for community connections{'\n'}
                • Write a bio that showcases your artistic personality{'\n'}
                • All information except nickname is optional
              </Text>
            </View>
          </View>
        </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    paddingVertical: spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    ...typography.body,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  changePhotoText: {
    fontSize: 16,
  },
  avatarHint: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.xl,
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
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  characterCount: {
    ...typography.small,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    lineHeight: 18,
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // colors.primary with opacity
    borderRadius: borderRadius.sm,
  },
  suggestionsTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  suggestionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  savingText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
