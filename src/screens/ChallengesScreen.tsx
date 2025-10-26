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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getActiveChallenges, getChallenges } from '../services/challengeService';
import { Challenge, getChallengeStatusLabel } from '../types/complete-system';

export const ChallengesScreen = () => {
  const navigation = useNavigation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'ended' | 'all'>('active');
  
  useEffect(() => {
    loadChallenges();
  }, [filter]);
  
  const loadChallenges = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === 'active') {
        data = await getActiveChallenges();
      } else if (filter === 'ended') {
        data = await getChallenges('ended');
      } else {
        data = await getChallenges();
      }
      setChallenges(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDaysRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '종료';
    if (diffDays === 0) return '오늘 마감';
    return `${diffDays}일 남음`;
  };
  
  const renderChallenge = ({ item }: { item: Challenge }) => {
    const daysRemaining = getDaysRemaining(item.end_date);
    const isActive = item.status === 'active';
    
    return (
      <TouchableOpacity
        style={styles.challengeCard}
        onPress={() => navigation.navigate('ChallengeDetail', { id: item.id })}
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
        
        <View style={styles.challengeStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>참여자</Text>
            <Text style={styles.statValue}>{item.participants_count}명</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>작품</Text>
            <Text style={styles.statValue}>{item.entries_count}개</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>기간</Text>
            <Text style={[
              styles.statValue,
              !isActive && styles.statValueEnded,
            ]}>
              {daysRemaining}
            </Text>
          </View>
        </View>
        
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* 필터 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            진행 중
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ended' && styles.filterButtonActive]}
          onPress={() => setFilter('ended')}
        >
          <Text style={[styles.filterText, filter === 'ended' && styles.filterTextActive]}>
            종료됨
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Challenge 목록 */}
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏆</Text>
            <Text style={styles.emptyTitle}>Challenge가 없습니다</Text>
            <Text style={styles.emptySubtitle}>
              곧 새로운 Challenge가 시작됩니다!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 필터
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
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
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
});

