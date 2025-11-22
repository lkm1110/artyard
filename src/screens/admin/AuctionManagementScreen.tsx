/**
 * Admin Auction Management Screen
 * 분기별 경매 생성 및 챌린지 우승작 추가
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
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface Auction {
  id: string;
  title: string;
  description: string;
  quarter: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended';
  items_count: number;
  total_bids: number;
}

interface ChallengeWinner {
  id: string;
  challenge_id: string;
  challenge_title: string;
  artwork_id: string;
  artwork_title: string;
  artist_id: string;
  artist_name: string;
  auction_reserve_price: number;
  votes_count: number;
  is_in_auction: boolean;
  final_rank: number;
}

export const AuctionManagementScreen = () => {
  const isDark = useColorScheme() === 'dark';
  
  // State
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [winners, setWinners] = useState<ChallengeWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quarter, setQuarter] = useState('');
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  
  // Modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionAuction, setActionAuction] = useState<Auction | null>(null);
  const [actionType, setActionType] = useState<'start' | 'end'>('start');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      await Promise.all([loadAuctions(), loadWinners()]);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_auctions')
        .select(`
          *,
          items:auction_items(count)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(auction => ({
        ...auction,
        items_count: auction.items?.[0]?.count || 0,
        total_bids: 0, // TODO: aggregate from auction_items
      })) || [];

      setAuctions(formatted);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    }
  };

  const loadWinners = async () => {
    try {
      // 경매에 추가되지 않은 Top 3 작품 조회 (1, 2, 3등)
      // 종료된 챌린지만 포함 (end_date가 과거인 것 또는 status='ended')
      const { data, error } = await supabase
        .from('challenge_entries')
        .select(`
          id,
          challenge_id,
          challenges:challenge_id (title, end_date, status),
          artwork_id,
          artworks:artwork_id (title),
          author_id,
          profiles:author_id (handle),
          auction_reserve_price,
          votes_count,
          final_rank
        `)
        .in('final_rank', [1, 2, 3])
        .not('final_rank', 'is', null)
        .order('created_at', { ascending: false })
        .order('final_rank', { ascending: true });

      if (error) throw error;

      console.log('📊 [loadWinners] Total entries with rank 1-3:', data?.length || 0);

      // 종료된 챌린지만 필터링 (status='ended' 또는 end_date < now)
      const now = new Date();
      const endedChallenges = data?.filter(entry => {
        const challenge = entry.challenges as any;
        const endDate = challenge?.end_date;
        const status = challenge?.status;
        
        const isEnded = status === 'ended' || (endDate && new Date(endDate) < now);
        
        if (isEnded) {
          console.log(`✅ Ended challenge: ${challenge?.title}, status=${status}, end_date=${endDate}`);
        }
        
        return isEnded;
      }) || [];

      console.log('🏆 [loadWinners] Ended challenges with winners:', endedChallenges.length);

      // 이미 경매에 추가된 작품 확인
      const { data: auctionItems } = await supabase
        .from('auction_items')
        .select('artwork_id');

      const auctionArtworkIds = new Set(auctionItems?.map(item => item.artwork_id) || []);

      const formatted: ChallengeWinner[] = endedChallenges.map(entry => ({
        id: entry.id,
        challenge_id: entry.challenge_id,
        challenge_title: (entry.challenges as any)?.title || 'Unknown',
        artwork_id: entry.artwork_id,
        artwork_title: `${(entry.artworks as any)?.title || 'Untitled'}`,
        artist_id: entry.author_id,
        artist_name: (entry.profiles as any)?.handle || 'Unknown',
        auction_reserve_price: entry.auction_reserve_price || 0,
        votes_count: entry.votes_count || 0,
        is_in_auction: auctionArtworkIds.has(entry.artwork_id),
        final_rank: entry.final_rank,
      })) || [];

      setWinners(formatted);
    } catch (error) {
      console.error('Failed to load winners:', error);
    }
  };

  const handleCreateAuction = async () => {
    if (!title.trim() || !quarter.trim()) {
      setErrorMessage('Please fill in all required fields');
      setErrorModalVisible(true);
      return;
    }

    if (selectedWinners.length === 0) {
      setErrorMessage('Please select at least one winner artwork to create an auction');
      setErrorModalVisible(true);
      return;
    }

    try {
      setCreating(true);

      // 1. 경매 생성
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7일간 진행

      const { data: auction, error: auctionError } = await supabase
        .from('challenge_auctions')
        .insert({
          title: title.trim(),
          description: description.trim(),
          quarter: quarter.trim(),
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'upcoming',
        })
        .select()
        .single();

      if (auctionError) throw auctionError;

      // 2. 선택된 우승작들을 경매에 추가
      const selectedWinnerData = winners.filter(w => selectedWinners.includes(w.id));
      
      const auctionItems = selectedWinnerData.map(winner => ({
        auction_id: auction.id,
        challenge_entry_id: winner.id,
        artwork_id: winner.artwork_id,
        artist_id: winner.artist_id,
        reserve_price: winner.auction_reserve_price,
        starting_price: winner.auction_reserve_price,
        current_price: winner.auction_reserve_price,
        bids_count: 0,
      }));

      const { error: itemsError } = await supabase
        .from('auction_items')
        .insert(auctionItems);

      if (itemsError) throw itemsError;

      setSuccessMessage(
        `Auction created successfully!\n\n` +
        `${selectedWinners.length} artworks added to auction.`
      );
      setSuccessModalVisible(true);

      // Reset form
      setTitle('');
      setDescription('');
      setQuarter('');
      setSelectedWinners([]);
      setShowCreateForm(false);

      loadData();
    } catch (error: any) {
      console.error('Failed to create auction:', error);
      setErrorMessage(error.message || 'Failed to create auction');
      setErrorModalVisible(true);
    } finally {
      setCreating(false);
    }
  };

  const handleStartAuction = (auction: Auction) => {
    setActionAuction(auction);
    setActionType('start');
    setConfirmModalVisible(true);
  };

  const executeStartAuction = async () => {
    if (!actionAuction) return;

    try {
      const { error } = await supabase
        .from('challenge_auctions')
        .update({ status: 'active' })
        .eq('id', actionAuction.id);

      if (error) throw error;

      setSuccessMessage('Auction started successfully!');
      setSuccessModalVisible(true);
      setConfirmModalVisible(false);
      setActionAuction(null);
      loadAuctions();
    } catch (error: any) {
      console.error('Failed to start auction:', error);
      setErrorMessage(error.message || 'Failed to start auction');
      setErrorModalVisible(true);
    }
  };

  const handleEndAuction = (auction: Auction) => {
    setActionAuction(auction);
    setActionType('end');
    setConfirmModalVisible(true);
  };

  const executeEndAuction = async () => {
    if (!actionAuction) return;

    try {
      const { error } = await supabase
        .from('challenge_auctions')
        .update({ status: 'ended' })
        .eq('id', actionAuction.id);

      if (error) throw error;

      setSuccessMessage('Auction ended successfully!');
      setSuccessModalVisible(true);
      setConfirmModalVisible(false);
      setActionAuction(null);
      loadAuctions();
    } catch (error: any) {
      console.error('Failed to end auction:', error);
      setErrorMessage(error.message || 'Failed to end auction');
      setErrorModalVisible(true);
    }
  };

  const toggleWinnerSelection = (winnerId: string) => {
    setSelectedWinners(prev => 
      prev.includes(winnerId)
        ? prev.filter(id => id !== winnerId)
        : [...prev, winnerId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return colors.info;
      case 'active': return colors.success;
      case 'ended': return colors.textMuted;
      default: return colors.text;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'active': return 'Active';
      case 'ended': return 'Ended';
      default: return status;
    }
  };

  const generateQuarterSuggestion = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const q = Math.ceil(month / 3);
    return `Q${q} ${year}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return colors.border;
    }
  };

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 1: return '🥇 1st';
      case 2: return '🥈 2nd';
      case 3: return '🥉 3rd';
      default: return `#${rank}`;
    }
  };

  // 챌린지별로 그룹화
  const groupedWinners = winners
    .filter(w => !w.is_in_auction)
    .reduce((acc, winner) => {
      if (!acc[winner.challenge_id]) {
        acc[winner.challenge_id] = {
          challenge_id: winner.challenge_id,
          challenge_title: winner.challenge_title,
          winners: [],
        };
      }
      acc[winner.challenge_id].winners.push(winner);
      return acc;
    }, {} as Record<string, { challenge_id: string; challenge_title: string; winners: ChallengeWinner[] }>);

  const challengeGroups = Object.values(groupedWinners);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? colors.darkText : colors.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? colors.darkBorder : colors.border }]}>
        <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Auction Management
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setShowCreateForm(!showCreateForm);
            setQuarter(generateQuarterSuggestion());
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={showCreateForm ? "close" : "add"} size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Create Form */}
        {showCreateForm && (
          <View style={[styles.createForm, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
            <Text style={[styles.formTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Create Quarterly Auction
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.background,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                },
              ]}
              placeholder="Auction Title (e.g., Q1 2025 Winners Auction)"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.background,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                },
              ]}
              placeholder="Description"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.background,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                },
              ]}
              placeholder="Quarter (e.g., Q1 2025)"
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={quarter}
              onChangeText={setQuarter}
            />

            {/* Available Winners - Grouped by Challenge */}
            <View style={styles.winnersSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                Select Challenge Winners ({winners.filter(w => !w.is_in_auction).length} available from {challengeGroups.length} challenges)
              </Text>

              {winners.filter(w => !w.is_in_auction).length === 0 ? (
                <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  No available winners. Announce challenge winners first!
                </Text>
              ) : (
                challengeGroups.map(group => (
                  <View key={group.challenge_id} style={styles.challengeGroup}>
                    <View style={styles.challengeHeader}>
                      <Text style={[styles.challengeTitle, { color: isDark ? colors.darkText : colors.text }]}>
                        {group.challenge_title}
                      </Text>
                      <TouchableOpacity
                        style={[styles.selectAllButton, { backgroundColor: colors.primary + '20' }]}
                        onPress={() => {
                          const allSelected = group.winners.every(w => selectedWinners.includes(w.id));
                          if (allSelected) {
                            // Deselect all
                            setSelectedWinners(prev => prev.filter(id => !group.winners.map(w => w.id).includes(id)));
                          } else {
                            // Select all
                            setSelectedWinners(prev => [...new Set([...prev, ...group.winners.map(w => w.id)])]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.selectAllText, { color: colors.primary }]}>
                          {group.winners.every(w => selectedWinners.includes(w.id)) ? 'Deselect All' : 'Select All'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {group.winners.map(winner => (
                      <TouchableOpacity
                        key={winner.id}
                        style={[
                          styles.winnerItem,
                          {
                            backgroundColor: selectedWinners.includes(winner.id)
                              ? `${colors.primary}20`
                              : isDark ? colors.darkBackground : colors.background,
                            borderColor: selectedWinners.includes(winner.id)
                              ? colors.primary
                              : getRankColor(winner.final_rank),
                            borderWidth: 3,
                          },
                        ]}
                        onPress={() => toggleWinnerSelection(winner.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.rankBadge, { backgroundColor: getRankColor(winner.final_rank) }]}>
                          <Text style={styles.rankBadgeText}>{getRankLabel(winner.final_rank)}</Text>
                        </View>
                        <View style={styles.winnerInfo}>
                          <Text style={[styles.winnerTitle, { color: isDark ? colors.darkText : colors.text }]}>
                            {winner.artwork_title}
                          </Text>
                          <Text style={[styles.winnerSubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                            by @{winner.artist_name}
                          </Text>
                          <View style={styles.winnerStats}>
                            <Text style={[styles.winnerStat, { color: colors.success }]}>
                              ❤️ {winner.votes_count} votes
                            </Text>
                            <Text style={[styles.winnerStat, { color: colors.warning }]}>
                              Min: ${winner.auction_reserve_price}
                            </Text>
                          </View>
                        </View>
                        {selectedWinners.includes(winner.id) && (
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: creating || selectedWinners.length === 0
                    ? colors.textMuted
                    : colors.primary,
                },
              ]}
              onPress={handleCreateAuction}
              disabled={creating || selectedWinners.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {creating ? 'Creating...' : selectedWinners.length === 0 ? 'Select artworks to continue' : `Create Auction (${selectedWinners.length} items)`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auctions List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
            All Auctions ({auctions.length})
          </Text>

          {auctions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
              <Ionicons name="hammer-outline" size={48} color={isDark ? colors.darkTextMuted : colors.textMuted} />
              <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                No auctions yet. Create your first quarterly auction!
              </Text>
            </View>
          ) : (
            auctions.map(auction => (
              <View
                key={auction.id}
                style={[styles.auctionCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}
              >
                <View style={styles.auctionHeader}>
                  <View style={styles.auctionHeaderLeft}>
                    <Text style={[styles.auctionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                      {auction.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(auction.status)}20` },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(auction.status) }]}>
                        {getStatusLabel(auction.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.auctionDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  {auction.description}
                </Text>

                <View style={styles.auctionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                    <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      {new Date(auction.start_date).toLocaleDateString()} - {new Date(auction.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="images-outline" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
                    <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      {auction.items_count} items
                    </Text>
                  </View>
                </View>

                {auction.status === 'upcoming' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleStartAuction(auction)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Start Auction</Text>
                  </TouchableOpacity>
                )}
                
                {auction.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleEndAuction(auction)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={20} color="white" />
                    <Text style={styles.actionButtonText}>End Auction</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
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

      <ConfirmModal
        visible={confirmModalVisible}
        title={actionType === 'start' ? 'Start Auction' : 'End Auction'}
        message={
          actionType === 'start'
            ? `Are you sure you want to start "${actionAuction?.title}"? Users will be able to place bids.`
            : `Are you sure you want to end "${actionAuction?.title}"? No more bids will be accepted.`
        }
        onConfirm={actionType === 'start' ? executeStartAuction : executeEndAuction}
        onCancel={() => {
          setConfirmModalVisible(false);
          setActionAuction(null);
        }}
        confirmText={actionType === 'start' ? 'Start Auction' : 'End Auction'}
        cancelText="Cancel"
        confirmColor={actionType === 'start' ? colors.success : colors.error}
        iconName={actionType === 'start' ? 'play-circle-outline' : 'stop-circle-outline'}
        iconColor={actionType === 'start' ? colors.success : colors.error}
      />
    </SafeAreaView>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  createForm: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  winnersSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  challengeGroup: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary + '40',
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  selectAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  winnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  winnerInfo: {
    flex: 1,
    marginTop: spacing.sm,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  winnerSubtitle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  winnerStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  winnerStat: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    padding: spacing.lg,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 15,
    textAlign: 'center',
  },
  auctionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  auctionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  auctionDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  auctionStats: {
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

