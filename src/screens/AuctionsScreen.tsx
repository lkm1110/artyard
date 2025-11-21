/**
 * Auctions Screen
 * 분기별 우승작 경매 목록
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface Auction {
  id: string;
  title: string;
  description: string;
  quarter: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended' | 'completed';
  artworks_count: number;
  total_bids: number;
  total_revenue: number;
}

interface AuctionItem {
  id: string;
  artwork: any;
  artist: any;
  starting_price: number;
  current_price: number;
  buyout_price?: number;
  highest_bidder_id?: string;
  bids_count: number;
  is_sold: boolean;
  sold_price?: number;
}

export const AuctionsScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadAuctions();
  }, []);
  
  const loadAuctions = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('challenge_auctions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAuctions(true)}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
          Challenge Winner Auctions
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          Bid on quarterly challenge winning artworks
        </Text>
      </View>
      
      {/* Auctions List */}
      {auctions.map((auction) => (
        <TouchableOpacity
          key={auction.id}
          style={[styles.auctionCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}
          onPress={() => navigation.navigate('AuctionDetail' as never, { auctionId: auction.id } as never)}
          activeOpacity={0.7}
        >
          <View style={styles.auctionHeader}>
            <View style={styles.auctionInfo}>
              <Text style={[styles.auctionTitle, { color: isDark ? colors.darkText : colors.text }]}>
                {auction.title}
              </Text>
              <Text style={[styles.auctionQuarter, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {auction.quarter}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(auction.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(auction.status) }]}>
                {getStatusLabel(auction.status)}
              </Text>
            </View>
          </View>
          
          {auction.description && (
            <Text style={[styles.auctionDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {auction.description}
            </Text>
          )}
          
          <View style={styles.auctionStats}>
            <View style={styles.stat}>
              <Ionicons name="images-outline" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
              <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {auction.artworks_count} artworks
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color={isDark ? colors.darkTextMuted : colors.textMuted} />
              <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {auction.total_bids} bids
              </Text>
            </View>
            {auction.total_revenue > 0 && (
              <View style={styles.stat}>
                <Ionicons name="cash-outline" size={16} color={colors.success} />
                <Text style={[styles.statText, { color: colors.success }]}>
                  ${auction.total_revenue.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          
          {auction.status === 'active' && (
            <View style={[styles.timeRemaining, { backgroundColor: `${colors.warning}20` }]}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={[styles.timeText, { color: colors.warning }]}>
                {getTimeRemaining(auction.end_date)}
              </Text>
            </View>
          )}
          
          <View style={styles.viewButton}>
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>
              View Auction
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ))}
      
      {auctions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="pricetag-outline" size={64} color={isDark ? colors.darkTextMuted : colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: isDark ? colors.darkText : colors.text }]}>
            No Auctions Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Quarterly challenge winner auctions will appear here
          </Text>
        </View>
      )}
    </ScrollView>
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
  },
  auctionCard: {
    margin: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  auctionInfo: {
    flex: 1,
  },
  auctionTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  auctionQuarter: {
    ...typography.caption,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  auctionDescription: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  auctionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});

