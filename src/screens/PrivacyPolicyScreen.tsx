/**
 * 개인정보 보호 정책 화면
 * 앱스토어 심의 필수 요구사항
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { Screen } from '../components/Screen';

export const PrivacyPolicyScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';

  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Screen
      title="개인정보 보호 정책"
      showBackButton
      scrollable
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
            ArtYard 개인정보 보호 정책
          </Text>
          
          <Text style={[styles.date, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            최종 업데이트: 2025년 1월 14일
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              1. 수집하는 개인정보
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              • 계정 정보: 이메일 주소, 프로필 사진, 닉네임{'\n'}
              • 위치 정보: 작품 업로드 시 위치 태그 (선택사항){'\n'}
              • 미디어: 카메라 및 사진 라이브러리 접근 (작품 업로드용){'\n'}
              • 채팅 메시지: 사용자 간 커뮤니케이션 내용{'\n'}
              • 사용 데이터: 앱 사용 패턴, 좋아요, 북마크 등
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              2. 개인정보 사용 목적
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              • 서비스 제공 및 사용자 경험 개선{'\n'}
              • 사용자 인증 및 계정 관리{'\n'}
              • 커뮤니티 안전 및 스팸 방지{'\n'}
              • 고객 지원 및 문의 응답{'\n'}
              • 서비스 개선을 위한 분석 (익명화)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              3. 개인정보 보호
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              • 모든 데이터는 암호화되어 안전하게 저장됩니다{'\n'}
              • Supabase 플랫폼을 통한 보안 강화{'\n'}
              • 제3자와의 개인정보 공유 금지{'\n'}
              • 사용자가 언제든 데이터 삭제 요청 가능
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              4. 사용자 권리
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              • 개인정보 열람, 수정, 삭제 권리{'\n'}
              • 위치 정보 수집 거부 권리{'\n'}
              • 마케팅 수신 거부 권리{'\n'}
              • 계정 삭제 및 데이터 완전 제거 권리
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              5. 문의처
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              개인정보 보호 관련 문의사항이 있으시면 언제든 연락 주세요.
            </Text>
            
            <TouchableOpacity
              onPress={() => openWebsite('mailto:privacy@artyard.app')}
              style={[styles.contactButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.contactButtonText}>privacy@artyard.app</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              본 정책은 관련 법률 변경 시 업데이트될 수 있으며,{'\n'}
              중요한 변경사항은 앱 내 알림을 통해 안내드립니다.
            </Text>
          </View>

        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionContent: {
    ...typography.body,
    lineHeight: 24,
  },
  contactButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
});
