/**
 * 로딩 스피너 컴포넌트
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={size} 
        color={colors.primary} 
      />
      {message && (
        <Text style={[
          styles.message,
          { color: isDark ? colors.darkText : colors.text }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
});

