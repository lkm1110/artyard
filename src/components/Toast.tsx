/**
 * Toast Component
 * Lightweight toast notifications for in-app messages
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  subtitle?: string;
  duration?: number;
  onPress?: () => void;
  onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  subtitle,
  duration = 3000,
  onPress,
  onHide,
}) => {
  const isDark = useColorScheme() === 'dark';
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          { backgroundColor: isDark ? colors.darkCard : colors.card }
        ]}
        onPress={() => {
          if (onPress) {
            onPress();
            hideToast();
          }
        }}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💬</Text>
        </View>
        <View style={styles.content}>
          <Text style={[
            styles.message,
            { color: isDark ? colors.darkText : colors.text }
          ]} numberOfLines={1}>
            {message}
          </Text>
          {subtitle && (
            <Text style={[
              styles.subtitle,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {onPress && (
          <Text style={[styles.arrow, { color: colors.primary }]}>›</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.medium,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: typography.regular,
  },
  arrow: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
});

