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
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { updateProfile, checkHandleAvailability } from '../services/profileService';
import { validateNickname, suggestNickname } from '../services/nicknameValidationService';
import { Profile } from '../types';

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

  const [formData, setFormData] = useState<FormData>({
    handle: user?.handle || '',
    school: user?.school || '',
    department: user?.department || '',
    bio: user?.bio || '',
  });
  const [originalData, setOriginalData] = useState<FormData>();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
    const newErrors: FormErrors = {};

    // 강화된 닉네임 검증
    const nicknameValidation = validateNickname(formData.handle);
    if (!nicknameValidation.isValid) {
      newErrors.handle = nicknameValidation.error;
      
      // 제안 닉네임 생성
      if (formData.handle.trim()) {
        newErrors.handleSuggestions = suggestNickname(formData.handle);
      }
    } else if (formData.handle !== originalData?.handle) {
      // 닉네임이 변경된 경우 중복 체크
      try {
        const isAvailable = await checkHandleAvailability(formData.handle, user?.id);
        if (!isAvailable) {
          newErrors.handle = 'This nickname is already taken';
          newErrors.handleSuggestions = suggestNickname(formData.handle);
        }
      } catch (error) {
        console.error('닉네임 중복 체크 실패:', error);
        newErrors.handle = 'Unable to verify nickname availability';
      }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, originalData, user]);

  const hasChanges = useCallback((): boolean => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      console.log('🔄 프로필 저장 시작...');
      
      // 폼 검증 (닉네임 중복 체크 포함)
      const isValid = await validateForm();
      if (!isValid) {
        console.log('❌ 폼 검증 실패');
        setIsSaving(false);
        return;
      }

      console.log('✅ 폼 검증 통과');

      // 백엔드에 프로필 업데이트 요청
      const updatedProfile = await updateProfile(user.id, formData);
      
      console.log('✅ 백엔드 업데이트 성공:', updatedProfile);

      // 닉네임 변경 여부 확인
      const nicknameChanged = formData.handle !== originalData?.handle;

      // 로컬 상태 업데이트
      setUser(updatedProfile);
      setOriginalData({ ...formData });

      // React Query 캐시 무효화 - 닉네임 변경 시 모든 관련 데이터 새로고침
      if (nicknameChanged) {
        console.log('🔄 닉네임 변경으로 인한 캐시 무효화 시작...');
        
        // 채팅 관련 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        
        // 작품 관련 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['artworks'] });
        queryClient.invalidateQueries({ queryKey: ['userArtworks'] });
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        
        // 댓글 관련 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['comments'] });
        
        console.log('✅ 모든 캐시 무효화 완료');
      }

      // 닉네임 변경 시 특별 메시지
      Alert.alert(
        '✅ Success!',
        nicknameChanged 
          ? `🎉 Profile updated successfully!\n\n🎭 Your nickname has been changed to "@${formData.handle}"\n\n📚 All your existing artworks and chats will now show the new nickname automatically.\n\n🔄 The app will refresh to show your changes.`
          : `🎉 Your profile has been updated successfully!\n\n✨ Changes saved:\n${Object.entries(formData)
              .filter(([key, value]) => value !== originalData?.[key] && value?.trim())
              .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${key === 'bio' ? (value as string).substring(0, 30) + '...' : value}`)
              .join('\n') || '• Profile information updated'}`,
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('✅ 사용자가 성공 메시지를 확인했습니다.');
            navigation.goBack();
          }
        }]
      );
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
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { 
            text: 'Try Again', 
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
        ]
      );
    } finally {
      setIsSaving(false);
    }
  }, [user, formData, validateForm, setUser, navigation, originalData, queryClient]);

  const handleCancel = useCallback(() => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive', 
            onPress: () => navigation.goBack() 
          },
        ]
      );
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
                  uri: user.avatar_url || 'https://picsum.photos/100/100?random=profile' 
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // TODO: 이미지 선택 기능
                  Alert.alert('Coming Soon', 'Profile picture editing will be available soon!');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.changePhotoText}>📷</Text>
              </TouchableOpacity>
            </View>
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
