/**
 * Custom Alert Component
 * Modern, beautiful alert/dialog replacement for React Native Alert
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const isDark = useColorScheme() === 'dark';

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { backgroundColor: isDark ? colors.darkCard : colors.card }
        ]}>
          {/* Title */}
          <Text style={[
            styles.title,
            { color: isDark ? colors.darkText : colors.text }
          ]}>
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text style={[
              styles.message,
              { color: isDark ? colors.darkTextMuted : colors.textMuted }
            ]}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.buttonCancel,
                  button.style === 'destructive' && styles.buttonDestructive,
                  button.style === 'default' && styles.buttonDefault,
                  buttons.length === 1 && styles.buttonSingle,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'cancel' && { color: isDark ? colors.darkTextMuted : colors.textMuted },
                  button.style === 'destructive' && { color: '#FF3B30' },
                  button.style === 'default' && { color: colors.primary },
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  alertContainer: {
    width: Math.min(width - 48, 400), // 340 → 400으로 폭 증가
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontFamily: typography.bold,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontFamily: typography.regular,
  },
  buttonsContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonSingle: {
    flex: 1,
  },
  buttonDefault: {
    backgroundColor: colors.primaryLight,
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDestructive: {
    backgroundColor: '#FFE5E5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.medium,
  },
});

/**
 * Convenience function to show custom alert
 * Usage: showCustomAlert({ title, message, buttons })
 */
export const showCustomAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
): Promise<void> => {
  return new Promise((resolve) => {
    // This would require a global alert manager
    // For now, components should use the CustomAlert component directly
    console.log('showCustomAlert called:', { title, message, buttons });
    resolve();
  });
};

