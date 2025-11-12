import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  useColorScheme,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ConsentScreenProps {
  onComplete: () => void;
}

interface Consents {
  terms: boolean;
  privacy: boolean;
  overseasTransfer: boolean;
  ageConfirm: boolean;
  marketing: boolean;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onComplete }) => {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [consents, setConsents] = useState<Consents>({
    terms: false,
    privacy: false,
    overseasTransfer: false,
    ageConfirm: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);

  // 전체 동의 상태 계산
  const allConsents = Object.values(consents).every((v) => v === true);
  const requiredConsents = 
    consents.terms && 
    consents.privacy && 
    consents.overseasTransfer && 
    consents.ageConfirm;

  // 전체 동의 토글
  const handleAgreeAll = () => {
    const newValue = !allConsents;
    setConsents({
      terms: newValue,
      privacy: newValue,
      overseasTransfer: newValue,
      ageConfirm: newValue,
      marketing: newValue,
    });
  };

  // 개별 동의 토글
  const toggleConsent = (key: keyof Consents) => {
    setConsents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 외부 링크 열기
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  // 동의 완료 처리
  const handleContinue = async () => {
    if (!requiredConsents) {
      Alert.alert(
        'Required Consents',
        'Please agree to all required terms to continue.'
      );
      return;
    }

    try {
      setLoading(true);

      // 현재 유저 정보 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // profiles 테이블에 동의 정보 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          consent_terms_agreed: consents.terms,
          consent_privacy_agreed: consents.privacy,
          consent_overseas_agreed: consents.overseasTransfer,
          consent_age_confirmed: consents.ageConfirm,
          consent_marketing_agreed: consents.marketing,
          consent_agreed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Consent saved successfully');
      onComplete();

    } catch (error: any) {
      console.error('❌ Consent save error:', error);
      Alert.alert('Error', 'Failed to save consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.darkBackground : colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBackground : colors.background}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
          Welcome to ArtYard! 🎨
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
          Please agree to the following terms to continue
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 전체 동의 */}
        <TouchableOpacity
          style={[
            styles.consentItem,
            styles.allConsentItem,
            { backgroundColor: isDark ? colors.darkCard : colors.card },
          ]}
          onPress={handleAgreeAll}
          activeOpacity={0.7}
        >
          <View style={styles.checkbox}>
            {allConsents && (
              <Ionicons name="checkmark" size={18} color={colors.white} />
            )}
          </View>
          <Text style={[styles.consentText, styles.allConsentText, { color: isDark ? colors.darkText : colors.text }]}>
            Agree to all
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? colors.darkBorder : colors.border }]} />

        {/* 필수 동의 항목 */}
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Required
        </Text>

        {/* 이용약관 */}
        <View style={[styles.consentItem, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.consentLeft}
            onPress={() => toggleConsent('terms')}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consents.terms && styles.checkboxChecked]}>
              {consents.terms && (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={[styles.consentText, { color: isDark ? colors.darkText : colors.text }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openLink('https://lkm1110.github.io/artyard/terms-of-service.html')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 개인정보 수집·이용 */}
        <View style={[styles.consentItem, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.consentLeft}
            onPress={() => toggleConsent('privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consents.privacy && styles.checkboxChecked]}>
              {consents.privacy && (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <View style={styles.consentTextContainer}>
              <Text style={[styles.consentText, { color: isDark ? colors.darkText : colors.text }]}>
                Privacy Policy & Data Collection
              </Text>
              <Text style={[styles.consentDetail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Name, Email, Profile, Location
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openLink('https://lkm1110.github.io/artyard/privacy-policy.html')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 개인정보 국외 이전 */}
        <View style={[styles.consentItem, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.consentLeft}
            onPress={() => toggleConsent('overseasTransfer')}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consents.overseasTransfer && styles.checkboxChecked]}>
              {consents.overseasTransfer && (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <View style={styles.consentTextContainer}>
              <Text style={[styles.consentText, { color: isDark ? colors.darkText : colors.text }]}>
                Overseas Data Transfer
              </Text>
              <Text style={[styles.consentDetail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Supabase Inc. - United States
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openLink('https://lkm1110.github.io/artyard/privacy-policy.html#overseas-transfer')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 만 14세 이상 확인 */}
        <View style={[styles.consentItem, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.consentLeft}
            onPress={() => toggleConsent('ageConfirm')}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consents.ageConfirm && styles.checkboxChecked]}>
              {consents.ageConfirm && (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={[styles.consentText, { color: isDark ? colors.darkText : colors.text }]}>
              I am 14 years or older
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? colors.darkBorder : colors.border }]} />

        {/* 선택 동의 항목 */}
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Optional
        </Text>

        {/* 마케팅 수신 */}
        <View style={[styles.consentItem, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity
            style={styles.consentLeft}
            onPress={() => toggleConsent('marketing')}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consents.marketing && styles.checkboxChecked]}>
              {consents.marketing && (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <View style={styles.consentTextContainer}>
              <Text style={[styles.consentText, { color: isDark ? colors.darkText : colors.text }]}>
                Marketing & Promotional Emails
              </Text>
              <Text style={[styles.consentDetail, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Events, promotions, new features
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue 버튼 */}
      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderTopColor: isDark ? colors.darkBorder : colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.md), // Safe Area 적용
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: requiredConsents ? colors.primary : colors.textMuted },
            !requiredConsents && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!requiredConsents || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <LoadingSpinner size="small" color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 24, // 상태표시줄 여유 공간 추가
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  allConsentItem: {
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  consentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '500',
  },
  allConsentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  consentDetail: {
    ...typography.caption,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  bottomSpacer: {
    height: 100, // Continue 버튼 높이만큼 여유 공간
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    // paddingBottom은 동적으로 설정 (insets.bottom + spacing.md)
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

