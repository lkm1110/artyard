/**
 * 판매 상태 배지 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SaleStatus } from '../types';
import { colors, spacing, typography } from '../constants/theme';

interface Props {
  status: SaleStatus;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: '#10B981',
    backgroundColor: '#10B981',
    textColor: '#FFFFFF',
    icon: '✅',
  },
  sold: {
    label: 'Sold',
    color: '#EF4444',
    backgroundColor: '#EF4444',
    textColor: '#FFFFFF',
    icon: '💰',
  },
  reserved: {
    label: 'Reserved',
    color: '#F59E0B',
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    icon: '⏳',
  },
  not_for_sale: {
    label: 'Not for Sale',
    color: '#6B7280',
    backgroundColor: '#6B7280',
    textColor: '#FFFFFF',
    icon: '🚫',
  },
};

export const SaleStatusBadge: React.FC<Props> = ({
  status,
  size = 'medium',
  style,
}) => {
  const config = STATUS_CONFIG[status];
  
  if (!config) return null;

  return (
    <View style={[
      styles.badge,
      styles[`badge_${size}`],
      { backgroundColor: config.backgroundColor },
      style,
    ]}>
      <Text style={[
        styles.icon,
        styles[`icon_${size}`],
      ]}>
        {config.icon}
      </Text>
      <Text style={[
        styles.text,
        styles[`text_${size}`],
        { color: config.textColor }
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badge_small: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  badge_medium: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  badge_large: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  icon: {
    textAlign: 'center',
  },
  icon_small: {
    fontSize: 8,
  },
  icon_medium: {
    fontSize: 10,
  },
  icon_large: {
    fontSize: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_small: {
    fontSize: 8,
  },
  text_medium: {
    fontSize: 10,
  },
  text_large: {
    fontSize: typography.caption.fontSize,
  },
});
