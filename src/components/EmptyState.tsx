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
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      
      <Text style={[
        styles.title,
        { color: isDark ? colors.darkText : colors.text }
      ]}>
        {title}
      </Text>
      
      {description && (
        <Text style={[
          styles.description,
          { color: isDark ? colors.darkTextMuted : colors.textMuted }
        ]}>
          {description}
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

