/**
 * Report User Modal Component
 * Beautiful modal for reporting users with reason selection
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
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface ReportReason {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const REPORT_REASONS: ReportReason[] = [
  { id: 'spam', label: 'Spam', icon: 'megaphone-outline', color: '#F59E0B' },
  { id: 'inappropriate_content', label: 'Inappropriate Content', icon: 'eye-off-outline', color: '#EF4444' },
  { id: 'harassment', label: 'Harassment', icon: 'warning-outline', color: '#DC2626' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

interface ReportUserModalProps {
  visible: boolean;
  userName?: string;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => Promise<void>;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  visible,
  userName,
  onClose,
  onSubmit,
}) => {
  const isDark = useColorScheme() === 'dark';
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherDetails, setOtherDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        selectedReason,
        selectedReason === 'other' ? otherDetails : undefined
      );
      // Reset state
      setSelectedReason(null);
      setOtherDetails('');
      onClose();
    } catch (error) {
      console.error('Report submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setOtherDetails('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? colors.darkCard : colors.card },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={32} color="#EF4444" />
            </View>
            <Text
              style={[
                styles.title,
                { color: isDark ? colors.darkText : colors.text },
              ]}
            >
              Report User
            </Text>
            {userName && (
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? colors.darkTextMuted : colors.textMuted },
                ]}
              >
                Report @{userName}
              </Text>
            )}
          </View>

          {/* Reason Selection */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text
              style={[
                styles.label,
                { color: isDark ? colors.darkText : colors.text },
              ]}
            >
              Why are you reporting this user?
            </Text>

            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor:
                        selectedReason === reason.id
                          ? `${reason.color}20`
                          : isDark
                          ? colors.darkBackground
                          : colors.background,
                      borderColor:
                        selectedReason === reason.id
                          ? reason.color
                          : isDark
                          ? colors.darkBorder
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.reasonIconContainer,
                      { backgroundColor: `${reason.color}20` },
                    ]}
                  >
                    <Ionicons name={reason.icon} size={24} color={reason.color} />
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      {
                        color:
                          selectedReason === reason.id
                            ? reason.color
                            : isDark
                            ? colors.darkText
                            : colors.text,
                      },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={reason.color}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Other Details Input */}
            {selectedReason === 'other' && (
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: isDark ? colors.darkText : colors.text },
                  ]}
                >
                  Please provide more details:
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark
                        ? colors.darkBackground
                        : colors.background,
                      color: isDark ? colors.darkText : colors.text,
                      borderColor: isDark ? colors.darkBorder : colors.border,
                    },
                  ]}
                  placeholder="Describe the issue..."
                  placeholderTextColor={
                    isDark ? colors.darkTextMuted : colors.textMuted
                  }
                  value={otherDetails}
                  onChangeText={setOtherDetails}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

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
              onPress={handleClose}
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
                styles.submitButton,
                {
                  backgroundColor: selectedReason ? '#EF4444' : '#CCCCCC',
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
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
    width: Math.min(width - 48, 500),
    maxHeight: '90%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    padding: spacing.xl,
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  reasonsContainer: {
    gap: spacing.sm,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    minHeight: 72,
  },
  reasonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  inputContainer: {
    marginTop: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
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
  submitButton: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
});

