/**
 * Challenge 상세 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  getChallengeDetail,
  getChallengeEntries,
  joinChallenge,
  voteChallengeEntry,
} from '../services/challengeService';
import { supabase } from '../services/supabase';
import { Challenge, ChallengeEntry } from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

type RouteParams = {
  ChallengeDetail: {
    id: string;
  };
};

export const ChallengeDetailScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'ChallengeDetail'>>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  
  // 작품 선택 모달
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [myArtworks, setMyArtworks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    loadChallengeData();
  }, [route.params.id, sortBy]);
  
  const loadChallengeData = async () => {
    try {
      setLoading(true);
      const [challengeData, entriesData] = await Promise.all([
        getChallengeDetail(route.params.id),
        getChallengeEntries(route.params.id, sortBy),
      ]);
      
      setChallenge(challengeData);
      setEntries(entriesData);
    } catch (error: any) {
      console.error('챌린지 로드 실패:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    } finally {
      setLoading(false);
    }
  };
  
  // 내 작품 목록 로드
  const loadMyArtworks = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // 이미 참여한 작품 필터링
      const enteredArtworkIds = entries
        .filter(e => e.author_id === user.id)
        .map(e => e.artwork_id);
      
      const availableArtworks = data?.filter(
        a => !enteredArtworkIds.includes(a.id)
      ) || [];
      
      setMyArtworks(availableArtworks);
    } catch (error: any) {
      console.error('내 작품 로드 실패:', error);
    }
  };
  
  // 작품 등록 모달 열기
  const handleOpenSelectModal = async () => {
    if (!user) {
      Alert.alert('Notice', 'Please log in to participate');
      return;
    }
    
    if (!challenge) return;
    
    // 종료된 챌린지 확인
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    
    if (now > endDate || challenge.status !== 'active') {
      Alert.alert('Notice', 'This challenge has ended');
      return;
    }
    
    // 내 작품 로드
    await loadMyArtworks();
    setSelectModalVisible(true);
  };
  
  // 작품 참여시키기
  const handleSubmitArtwork = async (artworkId: string) => {
    try {
      setSubmitting(true);
      
      await joinChallenge({
        challenge_id: route.params.id,
        artwork_id: artworkId,
        description: '', // 선택사항
      });
      
      Alert.alert('Success', 'Your artwork has been submitted to the challenge!');
      setSelectModalVisible(false);
      loadChallengeData(); // 목록 새로고침
    } catch (error: any) {
      console.error('작품 등록 실패:', error);
      Alert.alert('Error', error.message || 'Failed to submit artwork');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 투표
  const handleVote = async (artworkId: string) => {
    try {
      await voteChallengeEntry(artworkId);
      loadChallengeData();
    } catch (error: any) {
      console.error('투표 실패:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };
  
  // 남은 시간 계산
  const getDaysRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };
  
  const renderEntry = ({ item }: { item: ChallengeEntry }) => {
    const artwork = item.artwork;
    const isWinner = item.is_winner;
    
    return (
      <TouchableOpacity
        style={[
          styles.entryCard,
          { backgroundColor: isDark ? colors.darkCard : colors.card },
          isWinner && styles.winnerCard,
        ]}
        onPress={() => navigation.navigate('ArtworkDetail' as never, { artwork } as never)}
      >
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>🏆 Winner</Text>
          </View>
        )}
        
        <Image
          source={{ uri: artwork.image_urls[0] }}
          style={styles.entryImage}
          resizeMode="cover"
        />
        
        <View style={styles.entryInfo}>
          <Text
            style={[styles.entryTitle, { color: isDark ? colors.darkText : colors.text }]}
            numberOfLines={1}
          >
            {artwork.title}
          </Text>
          <Text
            style={[styles.entryAuthor, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
          >
            by {item.author?.handle || 'Unknown'}
          </Text>
          
          <View style={styles.entryStats}>
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVote(artwork.id)}
            >
              <Text style={styles.voteText}>❤️ {item.votes_count || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!challenge) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Challenge not found</Text>
      </View>
    );
  }
  
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const isActive = challenge.status === 'active' && daysRemaining !== 'Ended';
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <ScrollView>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <Text style={[styles.topic, { color: colors.primary }]}>#{challenge.topic}</Text>
            <View style={[
              styles.statusBadge,
              isActive && styles.statusBadgeActive,
            ]}>
              <Text style={[
                styles.statusText,
                isActive && styles.statusTextActive,
              ]}>
                {daysRemaining}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.description, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            {challenge.description}
          </Text>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {challenge.participants_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Participants
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                {challenge.entries_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Entries
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: isDark ? colors.darkText : colors.text }]}>
                ${challenge.prize_pool || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Prize
              </Text>
            </View>
          </View>
          
          {isActive && (
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenSelectModal}
            >
              <Text style={styles.submitButtonText}>Submit Artwork</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 정렬 */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'popular' && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy('popular')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'popular' && styles.sortButtonTextActive,
              ]}
            >
              Most Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'recent' && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy('recent')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'recent' && styles.sortButtonTextActive,
              ]}
            >
              Most Recent
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 참여 작품 목록 */}
        <View style={styles.entriesContainer}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                No entries yet. Be the first to participate!
              </Text>
            </View>
          ) : (
            <FlatList
              data={entries}
              renderItem={renderEntry}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
      
      {/* 작품 선택 모달 */}
      <Modal
        visible={selectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Select Artwork to Submit
            </Text>
            <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {myArtworks.length === 0 ? (
            <View style={styles.emptyModal}>
              <Text style={[styles.emptyModalText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                No available artworks.{'\n'}Upload a new artwork first!
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSelectModalVisible(false);
                  navigation.navigate('Upload' as never);
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Artwork</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={myArtworks}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.artworkCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}
                  onPress={() => handleSubmitArtwork(item.id)}
                  disabled={submitting}
                >
                  <Image
                    source={{ uri: item.image_urls[0] }}
                    style={styles.artworkImage}
                  />
                  <View style={styles.artworkInfo}>
                    <Text style={[styles.artworkTitle, { color: isDark ? colors.darkText : colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.artworkPrice, { color: colors.primary }]}>
                      ${item.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topic: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.textMuted,
  },
  statusBadgeActive: {
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  statusTextActive: {
    color: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sortButtonTextActive: {
    color: colors.white,
  },
  entriesContainer: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  entryCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  entryImage: {
    width: '100%',
    aspectRatio: 1,
  },
  entryInfo: {
    padding: spacing.sm,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  entryAuthor: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteText: {
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
  },
  emptyModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  uploadButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  artworkCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    aspectRatio: 1,
  },
  artworkInfo: {
    padding: spacing.sm,
  },
  artworkTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  artworkPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

