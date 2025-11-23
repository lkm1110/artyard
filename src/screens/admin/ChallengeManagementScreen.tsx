/**
 * Admin Challenge Management Screen
 * 챌린지 생성, 관리, 우승자 발표
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface Challenge {
  id: string;
  title: string;
  description: string;
  topic: string;
  start_date: string;
  end_date: string;
  voting_end_date: string;
  status: 'upcoming' | 'active' | 'ended' | 'archived';
  tier_requirement: 'all' | 'new' | 'trusted' | 'verified' | 'pro';
  prize_description?: string;
  entries_count: number;
  total_votes: number;
}

export const ChallengeManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  // State
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [tierRequirement, setTierRequirement] = useState<'new' | 'all'>('new');
  
  // Modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionChallenge, setActionChallenge] = useState<Challenge | null>(null);
  
  useEffect(() => {
    loadChallenges();
  }, []);
  
  const loadChallenges = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false});
      
      if (error) throw error;
      
      // entries_count와 total_votes 계산
      const challengesWithCounts = await Promise.all(
        (data || []).map(async (challenge) => {
          // entries_count
          const { data: entries } = await supabase
            .from('challenge_entries')
            .select('id')
            .eq('challenge_id', challenge.id);
          
          // total_votes
          const { data: votes } = await supabase
            .from('challenge_votes')
            .select('id')
            .eq('challenge_id', challenge.id);
          
          return {
            ...challenge,
            entries_count: entries?.length || 0,
            total_votes: votes?.length || 0,
          };
        })
      );
      
      setChallenges(challengesWithCounts);
    } catch (error: any) {
      console.error('Failed to load challenges:', error);
      setErrorMessage({
        title: 'Error',
        message: error.message || 'Failed to load challenges',
      });
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleCreateChallenge = async () => {
    if (!title.trim() || !description.trim() || !topic.trim()) {
      setErrorMessage('Please fill in all required fields');
      setErrorModalVisible(true);
      return;
    }
    
    try {
      setCreating(true);
      
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 2주 후
      const votingEndDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(); // 3주 후
      
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          title,
          description,
          topic,
          start_date: startDate,
          end_date: endDate,
          voting_start_date: endDate, // 챌린지 종료 = 투표 시작
          voting_end_date: votingEndDate,
          status: 'active',
          tier_requirement: tierRequirement,
          voting_enabled: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccessMessage('Challenge created successfully!');
      setSuccessModalVisible(true);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTopic('');
      setTierRequirement('new');
      setShowCreateForm(false);
      
      loadChallenges();
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      setErrorMessage(error.message || 'Failed to create challenge');
      setErrorModalVisible(true);
    } finally {
      setCreating(false);
    }
  };
  
  const handleEndChallenge = (challenge: Challenge) => {
    setActionChallenge(challenge);
    setConfirmModalVisible(true);
  };
  
  const executeEndChallenge = async () => {
    if (!actionChallenge) return;
    
    try {
      // 챌린지 종료 (status + end_date 모두 업데이트)
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ 
          status: 'ended',
          end_date: now  // 관리자가 강제 종료 시 현재 시간으로 설정
        })
        .eq('id', actionChallenge.id);
      
      if (updateError) throw updateError;
      
      setSuccessMessage('Challenge ended! Voting is now open.');
      setSuccessModalVisible(true);
      setConfirmModalVisible(false);
      setActionChallenge(null);
      
      loadChallenges();
    } catch (error: any) {
      console.error('Failed to end challenge:', error);
      setErrorMessage(error.message || 'Failed to end challenge');
      setErrorModalVisible(true);
    }
  };
  
  const handleAnnounceWinner = async (challengeId: string) => {
    try {
      // Top 10 선정 및 우승자 발표
      const { data, error } = await supabase.rpc('announce_challenge_winner', {
        p_challenge_id: challengeId
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const winner = data[0];
        setSuccessMessage(`Winner announced: ${winner.winner_name} with ${winner.votes} votes!`);
      } else {
        setSuccessMessage('Challenge ended with no entries.');
      }
      setSuccessModalVisible(true);
      
      loadChallenges();
    } catch (error: any) {
      console.error('Failed to announce winner:', error);
      setErrorMessage(error.message || 'Failed to announce winner');
      setErrorModalVisible(true);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'voting': return colors.warning;
      case 'ended': return colors.textMuted;
      default: return colors.primary;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'voting': return 'Voting';
      case 'ended': return 'Ended';
      default: return 'Upcoming';
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? colors.darkBackground : colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? colors.darkText : colors.text }]}>
            Loading challenges...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBackground : colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={[
          styles.header,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Challenge Management
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateForm(!showCreateForm)}
            activeOpacity={0.7}
          >
            <Ionicons name={showCreateForm ? "close" : "add-circle"} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

      <ScrollView 
        style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChallenges(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        
        {/* Create Form */}
        {showCreateForm && (
          <View style={[styles.formCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
            <Text style={[styles.formTitle, { color: isDark ? colors.darkText : colors.text }]}>
              New Challenge
            </Text>
            
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.white,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                }
              ]}
              placeholder="Title"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.white,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                }
              ]}
              placeholder="Description"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.white,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                }
              ]}
              placeholder="Topic (e.g., #winter)"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={topic}
              onChangeText={setTopic}
            />
            
            {/* Tier Requirement */}
            <View style={styles.tierSection}>
              <Text style={[styles.label, { color: isDark ? colors.darkText : colors.text }]}>
                Tier Requirement
              </Text>
              <View style={styles.tierButtons}>
                <TouchableOpacity
                  style={[
                    styles.tierButton,
                    tierRequirement === 'new' && styles.tierButtonActive,
                    {
                      borderColor: tierRequirement === 'new' ? colors.primary : (isDark ? colors.darkBorder : colors.border),
                      backgroundColor: tierRequirement === 'new' ? `${colors.primary}20` : 'transparent',
                    }
                  ]}
                  onPress={() => setTierRequirement('new')}
                >
                  <Text style={[
                    styles.tierButtonText,
                    { color: tierRequirement === 'new' ? colors.primary : (isDark ? colors.darkTextMuted : colors.textMuted) }
                  ]}>
                    New Artists Only
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.tierButton,
                    tierRequirement === 'all' && styles.tierButtonActive,
                    {
                      borderColor: tierRequirement === 'all' ? colors.primary : (isDark ? colors.darkBorder : colors.border),
                      backgroundColor: tierRequirement === 'all' ? `${colors.primary}20` : 'transparent',
                    }
                  ]}
                  onPress={() => setTierRequirement('all')}
                  disabled
                  opacity={0.5}
                >
                  <Text style={[
                    styles.tierButtonText,
                    { color: isDark ? colors.darkTextMuted : colors.textMuted }
                  ]}>
                    All Artists (Coming Soon)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Info */}
            <View style={[styles.infoBox, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Challenge duration: 2 weeks{'\n'}
                Voting period: 1 week after challenge ends
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: creating ? colors.textMuted : colors.primary }
              ]}
              onPress={handleCreateChallenge}
              disabled={creating}
              activeOpacity={0.7}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Challenge</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Challenges List */}
        <View style={styles.challengesList}>
          {challenges.map((challenge) => (
            <View
              key={challenge.id}
              style={[styles.challengeCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}
            >
              <View style={styles.challengeHeader}>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: isDark ? colors.darkText : colors.text }]}>
                    {challenge.title}
                  </Text>
                  <Text style={[styles.challengeTopic, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    {challenge.topic}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(challenge.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(challenge.status) }]}>
                    {getStatusLabel(challenge.status)}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.challengeDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {challenge.description}
              </Text>
              
              <View style={styles.challengeStats}>
                <View style={styles.stat}>
                  <Ionicons name="heart" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                  <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    {challenge.total_votes} votes
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="images" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                  <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                    {challenge.entries_count} entries
                  </Text>
                </View>
              </View>
              
              {/* Actions */}
              <View style={styles.actions}>
                {challenge.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.warning }]}
                    onPress={() => handleEndChallenge(challenge)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>End & Start Voting</Text>
                  </TouchableOpacity>
                )}
                
                {challenge.status === 'voting' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleAnnounceWinner(challenge.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>Announce Winner</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {challenges.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color={isDark ? colors.darkTextMuted : colors.textMuted} />
              <Text style={[styles.emptyText, { color: isDark ? colors.darkText : colors.text }]}>
                No challenges yet
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Create your first challenge to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
      
      {/* Modals */}
      <SuccessModal
        visible={successModalVisible}
        title="Success"
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
      />
      
      <ErrorModal
        visible={errorModalVisible}
        title="Error"
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
      
      <ConfirmModal
        visible={confirmModalVisible}
        title="End Challenge"
        message={`Are you sure you want to end "${actionChallenge?.title}"? Voting will start immediately.`}
        onConfirm={executeEndChallenge}
        onCancel={() => {
          setConfirmModalVisible(false);
          setActionChallenge(null);
        }}
        confirmText="End Challenge"
        cancelText="Cancel"
        confirmColor={colors.warning}
        iconName="alert-circle-outline"
        iconColor={colors.warning}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tierSection: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tierButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tierButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  tierButtonActive: {
    borderWidth: 2,
  },
  tierButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  challengesList: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  challengeCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  challengeTopic: {
    ...typography.caption,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  challengeDescription: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  challengeStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h3,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    marginTop: spacing.xs,
  },
});
