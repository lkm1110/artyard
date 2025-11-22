/**
 * 신고 관리 화면
 * - 신고 목록 조회
 * - 신고 상세 확인
 * - 승인/기각 처리
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface Report {
  id: string;
  target_type: 'artwork' | 'user' | 'comment';
  target_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    handle: string;
  } | null;
  artwork?: {
    title: string;
    image_urls: string[];
  } | null;
}

export const ReportsManagementScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 1. 먼저 reports 가져오기
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(handle)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data: reportsData, error } = await query;

      if (error) throw error;

      // 2. artwork 정보가 필요한 reports의 artwork 정보 가져오기
      const reportsWithArtworks = await Promise.all(
        (reportsData || []).map(async (report) => {
          if (report.target_type === 'artwork') {
            const { data: artworkData } = await supabase
              .from('artworks')
              .select('title, images')
              .eq('id', report.target_id)
              .single();
            
            return {
              ...report,
              artwork: artworkData || null,
            };
          }
          return {
            ...report,
            artwork: null,
          };
        })
      );

      setReports(reportsWithArtworks);
    } catch (error: any) {
      console.error('신고 목록 로드 실패:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      setProcessing(true);

      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // 1. 신고 상태 업데이트
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: action,
          admin_notes: adminNotes || null,
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // 2. 승인된 경우 콘텐츠 삭제
      if (action === 'resolved' && report.target_type === 'artwork') {
        const { error: deleteError } = await supabase
          .from('artworks')
          .delete()
          .eq('id', report.target_id);

        if (deleteError) {
          console.error('작품 삭제 실패:', deleteError);
          Alert.alert('Warning', 'Report resolved but failed to delete artwork');
        }

        // 관리자 액션 로그 기록
        await supabase.from('admin_actions').insert({
          admin_id: user?.id,
          action_type: 'delete_artwork',
          target_type: 'artwork',
          target_id: report.target_id,
          reason: `Report resolved: ${report.reason}`,
          metadata: { report_id: reportId },
        });
      }

      Alert.alert(
        'Success',
        action === 'resolved' 
          ? 'Report approved and content deleted' 
          : 'Report dismissed'
      );

      setModalVisible(false);
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error: any) {
      console.error('신고 처리 실패:', error);
      Alert.alert('Error', error.message || 'Failed to process report');
    } finally {
      setProcessing(false);
    }
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes('');
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'reviewing':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      case 'dismissed':
        return '#6B7280';
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'reviewing':
        return 'Reviewing';
      case 'resolved':
        return 'Resolved';
      case 'dismissed':
        return 'Dismissed';
      default:
        return status;
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[
        styles.reportCard,
        { backgroundColor: isDark ? colors.darkCard : colors.card },
      ]}
      onPress={() => openReportDetail(item)}
    >
      <View style={styles.reportHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={[styles.reportDate, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.reportReason, { color: isDark ? colors.darkText : colors.text }]}>
        📍 {item.reason}
      </Text>

      {item.description && (
        <Text
          style={[styles.reportDescription, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}

      <View style={styles.reportFooter}>
        <Text style={[styles.reportMeta, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          Reporter: {item.reporter?.handle || 'Unknown'}
        </Text>
        {item.target_type === 'artwork' && item.artwork && (
          <Text style={[styles.reportMeta, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            Target: {item.artwork.title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
            Reports Management
          </Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* 필터 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pending' && styles.filterButtonActive,
            { backgroundColor: filter === 'pending' ? colors.primary : (isDark ? colors.darkCard : colors.card) },
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === 'pending' ? colors.white : (isDark ? colors.darkText : colors.text) },
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
            { backgroundColor: filter === 'all' ? colors.primary : (isDark ? colors.darkCard : colors.card) },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === 'all' ? colors.white : (isDark ? colors.darkText : colors.text) },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            No reports found
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReports(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* 상세 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.darkText : colors.text }]}>
              Report Details
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedReport && (
            <View style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
                <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Status
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>
                    {getStatusLabel(selectedReport.status)}
                  </Text>
                </View>

                <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Reason
                </Text>
                <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                  {selectedReport.reason}
                </Text>

                {selectedReport.description && (
                  <>
                    <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                      Description
                    </Text>
                    <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                      {selectedReport.description}
                    </Text>
                  </>
                )}

                <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Reporter
                </Text>
                <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                  {selectedReport.reporter?.handle || 'Unknown'}
                </Text>

                <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  Date
                </Text>
                <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                  {new Date(selectedReport.created_at).toLocaleString()}
                </Text>
              </View>

              {/* 관리자 메모 */}
              <Text style={[styles.inputLabel, { color: isDark ? colors.darkText : colors.text }]}>
                Admin Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.darkText : colors.text,
                    borderColor: isDark ? colors.darkBorder : colors.border,
                  },
                ]}
                placeholder="Add notes about this decision..."
                placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* 액션 버튼 */}
              {selectedReport.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleReportAction(selectedReport.id, 'dismissed')}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.actionButtonText}>Dismiss</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Alert.alert(
                        'Confirm Approval',
                        'This will delete the reported content. Are you sure?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Approve',
                            style: 'destructive',
                            onPress: () => handleReportAction(selectedReport.id, 'resolved'),
                          },
                        ]
                      );
                    }}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.actionButtonText}>Approve & Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
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
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterButtonActive: {},
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    padding: spacing.lg,
  },
  reportCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  reportDate: {
    fontSize: 12,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reportFooter: {
    marginTop: spacing.sm,
  },
  reportMeta: {
    fontSize: 12,
    marginBottom: spacing.xs,
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
  modalContent: {
    flex: 1,
  },
  detailCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  approveButton: {},
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

