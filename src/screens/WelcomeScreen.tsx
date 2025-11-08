/**
 * 환영 화면 (처음 방문자용)
 * ArtYard 소개 및 주요 기능 안내
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Screen style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 로고 및 타이틀 */}
          <View style={styles.header}>
            <View style={[
              styles.logoContainer,
              { backgroundColor: colors.primary }
            ]}>
              <Text style={styles.logoText}>🎨</Text>
            </View>
            
            <Text style={[
              styles.title,
              { color: isDark ? colors.darkText : colors.text }
            ]}>
              Welcome to ArtYard!
            </Text>
            
            <Text style={[
              styles.subtitle,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              The art community for college students{'\n'}
              Share and discover amazing artworks
            </Text>
          </View>

          {/* 주요 기능 소개 */}
          <View style={styles.features}>
            <FeatureItem
              emoji="🎭"
              title="Share Your Art"
              description="Upload and share illustrations, photography, prints, crafts, and more with a vibrant community"
              isDark={isDark}
            />
            
            <FeatureItem
              emoji="💬"
              title="Connect & Get Feedback"
              description="Engage with fellow artists through comments and likes, exchange valuable feedback on each other's work"
              isDark={isDark}
            />
            
            <FeatureItem
              emoji="🛒"
              title="Direct Trade"
              description="Buy and sell artworks directly with artists. Fair 10% commission!"
              isDark={isDark}
            />
          </View>
        </View>
      </ScrollView>

      {/* 시작 버튼 - 고정 위치 */}
      <SafeAreaView edges={['bottom']} style={styles.bottomContainer}>
        <View style={[
          styles.bottom,
          { backgroundColor: isDark ? colors.darkBg : colors.bg }
        ]}>
          <Button
            title="Get Started"
            onPress={onGetStarted}
            style={styles.startButton}
          />
          
          <Text style={[
            styles.footerText,
            { color: isDark ? colors.darkTextMuted : colors.textMuted }
          ]}>
            to push your creativity and improve your skills{'\n'}
            Already have an account? login to get started quickly!
          </Text>
        </View>
      </SafeAreaView>
    </Screen>
  );
};

// 기능 소개 아이템 컴포넌트
interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
  isDark: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ emoji, title, description, isDark }) => (
  <View style={styles.featureItem}>
    <View style={[
      styles.featureIcon,
      { backgroundColor: isDark ? colors.darkCard : colors.card }
    ]}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
    </View>
    
    <View style={styles.featureContent}>
      <Text style={[
        styles.featureTitle,
        { color: isDark ? colors.darkText : colors.text }
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.featureDescription,
        { color: isDark ? colors.darkTextMuted : colors.textMuted }
      ]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.title.fontSize + 4,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.3,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight * 1.2,
  },
  bottomContainer: {
    // SafeAreaView 컨테이너
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '20', // 20% opacity
  },
  startButton: {
    marginBottom: spacing.md,
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    lineHeight: typography.caption.lineHeight * 1.3,
  },
});
