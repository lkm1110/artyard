/**
 * 빈 상태 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string; // 기존 description과 호환
  description?: string;
  icon?: string | React.ReactNode; // 문자열(이모지) 또는 컴포넌트
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  description,
  icon,
  action,
}) => {
  const isDark = useColorScheme() === 'dark';
  const descriptionText = description || subtitle; // 호환성

  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      
      <Text style={[
        styles.title,
        { color: isDark ? colors.darkText : colors.text }
      ]}>
        {title}
      </Text>
      
      {descriptionText && (
        <Text style={[
          styles.description,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          {descriptionText}
        </Text>
      )}
      
      {action && (
        <View style={styles.actionContainer}>
          {action}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});

