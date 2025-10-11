/**
 * 작품 상세보기 화면 - 실제 데이터만 사용
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  Modal,
} from 'react-native';
import AIOrchestrationService from '../services/ai/aiOrchestrationService';
import { useColorScheme } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useToggleArtworkLike, useToggleArtworkBookmark, useArtworkDetail, useDeleteArtwork } from '../hooks/useArtworks';
import { useCreateOrFindChat } from '../hooks/useChats';
import { useArtworkComments, useCreateComment, useDeleteComment, useUpdateComment } from '../hooks/useComments';
import { Comment } from '../types';
import { useAuthStore } from '../store/authStore';
import { FollowButton } from '../components/FollowButton';

const { width: screenWidth } = Dimensions.get('window');
const imageHeight = screenWidth * 0.8;

export const ArtworkDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ ArtworkDetail: { artworkId: string } }>>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const { artworkId } = route.params;

  // 실제 API 훅들만 사용
  const { data: artwork, isLoading: artworkLoading, isError: artworkError } = useArtworkDetail(artworkId, user?.id);
  const { data: comments = [], isLoading: commentsLoading, isError: commentsError } = useArtworkComments(artworkId);
  const toggleLike = useToggleArtworkLike();
  const toggleBookmark = useToggleArtworkBookmark();
  const deleteArtworkMutation = useDeleteArtwork();
  const createOrFindChatMutation = useCreateOrFindChat();
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const updateCommentMutation = useUpdateComment();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // 좋아요 핸들러
  const handleLike = useCallback(async () => {
    console.log('🩷 Detail screen: Like button clicked');
    console.log('👤 Current user:', user?.id);
    console.log('🖼️ Current artwork:', artwork?.id);
    
    if (!artwork || !user) {
      console.error('❌ Detail screen: Missing artwork or user');
      return;
    }
    
    try {
      console.log('⏳ Detail screen: Calling toggleLike API...');
      await toggleLike.mutateAsync(artwork.id);
      console.log('✅ Detail screen: Like toggle successful');
    } catch (error) {
      console.error('💥 Detail screen: Like API failed:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  }, [artwork, user, toggleLike]);

  // 북마크 핸들러
  const handleBookmark = useCallback(async () => {
    console.log('⭐ Detail screen: Bookmark button clicked');
    console.log('👤 Current user:', user?.id);
    console.log('🖼️ Current artwork:', artwork?.id);
    
    if (!artwork || !user) {
      console.error('❌ Detail screen: Missing artwork or user');
      return;
    }
    
    try {
      console.log('⏳ Detail screen: Calling toggleBookmark API...');
      await toggleBookmark.mutateAsync(artwork.id);
      console.log('✅ Detail screen: Bookmark toggle successful');
    } catch (error) {
      console.error('💥 Detail screen: Bookmark API failed:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  }, [artwork, user, toggleBookmark]);

  // 댓글 작성 핸들러
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || !user || createCommentMutation.isPending) return;

    try {
      await createCommentMutation.mutateAsync({
        artworkId,
        content: newComment.trim(),
      });
      
      setNewComment('');
      console.log('댓글 작성 완료');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  }, [newComment, user, artworkId, createCommentMutation]);

  // 댓글 수정 시작 핸들러
  const handleEditComment = useCallback((comment: Comment) => {
    console.log('✏️ 댓글 인라인 수정 시작:', comment.id);
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  }, []);

  // 댓글 수정 저장 핸들러
  const handleSaveEditComment = useCallback(async () => {
    if (!editingCommentId || !editCommentText.trim() || updateCommentMutation.isPending) return;

    console.log('💾 댓글 수정 저장:', { commentId: editingCommentId, newContent: editCommentText });

    try {
      await updateCommentMutation.mutateAsync({
        commentId: editingCommentId,
        content: editCommentText.trim(),
      });
      
      setEditingCommentId(null);
      setEditCommentText('');
      console.log('✅ 댓글 수정 완료');
    } catch (error) {
      console.error('💥 댓글 수정 실패:', error);
      Alert.alert('Error', 'Failed to update comment. Please try again.');
    }
  }, [editingCommentId, editCommentText, updateCommentMutation]);

  // 댓글 수정 취소 핸들러
  const handleCancelEditComment = useCallback(() => {
    console.log('❌ 댓글 수정 취소');
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  // 공유 핸들러
  const handleShare = useCallback(async () => {
    if (!artwork) return;

    try {
      console.log('📤 공유 시작:', artwork.title);
      
      // 공유할 메시지 구성
      const shareMessage = `Check out this amazing artwork on ArtYard!\n\n"${artwork.title}" by @${artwork.author?.handle || 'artist'}\n\n${artwork.description ? artwork.description + '\n\n' : ''}Join the college art community: https://artyard.app`;
      
      const shareOptions = {
        message: shareMessage,
        title: `${artwork.title} - ArtYard`,
      };

      // 웹에서는 Web Share API 사용 (지원되는 경우)
      if (Platform.OS === 'web') {
        if (navigator.share && navigator.canShare && navigator.canShare(shareOptions)) {
          console.log('🌐 Web Share API 사용');
          await navigator.share(shareOptions);
          
          // AI 시스템에 사용자 행동 알림
          try {
            await AIOrchestrationService.handleUserAction(
              user?.id || 'anonymous',
              'share',
              artwork.id,
              { 
                artworkTitle: artwork.title,
                shareMethod: 'web_share_api',
                timestamp: new Date().toISOString()
              },
              'share_interaction'
            );
          } catch (error) {
            console.warn('AI 시스템 연동 실패:', error);
          }
        } else {
          console.log('📋 클립보드 복사로 대체');
          // Web Share API를 지원하지 않으면 클립보드에 복사
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareMessage);
            
            // AI 시스템에 사용자 행동 알림
            try {
              await AIOrchestrationService.handleUserAction(
                user?.id || 'anonymous',
                'share',
                artwork.id,
                { 
                  artworkTitle: artwork.title,
                  shareMethod: 'clipboard',
                  timestamp: new Date().toISOString()
                },
                'share_interaction'
              );
            } catch (error) {
              console.warn('AI 시스템 연동 실패:', error);
            }
            
            Alert.alert(
              'Link copied!',
              'The artwork link has been copied to your clipboard. You can now paste it to share with others.',
              [{ text: 'OK' }]
            );
          } else {
            // 클립보드도 지원하지 않으면 텍스트 선택할 수 있는 Alert
            Alert.alert(
              'Share Artwork',
              shareMessage,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK' }
              ]
            );
          }
        }
      } else {
        // 모바일에서는 React Native Share API 사용
        console.log('📱 React Native Share API 사용');
        const result = await Share.share(shareOptions);
        
        if (result.action === Share.sharedAction) {
          console.log('✅ 공유 완료');
          
          // AI 시스템에 사용자 행동 알림
          try {
            await AIOrchestrationService.handleUserAction(
              user?.id || 'anonymous',
              'share',
              artwork.id,
              { 
                artworkTitle: artwork.title,
                shareMethod: 'native_share',
                timestamp: new Date().toISOString()
              },
              'share_interaction'
            );
          } catch (error) {
            console.warn('AI 시스템 연동 실패:', error);
          }
        } else if (result.action === Share.dismissedAction) {
          console.log('❌ 공유 취소됨');
        }
      }
    } catch (error) {
      console.error('💥 공유 실패:', error);
      Alert.alert(
        'Share Failed', 
        'Unable to share this artwork. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [artwork]);

  // 작품 삭제 핸들러
  const handleDeleteArtwork = useCallback(async () => {
    console.log('🗑️ 작품 삭제 버튼 클릭됨');
    console.log('📊 현재 상태:', {
      artwork: !!artwork,
      user: !!user,
      artworkId: artwork?.id,
      userId: user?.id,
      authorId: artwork?.author_id,
      isOwner: artwork && user && artwork.author_id === user.id
    });

    if (!artwork || !user || artwork.author_id !== user.id) {
      console.log('❌ 권한 없음 - 삭제 불가');
      if (Platform.OS === 'web') {
        window.alert('You can only delete your own artworks.');
      } else {
        Alert.alert('Error', 'You can only delete your own artworks.');
      }
      return;
    }

    console.log('✅ 권한 확인 완료 - 삭제 다이얼로그 표시');

    // 웹과 모바일 호환 확인 다이얼로그
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm(`Are you sure you want to delete "${artwork.title}"? This action cannot be undone.`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            '🗑️ 작품 삭제',
            `"${artwork.title}" 작품을 정말 삭제하시겠어요?\n\n⚠️ 삭제된 작품은 복구할 수 없습니다.`,
            [
              { 
                text: '취소', 
                style: 'cancel',
                onPress: () => {
                  console.log('❌ 사용자가 삭제 취소');
                  resolve(false);
                }
              },
              {
                text: '🗑️ 삭제하기',
                style: 'destructive',
                onPress: () => {
                  console.log('🔥 사용자가 삭제 확인');
                  resolve(true);
                },
              },
            ]
          );
        });

    if (!confirmDelete) {
      console.log('❌ 삭제 취소됨');
      return;
    }

    console.log('🔥 삭제 확인됨 - API 호출 시작');
    try {
      console.log('⏳ deleteArtworkMutation.mutateAsync 호출 중...');
      await deleteArtworkMutation.mutateAsync(artwork.id);
      console.log('✅ 작품 삭제 API 성공');
      
      const showSuccess = Platform.OS === 'web'
        ? () => {
            window.alert('Your artwork has been deleted successfully.');
            navigation.goBack();
          }
        : () => {
            Alert.alert(
              'Deleted',
              'Your artwork has been deleted successfully.',
              [{ 
                text: 'OK', 
                onPress: () => {
                  console.log('📱 이전 화면으로 이동');
                  navigation.goBack();
                }
              }]
            );
          };
      
      showSuccess();
    } catch (error) {
      console.error('💥 작품 삭제 API 실패:', error);
      console.error('💥 오류 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      const errorMessage = `Failed to delete artwork: ${error.message}`;
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  }, [artwork, user, deleteArtworkMutation, navigation]);

  // 작품 수정 핸들러
  const handleEditArtwork = useCallback(() => {
    if (!artwork || !user || artwork.author_id !== user.id) return;
    
    console.log('✏️ 작품 수정 화면으로 이동:', artwork.id);
    navigation.navigate('ArtworkEdit', { artwork });
  }, [artwork, user, navigation]);

  // 작가에게 연락하기
  const handleContactArtist = useCallback(async () => {
    if (!artwork || !user) return;

    console.log('🔥 Contact Artist 버튼이 클릭됨!');
    console.log('artwork:', artwork.title);
    console.log('user:', user.handle);

    if (artwork.author_id === user.id) {
      Alert.alert('Info', 'This is your own artwork!');
      return;
    }

    const confirmed = Platform.OS === 'web' 
      ? window.confirm('Would you like to start a chat with this artist?')
      : await new Promise(resolve => {
          Alert.alert(
            '💬 아티스트와 채팅하기',
            `${artwork.artist?.nickname || '이 아티스트'}님과 대화를 시작하시겠어요?\n\n작품에 대해 더 자세히 알아보거나 구매 문의를 할 수 있습니다.`,
            [
              { 
                text: '💬 채팅 시작', 
                onPress: () => resolve(true) 
              },
              { 
                text: '취소', 
                style: 'cancel', 
                onPress: () => resolve(false) 
              },
            ]
          );
        });

    if (confirmed) {
      try {
        const chatId = await createOrFindChatMutation.mutateAsync({
          otherUserId: artwork.author_id,
        });
        
        console.log('채팅방 준비 완료:', chatId);
        console.log('채팅 시작:', user.handle, '→', artwork.author.handle);
        
        navigation.navigate('Chat' as never, { chatId } as never);
      } catch (error) {
        console.error('채팅방 생성/찾기 실패:', error);
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    }
  }, [artwork, user, navigation, createOrFindChatMutation]);

  // 로딩 상태 처리
  if (artworkLoading || commentsLoading) {
    return (
      <Screen style={styles.container}>
        <LoadingSpinner message="Loading artwork..." />
      </Screen>
    );
  }

  // 에러 상태 처리
  if (artworkError || commentsError || !artwork) {
    return (
      <Screen>
        <EmptyState
          title="Artwork not found"
          description="The artwork you're looking for doesn't exist or has been removed."
        />
      </Screen>
    );
  }

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item }}
        style={styles.artworkImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, { borderBottomColor: isDark ? colors.darkCard : colors.card }]}>
      <Image
        source={{ uri: item.author.avatar_url || 'https://picsum.photos/40/40?random=30' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: isDark ? colors.darkText : colors.text }]}>
            {item.author.handle}
            {item.author.is_verified_school && (
              <Text style={styles.verifiedIcon}> ✓</Text>
            )}
          </Text>
          <View style={styles.commentHeaderRight}>
            <Text style={[styles.commentTime, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            
            {/* 댓글 작성자만 볼 수 있는 수정/삭제 버튼 */}
            {user && item.author_id === user.id && (
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.commentActionButton}
                  onPress={() => {
                    console.log('✏️ 댓글 수정 버튼 클릭됨');
                    handleEditComment(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.commentActionIcon, { color: colors.primary }]}>
                    ✏️
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentActionButton}
                  onPress={() => {
                    console.log('🗑️ 댓글 삭제 버튼 클릭됨');
                    console.log('📊 댓글 정보:', {
                      commentId: item.id,
                      artworkId: artwork.id,
                      commentAuthorId: item.author_id,
                      currentUserId: user?.id,
                      isOwner: user && item.author_id === user.id
                    });

                    // 웹과 모바일 호환 확인 다이얼로그
                    const confirmDelete = Platform.OS === 'web'
                      ? window.confirm('Are you sure you want to delete this comment?')
                      : (() => {
                          Alert.alert(
                            '🗑️ 댓글 삭제',
                            '이 댓글을 정말 삭제하시겠어요?\n\n삭제된 댓글은 복구할 수 없습니다.',
                            [
                              { 
                                text: '취소', 
                                style: 'cancel',
                                onPress: () => console.log('❌ 댓글 삭제 취소')
                              },
                              {
                                text: '🗑️ 삭제하기',
                                style: 'destructive',
                                onPress: () => {
                                  console.log('🔥 댓글 삭제 확인 - API 호출 시작');
                                  try {
                                    deleteCommentMutation.mutate({
                                      commentId: item.id,
                                      artworkId: artwork.id,
                                    });
                                    console.log('✅ 댓글 삭제 mutation 호출 완료');
                                  } catch (error) {
                                    console.error('💥 댓글 삭제 mutation 실패:', error);
                                  }
                                },
                              },
                            ]
                          );
                          return false; // Alert는 비동기이므로 여기서는 false 반환
                        })();

                    // 웹에서는 즉시 처리
                    if (Platform.OS === 'web' && confirmDelete) {
                      console.log('🔥 웹에서 댓글 삭제 확인 - API 호출 시작');
                      try {
                        deleteCommentMutation.mutate({
                          commentId: item.id,
                          artworkId: artwork.id,
                        });
                        console.log('✅ 댓글 삭제 mutation 호출 완료');
                      } catch (error) {
                        console.error('💥 댓글 삭제 mutation 실패:', error);
                      }
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.commentActionIcon, { color: colors.danger }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* 댓글 내용 - 수정 중이면 TextInput, 아니면 Text */}
        {editingCommentId === item.id ? (
          <View style={styles.editCommentContainer}>
            <TextInput
              style={[
                styles.editCommentInput,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.background,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                  color: isDark ? colors.darkText : colors.text,
                }
              ]}
              value={editCommentText}
              onChangeText={setEditCommentText}
              placeholder="Edit your comment..."
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              multiline
              maxLength={500}
              autoFocus
            />
            <View style={styles.editCommentActions}>
              <TouchableOpacity
                style={[styles.editActionButton, styles.cancelEditButton]}
                onPress={handleCancelEditComment}
              >
                <Text style={[styles.editActionText, { color: isDark ? colors.darkText : colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editActionButton, styles.saveEditButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveEditComment}
                disabled={!editCommentText.trim() || updateCommentMutation.isPending}
              >
                <Text style={[styles.editActionText, { color: colors.white }]}>
                  {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.commentText, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
            {item.content}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Screen style={styles.container}>
      {/* 상단 네비게이션 바 */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
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
          Artwork Details
        </Text>
        
        {/* 작성자만 볼 수 있는 수정/삭제 버튼 */}
        {artwork && user && artwork.author_id === user.id ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleEditArtwork}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerActionIcon, { color: colors.primary }]}>
                ✏️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDeleteArtwork}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerActionIcon, { color: colors.danger }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 이미지 갤러리 */}
        <View style={styles.imageSection}>
          <FlatList
            data={artwork.images}
            renderItem={renderImage}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(newIndex);
            }}
            scrollEventThrottle={16}
          />
          
          {artwork.images && artwork.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {artwork.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: index === currentImageIndex
                        ? colors.primary
                        : (isDark ? colors.darkTextMuted : colors.textMuted)
                    }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 작품 정보 */}
        <View style={[styles.infoSection, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
              {artwork.title}
            </Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              ${artwork.price?.replace(/[^0-9.,]/g, '') || '0'}
            </Text>
          </View>

          <Text style={[styles.description, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
            {artwork.description}
            {(artwork.location_city || artwork.location_country) && (
              <Text style={{ color: colors.accent, fontWeight: '500' }}>
                {'\n📍 '}{artwork.location_city && artwork.location_country 
                  ? `${artwork.location_city}, ${artwork.location_country}`
                  : artwork.location_full || 'Unknown Location'
                }
              </Text>
            )}
          </Text>

          {/* 작품 상세 정보 */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Material
              </Text>
              <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                {artwork.material}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Size
              </Text>
              <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                {artwork.size}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Year
              </Text>
              <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                {artwork.year}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                Edition
              </Text>
              <Text style={[styles.detailValue, { color: isDark ? colors.darkText : colors.text }]}>
                {artwork.edition}
              </Text>
            </View>
          </View>
        </View>

        {/* 작가 정보 */}
        <View style={[styles.artistSection, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={styles.artistHeader}>
            <TouchableOpacity 
              style={styles.artistInfoContainer}
              onPress={() => navigation.navigate('UserArtworks', { 
                userId: artwork.author_id,
                userName: artwork.author.handle 
              })}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: artwork.author.avatar_url || 'https://picsum.photos/50/50?random=25' }}
                style={styles.artistAvatar}
              />
              <View style={styles.artistInfo}>
                <View style={styles.artistNameRow}>
                  <Text style={[styles.artistName, { color: isDark ? colors.darkText : colors.text }]}>
                    {artwork.author.handle}
                  </Text>
                  {artwork.author.is_verified_school && (
                    <Text style={styles.verifiedIcon}> ✓</Text>
                  )}
                </View>
                <Text style={[styles.artistSchool, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                  {artwork.author.school}
                </Text>
                <Text style={[styles.artistDepartment, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
                  {artwork.author.department}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* 팔로우 버튼 (자신의 작품이 아닌 경우에만 표시) */}
            {user && artwork.author_id !== user.id && (
              <FollowButton
                userId={artwork.author_id}
                size="medium"
                style={styles.followButton}
                onFollowChange={(isFollowing, stats) => {
                  console.log('팔로우 상태 변경:', isFollowing, stats);
                }}
              />
            )}
          </View>
          
          {artwork.author.bio && (
            <Text style={[styles.artistBio, { color: isDark ? colors.darkTextSecondary : colors.textSecondary }]}>
              {artwork.author.bio}
            </Text>
          )}

          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={handleContactArtist}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Artist</Text>
          </TouchableOpacity>
        </View>

        {/* 액션 버튼들 */}
        <View style={[styles.actionSection, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              {artwork.likes_count} likes • {artwork.comments_count} comments
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: artwork.is_liked ? '#FF0000' : (isDark ? colors.darkTextMuted : colors.textMuted) }
              ]}>
                {artwork.is_liked ? '❤️' : '🤍'}
              </Text>
              <Text style={[
                styles.actionLabel,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                {artwork.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: artwork.is_bookmarked ? '#FFD700' : (isDark ? colors.darkTextMuted : colors.textMuted) }
              ]}>
                {artwork.is_bookmarked ? '⭐' : '☆'}
              </Text>
              <Text style={[
                styles.actionLabel,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.actionIcon,
                { color: isDark ? colors.darkTextMuted : colors.textMuted }
              ]}>
                📤
              </Text>
              <Text style={[
                styles.actionLabel,
                { color: isDark ? colors.darkText : colors.text }
              ]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 댓글 섹션 */}
        <View style={[styles.commentsSection, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Comments ({comments.length})
          </Text>

          {comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.noComments, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
              No comments yet. Be the first to comment!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
      {user && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.commentInput, {
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderTopColor: isDark ? colors.darkBorder : colors.border
          }]}>
            <TextInput
              style={[
                styles.commentTextInput,
                {
                  backgroundColor: isDark ? colors.darkBackground : colors.background,
                  color: isDark ? colors.darkText : colors.text,
                  borderColor: isDark ? colors.darkBorder : colors.border,
                }
              ]}
              placeholder="Write a comment..."
              placeholderTextColor={isDark ? colors.darkTextMuted : colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: newComment.trim() ? colors.primary : (isDark ? colors.darkTextMuted : colors.textMuted),
                }
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              activeOpacity={0.8}
            >
              {createCommentMutation.isPending ? (
                <LoadingSpinner size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
  },
  headerRight: {
    width: 40, // 균형을 위한 빈 공간
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  headerActionIcon: {
    fontSize: 16,
  },
  imageSection: {
    position: 'relative',
  },
  imageContainer: {
    width: screenWidth,
    height: imageHeight,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.md,
  },
  price: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  description: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500',
  },
  artistSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  artistInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  artistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  artistInfo: {
    flex: 1,
  },
  followButton: {
    alignSelf: 'flex-start',
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    ...typography.h4,
    fontWeight: '600',
  },
  verifiedIcon: {
    color: colors.primary,
    fontSize: 16,
  },
  artistSchool: {
    ...typography.body,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  artistDepartment: {
    ...typography.caption,
    marginTop: spacing.xs / 2,
  },
  artistBio: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  contactButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  contactButtonText: {
    color: colors.white,
    ...typography.button,
    fontWeight: '600',
  },
  actionSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  statsRow: {
    marginBottom: spacing.md,
  },
  statText: {
    ...typography.caption,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonText: {
    ...typography.button,
    fontSize: 14,
  },
  commentsSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentActionButton: {
    padding: spacing.xs / 2,
    borderRadius: borderRadius.xs,
  },
  commentActionIcon: {
    fontSize: 12,
  },
  // 인라인 댓글 수정 스타일들
  editCommentContainer: {
    marginTop: spacing.xs,
  },
  editCommentInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    minHeight: 60,
    maxHeight: 120,
    ...typography.body,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editActionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  cancelEditButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  saveEditButton: {
    // backgroundColor는 JSX에서 설정
  },
  editActionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  commentAuthor: {
    ...typography.caption,
    fontWeight: '600',
  },
  commentTime: {
    ...typography.caption,
    fontSize: 11,
  },
  commentText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 18,
  },
  noComments: {
    ...typography.body,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.xl,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    ...typography.body,
  },
  submitButton: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.white,
    ...typography.button,
    fontSize: 14,
    fontWeight: '600',
  },
});