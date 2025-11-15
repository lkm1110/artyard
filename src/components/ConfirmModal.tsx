import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = colors.primary,
  iconName = 'help-circle-outline',
  iconColor = colors.primary,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={iconName} size={64} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {message}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { borderColor: isDark ? colors.darkBorder : colors.border }]}
              onPress={onCancel}
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.confirmButton,
                { backgroundColor: confirmColor },
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
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
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.3,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  confirmButton: {},
  confirmButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});

