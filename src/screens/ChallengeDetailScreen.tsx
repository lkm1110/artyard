/**
 * Challenge Detail Screen
 * 챌린지 상세 정보, 참가 작품, 투표
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';
import { ConfirmModal } from '../components/ConfirmModal';

const { width: screenWidth } = Dimensions.get('window');

interface Challenge {
  id: string;
  title: string;
  description: string;
  topic: string;
  start_date: string;
  end_date: string;
  voting_end_date: string;
  status: 'upcoming' | 'active' | 'voting' | 'ended';
  prize_description?: string;
  entries_count: number;
  participants_count: number;
}

interface Entry {
  id: string;
  artwork: any;
  author: any;
  votes_count: number;
  is_top_10: boolean;
  final_rank?: number;
  is_winner: boolean;
}

export const ChallengeDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  const { user } = useAuthStore();
  const isDark = useColorScheme() === 'dark';
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voting, setVoting] = useState(false);
  
  // Modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingVoteEntryId, setPendingVoteEntryId] = useState<string | null>(null);
  
  useEffect(() => {
    loadChallengeData();
  }, [id]);
  
  const loadChallengeData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 1. 챌린지 정보
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();
      
      if (challengeError) throw challengeError;
      
      // 2. 참가 작품 (Top 10 우선, 나머지는 투표수 순)
      const { data: entriesData, error: entriesError } = await supabase
        .from('challenge_entries')
        .select(`
          *,
          artwork:artworks(*),
          author:profiles(*)
        `)
        .eq('challenge_id', id)
        .order('is_top_10', { ascending: false })
        .order('votes_count', { ascending: false });
      
      if (entriesError) throw entriesError;
      setEntries(entriesData || []);
      
      // 실제 entries와 participants 수 계산
      const actualEntriesCount = entriesData?.length || 0;
      const uniqueAuthors = new Set(entriesData?.map(e => e.author_id) || []);
      const actualParticipantsCount = uniqueAuthors.size;
      
      // 챌린지 데이터에 실제 카운트 반영
      setChallenge({
        ...challengeData,
        entries_count: actualEntriesCount,
        participants_count: actualParticipantsCount,
      });
      
      // 3. 내 투표 확인
      if (user) {
        const { data: voteData } = await supabase
          .from('challenge_votes')
          .select('entry_id')
          .eq('challenge_id', id)
          .eq('voter_id', user.id)
          .single();
        
        if (voteData) setMyVote(voteData.entry_id);
        
        // 4. 내 참가 확인
        const { data: myEntry } = await supabase
          .from('challenge_entries')
          .select('id')
          .eq('challenge_id', id)
          .eq('author_id', user.id)
          .single();
        
        setHasSubmitted(!!myEntry);
      }
    } catch (error: any) {
      console.error('Failed to load challenge:', error);
      setErrorMessage(error.message || 'Failed to load challenge');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleVote = async (entryId: string) => {
    if (!user) {
      setErrorMessage('Please login to vote');
      setErrorModalVisible(true);
      return;
    }
    
    // 'active' 또는 'voting' 상태에서만 투표 가능
    if (challenge?.status !== 'voting' && challenge?.status !== 'active') {
      setErrorMessage('Voting is not open yet');
      setErrorModalVisible(true);
      return;
    }
    
    // 같은 작품 클릭 → 투표 취소
    if (myVote === entryId) {
      await executeVote(entryId);
      return;
    }
    
    // 이미 다른 작품에 투표한 경우 → 확인 모달 표시
    if (myVote && myVote !== entryId) {
      setPendingVoteEntryId(entryId);
      setConfirmModalVisible(true);
      return;
    }
    
    // 처음 투표하는 경우 → 바로 투표
    await executeVote(entryId);
  };
  
  const executeVote = async (entryId: string) => {
    try {
      setVoting(true);
      
      // 이전 투표 취소 (1계정 1작품만 투표 가능)
      if (myVote) {
        await supabase
          .from('challenge_votes')
          .delete()
          .eq('challenge_id', id)
          .eq('voter_id', user.id);
      }
      
      // 새 투표 (같은 작품이면 투표 취소)
      if (myVote !== entryId) {
        const { error } = await supabase
          .from('challenge_votes')
          .insert({
            challenge_id: id,
            entry_id: entryId,
            voter_id: user.id,
          });
        
        if (error) {
          console.error('Vote insert error:', error);
          throw error;
        }
        setMyVote(entryId);
        setSuccessMessage('Vote submitted successfully!');
      } else {
        setMyVote(null);
        setSuccessMessage('Vote cancelled');
      }
      
      setSuccessModalVisible(true);
      await loadChallengeData(true);
    } catch (error: any) {
      console.error('Vote failed:', error);
      setErrorMessage(error.message || 'Failed to vote. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setVoting(false);
    }
  };
  
  const handleConfirmVote = async () => {
    setConfirmModalVisible(false);
    if (pendingVoteEntryId) {
      await executeVote(pendingVoteEntryId);
      setPendingVoteEntryId(null);
    }
  };
  
  const handleSubmitArtwork = () => {
    if (!user) {
      setErrorMessage('Please login to submit artwork');
      setErrorModalVisible(true);
      return;
    }
    
    if (hasSubmitted) {
      setErrorMessage('You have already submitted an artwork to this challenge');
      setErrorModalVisible(true);
      return;
    }
    
    // Navigate to upload screen with challenge ID
    navigation.navigate('ArtworkUpload' as never, { challengeId: id } as never);
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
      case 'active': return 'Ongoing - Submit Your Work!';
      case 'voting': return 'Voting in Progress';
      case 'ended': return 'Ended';
      default: return 'Upcoming';
    }
  };
  
  const getDaysRemaining = () => {
    if (!challenge) return '';
    
    const now = new Date();
    const targetDate = challenge.status === 'voting' 
      ? new Date(challenge.voting_end_date)
      : new Date(challenge.end_date);
    
    const diffMs = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={[styles.topHeader, { backgroundColor: isDark ? colors.darkBackground : colors.background, borderBottomColor: isDark ? colors.darkBorder : colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? colors.darkText : colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Challenge
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChallengeData(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Challenge Header */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(challenge?.status || 'upcoming') }]}>
            <Text style={styles.statusText}>{getStatusLabel(challenge?.status || 'upcoming')}</Text>
          </View>
          
          <Text style={[styles.topic, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {challenge?.topic}
          </Text>
          
          <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
            {challenge?.title}
          </Text>
          
          <Text style={[styles.description, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {challenge?.description}
          </Text>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {challenge?.entries_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Entries
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {challenge?.participants_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Participants
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: getStatusColor(challenge?.status || 'upcoming') }]}>
                {getDaysRemaining()}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Time Left
              </Text>
            </View>
          </View>
          
          {/* Submit Button */}
          {challenge?.status === 'active' && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: hasSubmitted ? colors.textMuted : colors.primary }
              ]}
              onPress={handleSubmitArtwork}
              disabled={hasSubmitted}
              activeOpacity={0.7}
            >
              <Ionicons name={hasSubmitted ? "checkmark-circle" : "add-circle"} size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>
                {hasSubmitted ? 'Already Submitted' : 'Submit Artwork'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Winner Section (챌린지 종료 후) */}
        {challenge?.status === 'ended' && entries.find(e => e.is_winner && e.final_rank === 1) && (
          <View style={styles.section}>
            <View style={styles.winnerHeader}>
              <Ionicons name="trophy" size={32} color={colors.warning} />
              <Text style={[styles.winnerHeaderTitle, { color: isDark ? colors.darkText : colors.text }]}>
                🎉 Challenge Winner
              </Text>
            </View>
            {entries
              .filter(e => e.is_winner && e.final_rank === 1)
              .map((entry) => (
                <View key={entry.id} style={[styles.winnerCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
                  {/* Winner Crown */}
                  <View style={styles.winnerCrown}>
                    <Ionicons name="trophy" size={48} color={colors.warning} />
                  </View>
                  
                  {entry.artwork?.images?.[0] && (
                    <View style={styles.winnerImageContainer}>
                      <Image
                        source={{ uri: entry.artwork.images[0] }}
                        style={styles.winnerImage}
                        resizeMode="cover"
                      />
                      <View style={styles.winnerOverlay}>
                        <Text style={styles.winnerOverlayText}>1ST PLACE</Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.winnerInfo}>
                    <Text style={[styles.winnerTitle, { color: isDark ? colors.darkText : colors.text }]}>
                      {entry.artwork?.title}
                    </Text>
                    {entry.artwork?.description && (
                      <Text style={[styles.winnerDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                        {entry.artwork.description}
                      </Text>
                    )}
                    <View style={styles.winnerMeta}>
                      <Ionicons name="person-circle" size={20} color={colors.primary} />
                      <Text style={[styles.winnerArtist, { color: isDark ? colors.darkText : colors.text }]}>
                        @{entry.author?.handle}
                      </Text>
                      {entry.artwork?.size && (
                        <>
                          <Text style={[styles.metaDivider, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>•</Text>
                          <Text style={[styles.winnerSize, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                            {entry.artwork.size}
                          </Text>
                        </>
                      )}
                    </View>
                    <View style={styles.winnerStats}>
                      <View style={styles.winnerStatItem}>
                        <Ionicons name="heart" size={24} color={colors.error} />
                        <Text style={[styles.winnerStatValue, { color: isDark ? colors.darkText : colors.text }]}>
                          {entry.votes_count}
                        </Text>
                        <Text style={[styles.winnerStatLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                          votes
                        </Text>
                      </View>
                    </View>
                    
                    {/* Auction Notice */}
                    <View style={[styles.auctionNotice, { backgroundColor: `${colors.warning}15` }]}>
                      <Ionicons name="hammer" size={20} color={colors.warning} />
                      <Text style={[styles.auctionNoticeText, { color: colors.warning }]}>
                        This artwork will be featured in the quarterly auction
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}
        
        {/* Top 10 Section */}
        {entries.some(e => e.is_top_10) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
              {challenge?.status === 'ended' ? 'Top 10 Finalists' : 'Top 10'}
            </Text>
            {entries
              .filter(e => e.is_top_10 && !(e.is_winner && e.final_rank === 1))
              .map((entry) => (
                <View key={entry.id} style={[styles.entryCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
                  <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.rankText}>#{entry.final_rank}</Text>
                  </View>
                  
                  {entry.artwork?.images?.[0] && (
                    <View>
                      <Image
                        source={{ uri: entry.artwork.images[0] }}
                        style={styles.artworkImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  <View style={styles.entryInfo}>
                    <Text style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}>
                      {entry.artwork?.title}
                    </Text>
                    {entry.artwork?.description && (
                      <Text 
                        style={[styles.artworkDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {entry.artwork.description}
                      </Text>
                    )}
                    <View style={styles.artworkMeta}>
                      <Text style={[styles.artistName, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                        by {(entry.final_rank && entry.final_rank <= 3) || challenge?.status === 'ended' 
                          ? `@${entry.author?.handle}` 
                          : 'Anonymous'}
                      </Text>
                      {entry.artwork?.size && (
                        <>
                          <Text style={[styles.metaDivider, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>•</Text>
                          <Text style={[styles.artworkSize, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                            {entry.artwork.size}
                          </Text>
                        </>
                      )}
                    </View>
                    
                    <View style={styles.entryFooter}>
                      <View style={styles.voteInfo}>
                        <Ionicons name="heart" size={16} color={colors.error} />
                        <Text style={[styles.voteCount, { color: isDark ? colors.darkText : colors.text }]}>
                          {entry.votes_count} votes
                        </Text>
                      </View>
                      
                      {(challenge?.status === 'voting' || challenge?.status === 'active') && (
                        <TouchableOpacity
                          style={[
                            styles.voteButton,
                            myVote === entry.id && styles.voteButtonActive,
                            { 
                              backgroundColor: myVote === entry.id ? colors.primary : 'transparent',
                              borderColor: colors.primary
                            }
                          ]}
                          onPress={() => handleVote(entry.id)}
                          disabled={voting}
                        >
                          <Text style={[
                            styles.voteButtonText,
                            { color: myVote === entry.id ? colors.white : colors.primary }
                          ]}>
                            {myVote === entry.id ? 'Voted' : 'Vote'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      {entry.is_winner && (
                        <View style={[styles.winnerBadge, { backgroundColor: colors.warning }]}>
                          <Ionicons name="trophy" size={16} color={colors.white} />
                          <Text style={styles.winnerText}>Winner</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}
        
        {/* All Entries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
            {entries.some(e => e.is_top_10) ? 'All Entries' : 'Entries'}
          </Text>
          {entries
            .filter(e => !e.is_top_10)
            .map((entry) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
                {entry.artwork?.images?.[0] && (
                  <View>
                    <Image
                      source={{ uri: entry.artwork.images[0] }}
                      style={styles.artworkImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                <View style={styles.entryInfo}>
                  <Text style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}>
                    {entry.artwork?.title}
                  </Text>
                  {entry.artwork?.description && (
                    <Text 
                      style={[styles.artworkDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
                      numberOfLines={2}
                    >
                      {entry.artwork.description}
                    </Text>
                  )}
                  <View style={styles.artworkMeta}>
                    <Text style={[styles.artistName, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      by {challenge?.status === 'ended' ? `@${entry.author?.handle}` : 'Anonymous'}
                    </Text>
                    {entry.artwork?.size && (
                      <>
                        <Text style={[styles.metaDivider, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>•</Text>
                        <Text style={[styles.artworkSize, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                          {entry.artwork.size}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  <View style={styles.entryFooter}>
                    <View style={styles.voteInfo}>
                      <Ionicons name="heart" size={16} color={colors.error} />
                      <Text style={[styles.voteCount, { color: isDark ? colors.darkText : colors.text }]}>
                        {entry.votes_count} votes
                      </Text>
                    </View>
                    
                    {(challenge?.status === 'voting' || challenge?.status === 'active') && (
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          myVote === entry.id && styles.voteButtonActive,
                          { 
                            backgroundColor: myVote === entry.id ? colors.primary : 'transparent',
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => handleVote(entry.id)}
                        disabled={voting}
                      >
                        <Text style={[
                          styles.voteButtonText,
                          { color: myVote === entry.id ? colors.white : colors.primary }
                        ]}>
                          {myVote === entry.id ? 'Voted' : 'Vote'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          
          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color={isDark ? colors.darkTextMuted : colors.textMuted} />
              <Text style={[styles.emptyText, { color: isDark ? colors.darkText : colors.text }]}>
                No entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Be the first to submit your artwork!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
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
      
      {/* Confirm Vote Change Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        title="Change Vote?"
        message="You have already voted for another artwork. Do you want to cancel your previous vote and vote for this artwork instead?"
        confirmText="Change Vote"
        cancelText="Cancel"
        onConfirm={handleConfirmVote}
        onCancel={() => {
          setConfirmModalVisible(false);
          setPendingVoteEntryId(null);
        }}
        type="warning"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  headerRight: {
    width: 40, // 뒤로가기 버튼과 균형 맞추기
  },
  scrollViewContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  topic: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  entryCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    zIndex: 1,
  },
  rankText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  artworkImage: {
    width: '100%',
    height: screenWidth - (spacing.lg * 2),
    backgroundColor: colors.border,
  },
  entryInfo: {
    padding: spacing.md,
  },
  artworkTitle: {
    ...typography.h4,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  artworkDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  artworkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  artistName: {
    ...typography.body,
    fontSize: 14,
  },
  metaDivider: {
    ...typography.body,
    fontSize: 14,
    marginHorizontal: spacing.xs,
  },
  artworkSize: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '500',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voteCount: {
    ...typography.body,
    fontWeight: '600',
  },
  voteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  voteButtonActive: {
    borderWidth: 0,
  },
  voteButtonText: {
    ...typography.button,
    fontWeight: '600',
    fontSize: 14,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    gap: spacing.xs,
  },
  winnerText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  // Winner Section Styles
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  winnerHeaderTitle: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  winnerCard: {
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  winnerCrown: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    backgroundColor: colors.white,
    borderRadius: 999,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  winnerImageContainer: {
    position: 'relative',
  },
  winnerImage: {
    width: '100%',
    height: screenWidth - (spacing.lg * 2),
    backgroundColor: colors.border,
  },
  winnerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  winnerOverlayText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  winnerInfo: {
    padding: spacing.lg,
  },
  winnerTitle: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  winnerDescription: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  winnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  winnerArtist: {
    ...typography.h4,
    fontWeight: '600',
  },
  winnerSize: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  winnerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  winnerStatItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  winnerStatValue: {
    ...typography.h1,
    fontWeight: 'bold',
  },
  winnerStatLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  auctionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  auctionNoticeText: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
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
