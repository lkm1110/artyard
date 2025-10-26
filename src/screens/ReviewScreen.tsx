/**
 * Write Review Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

type RouteParams = {
  Review: {
    orderId: string;
    artworkId: string;
  };
};

export const ReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'Review'>>();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const { orderId, artworkId } = route.params;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Notice', 'Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('reviews')
        .insert({
          transaction_id: orderId,
          artwork_id: artworkId,
          reviewer_id: user?.id,
          rating,
          comment: comment.trim(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Review submitted!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Write Review
        </Text>
      </View>

      {/* Rating */}
      <View style={[styles.section, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Rating
        </Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Text style={styles.starText}>
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {rating} out of 5 stars
        </Text>
      </View>

      {/* Review Content */}
      <View style={[styles.section, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Your Review
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? colors.darkBackground : colors.background,
              color: isDark ? colors.darkText : colors.text,
              borderColor: isDark ? colors.darkBorder : colors.border,
            },
          ]}
          placeholder="Share your thoughts about this artwork..."
          placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={[styles.charCount, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {comment.length} / 500
        </Text>
      </View>

      {/* 제출 버튼 */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          submitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  starText: {
    fontSize: 32,
  },
  ratingLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  textInput: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 150,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  submitButton: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

