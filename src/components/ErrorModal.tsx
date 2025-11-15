import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title,
  message,
  buttonText = 'OK',
  onClose,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>
            <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {message}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#EF4444' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
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
  button: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});

