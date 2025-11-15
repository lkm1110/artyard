/**
 * Block User Modal Component
 * Beautiful confirmation modal for blocking/unblocking users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface BlockUserModalProps {
  visible: boolean;
  userName?: string;
  isBlocked: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  visible,
  userName,
  isBlocked,
  onClose,
  onConfirm,
}) => {
  const isDark = useColorScheme() === 'dark';
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Block action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const iconName = isBlocked ? 'checkmark-circle' : 'ban';
  const iconColor = isBlocked ? '#10B981' : '#EF4444';
  const iconBgColor = isBlocked ? '#D1FAE5' : '#FEE2E2';
  const actionText = isBlocked ? 'Unblock' : 'Block';
  const title = isBlocked ? 'Unblock User' : 'Block User';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? colors.darkCard : colors.card },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconBgColor },
            ]}
          >
            <Ionicons name={iconName} size={48} color={iconColor} />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? colors.darkText : colors.text },
            ]}
          >
            {title}
          </Text>

          {/* User Name */}
          {userName && (
            <Text
              style={[
                styles.userName,
                { color: isDark ? colors.darkText : colors.text },
              ]}
            >
              @{userName}
            </Text>
          )}

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: isDark ? colors.darkTextMuted : colors.textMuted },
            ]}
          >
            {isBlocked
              ? 'Are you sure you want to unblock this user? They will be able to see your content and contact you again.'
              : 'Are you sure you want to block this user? They will not be able to see your content or contact you.'}
          </Text>

          {/* Consequences (for blocking) */}
          {!isBlocked && (
            <View style={styles.consequencesContainer}>
              <View style={styles.consequenceItem}>
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={isDark ? colors.darkTextMuted : colors.textMuted}
                />
                <Text
                  style={[
                    styles.consequenceText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted },
                  ]}
                >
                  They won't see your artworks
                </Text>
              </View>
              <View style={styles.consequenceItem}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={isDark ? colors.darkTextMuted : colors.textMuted}
                />
                <Text
                  style={[
                    styles.consequenceText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted },
                  ]}
                >
                  They can't send you messages
                </Text>
              </View>
              <View style={styles.consequenceItem}>
                <Ionicons
                  name="person-remove-outline"
                  size={20}
                  color={isDark ? colors.darkTextMuted : colors.textMuted}
                />
                <Text
                  style={[
                    styles.consequenceText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted },
                  ]}
                >
                  They can't follow you
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  borderColor: isDark ? colors.darkBorder : colors.border,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: iconColor,
                  opacity: isProcessing ? 0.6 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                {isProcessing ? 'Processing...' : `${actionText} User`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: Math.min(width - 48, 420),
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  consequencesContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  consequenceText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});

