/**
 * Challenge 목록 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getActiveChallenges, getChallenges } from '../services/challengeService';
import { Challenge, getChallengeStatusLabel } from '../types/complete-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { supabase } from '../services/supabase';

interface Auction {
  id: string;
  title: string;
  description: string;
  quarter: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended' | 'completed';
  artworks_count: number;
}

export const ChallengesScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'ended' | 'auctions'>('active');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    loadChallenges();
  }, [filter]);
  
  // 1초마다 현재 시간 업데이트 (타이머용)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadChallenges = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (filter === 'auctions') {
        // Load auctions
        const { data, error } = await supabase
          .from('challenge_auctions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setAuctions(data || []);
      } else {
        // Load challenges
        let data;
        if (filter === 'active') {
          data = await getActiveChallenges();
        } else if (filter === 'ended') {
          data = await getChallenges('ended');
        }
        setChallenges(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const getChallengeTimeRemaining = (endDate: string): string => {
    const now = currentTime;
    const end = new Date(endDate).getTime();
    const distance = end - now;
    
    if (distance < 0) {
      return 'Ended';
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'ended': return colors.warning;
      case 'completed': return colors.textMuted;
      default: return colors.primary;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Live Auction';
      case 'ended': return 'Ended';
      case 'completed': return 'Completed';
      default: return 'Coming Soon';
    }
  };
  
  const getTimeRemaining = (endDate: string) => {
    const now = currentTime;
    const end = new Date(endDate).getTime();
    const distance = end - now;
    
    if (distance < 0) {
      return 'Auction Ended';
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const renderAuction = ({ item }: { item: Auction }) => {
    const timeRemaining = getTimeRemaining(item.end_date);
    const isEnded = timeRemaining === 'Auction Ended';
    
    return (
      <TouchableOpacity
        style={styles.challengeCard}
        onPress={() => navigation.navigate('AuctionDetail' as never, { auctionId: item.id } as never)}
        activeOpacity={0.7}
      >
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTopic}>{item.quarter}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <Text style={styles.challengeDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Countdown Timer */}
        {item.status === 'active' && (
          <View style={[
            styles.timerBadge,
            { backgroundColor: isEnded ? `${colors.error}15` : `${colors.primary}15` }
          ]}>
            <Ionicons 
              name={isEnded ? 'close-circle' : 'time-outline'} 
              size={16} 
              color={isEnded ? colors.error : colors.primary} 
            />
            <Text style={[
              styles.timerText,
              { color: isEnded ? colors.error : colors.primary }
            ]}>
              {isEnded ? '경매 종료' : `종료까지: ${timeRemaining}`}
            </Text>
          </View>
        )}
        
        <View style={styles.challengeStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Artworks</Text>
            <Text style={styles.statValue}>{item.artworks_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Period</Text>
            <Text style={styles.statValue}>
              {new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        
        {item.status === 'active' && !isEnded && (
          <View style={[styles.winnerBanner, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="hammer" size={20} color={colors.success} />
            <Text style={[styles.winnerBannerText, { color: colors.success }]}>
              Live bidding now!
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const timeRemaining = getChallengeTimeRemaining(item.end_date);
    const isActive = item.status === 'active';
    const isEnded = timeRemaining === 'Ended';
    
    return (
      <TouchableOpacity
        style={styles.challengeCard}
        onPress={() => navigation.navigate('ChallengeDetail' as never, { id: item.id } as never)}
      >
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTopic}>#{item.topic}</Text>
          <View style={[
            styles.statusBadge,
            isActive && styles.statusBadgeActive,
          ]}>
            <Text style={[
              styles.statusText,
              isActive && styles.statusTextActive,
            ]}>
              {getChallengeStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <Text style={styles.challengeDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Countdown Timer for Active Challenges */}
        {isActive && (
          <View style={[
            styles.timerBadge,
            { backgroundColor: isEnded ? `${colors.error}15` : `${colors.success}15` }
          ]}>
            <Ionicons 
              name={isEnded ? 'close-circle' : 'time-outline'} 
              size={16} 
              color={isEnded ? colors.error : colors.success} 
            />
            <Text style={[
              styles.timerText,
              { color: isEnded ? colors.error : colors.success }
            ]}>
              {isEnded ? 'Ended' : `Ends in: ${timeRemaining}`}
            </Text>
          </View>
        )}
        
        <View style={styles.challengeStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Participants</Text>
            <Text style={styles.statValue}>{item.participants_count}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Entries</Text>
            <Text style={styles.statValue}>{item.entries_count}</Text>
          </View>
          {!isActive && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[
                styles.statValue,
                styles.statValueEnded,
              ]}>
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>
        
        {item.status === 'ended' && item.entries_count > 0 && (
          <View style={styles.winnerBanner}>
            <Ionicons name="trophy" size={20} color={colors.warning} />
            <Text style={styles.winnerBannerText}>
              Winner announced! Tap to view results
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.warning} />
          </View>
        )}
        
        {item.prize_description && (
          <View style={styles.prizeBox}>
            <Text style={styles.prizeText}>🏆 {item.prize_description}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBg : colors.bg}
      />
      <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.bg }]}>
        {/* Header */}
        <View style={[
          styles.headerContainer,
          { 
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: isDark ? colors.darkText : colors.text }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Challenges
          </Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* 필터 */}
      <View style={[
        styles.filterContainer,
        { 
          backgroundColor: isDark ? colors.darkCard : colors.card,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ended' && styles.filterButtonActive]}
          onPress={() => setFilter('ended')}
        >
          <Text style={[styles.filterText, filter === 'ended' && styles.filterTextActive]}>
            Ended
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'auctions' && styles.filterButtonActive]}
          onPress={() => setFilter('auctions')}
        >
          <Text style={[styles.filterText, filter === 'auctions' && styles.filterTextActive]}>
            Auctions
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Challenge 또는 Auction 목록 */}
      <FlatList
        data={filter === 'auctions' ? auctions : challenges}
        renderItem={filter === 'auctions' ? renderAuction : renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChallenges(true)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={filter === 'auctions' ? 'hammer-outline' : 'trophy-outline'}
              size={80} 
              color={isDark ? colors.darkTextMuted : colors.textMuted} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? colors.darkText : colors.text }]}>
              {filter === 'auctions' ? 'No Auctions Available' : 'No Challenges Available'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {filter === 'auctions' 
                ? 'New auctions will be announced soon!' 
                : 'New challenges will be starting soon!'}
            </Text>
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    // backgroundColor는 동적으로 설정됨
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    // color는 동적으로 설정됨
  },
  headerSpacer: {
    width: 40, // backButton과 동일한 너비로 중앙 정렬
  },
  
  // 필터
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    // backgroundColor와 borderBottomColor는 동적으로 설정됨
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: '#E91E63',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  
  // 목록
  list: {
    padding: 16,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E63',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueEnded: {
    color: '#999',
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.warning,
    gap: 8,
  },
  winnerBannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
  prizeBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  prizeText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // color는 동적으로 설정됨
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    // color는 동적으로 설정됨
  },
});

