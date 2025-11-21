# 🏆 Challenge System 구현 가이드

## ✅ 완료된 작업

### 1. Database 스키마 ✅
- 파일: `database/UPDATE-CHALLENGE-SYSTEM.sql`
- 투표 시스템 (1인 1표)
- Top 10 자동 선정
- 우승자 발표 함수
- 경매 테이블 (미래 확장)

### 2. Admin 챌린지 생성 UI ✅
- 파일: `src/screens/admin/ChallengeManagementScreen.tsx`
- 챌린지 생성 (2주 기간, 1주 투표)
- 신규 작가 전용 티어
- 챌린지 종료 & 투표 시작
- 우승자 발표

---

## 🔨 추가 구현 필요 사항

### 3. 작품 업로드 시 챌린지 선택 UI

**파일: `src/screens/ArtworkUploadScreen.tsx`**

```typescript
// 1. 챌린지 목록 state 추가 (line ~100)
const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
const [showChallengePicker, setShowChallengePicker] = useState(false);

// 2. 챌린지 목록 로드 (useEffect에 추가)
useEffect(() => {
  loadActiveChallenges();
}, []);

const loadActiveChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .eq('tier_requirement', user?.trust_level || 'new') // 티어 매칭
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setActiveChallenges(data || []);
  } catch (error) {
    console.error('Failed to load challenges:', error);
  }
};

// 3. 챌린지 선택 UI 추가 (Material/Category 선택 아래)
<TouchableOpacity
  style={[styles.inputField, { borderColor: isDark ? colors.darkBorder : colors.border }]}
  onPress={() => setShowChallengePicker(true)}
>
  <Text style={[styles.inputLabel, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
    Challenge (Optional)
  </Text>
  <Text style={[styles.inputValue, { color: isDark ? colors.darkText : colors.text }]}>
    {formData.challengeId 
      ? activeChallenges.find(c => c.id === formData.challengeId)?.title 
      : 'Select Challenge'}
  </Text>
  <Ionicons name="chevron-down" size={20} color={isDark ? colors.darkTextMuted : colors.textMuted} />
</TouchableOpacity>

// 4. Challenge Picker Modal
<Modal
  visible={showChallengePicker}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowChallengePicker(false)}
>
  <View style={styles.pickerOverlay}>
    <View style={[styles.pickerContainer, { backgroundColor: isDark ? colors.darkCard : colors.white }]}>
      <View style={styles.pickerHeader}>
        <Text style={[styles.pickerTitle, { color: isDark ? colors.darkText : colors.text }]}>
          Select Challenge
        </Text>
        <TouchableOpacity onPress={() => setShowChallengePicker(false)}>
          <Ionicons name="close" size={24} color={isDark ? colors.darkText : colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.pickerScroll}>
        {/* None 옵션 */}
        <TouchableOpacity
          style={[styles.challengeItem, !formData.challengeId && styles.challengeItemSelected]}
          onPress={() => {
            setFormData({ ...formData, challengeId: undefined });
            setShowChallengePicker(false);
          }}
        >
          <Text style={[styles.challengeItemText, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
            No Challenge
          </Text>
        </TouchableOpacity>
        
        {/* 챌린지 목록 */}
        {activeChallenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[
              styles.challengeItem,
              formData.challengeId === challenge.id && styles.challengeItemSelected
            ]}
            onPress={() => {
              setFormData({ ...formData, challengeId: challenge.id });
              setShowChallengePicker(false);
            }}
          >
            <View style={styles.challengeItemContent}>
              <Text style={[styles.challengeItemTitle, { color: isDark ? colors.darkText : colors.text }]}>
                {challenge.title}
              </Text>
              <Text style={[styles.challengeItemTopic, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
                {challenge.topic}
              </Text>
              {challenge.prize_description && (
                <Text style={[styles.challengeItemPrize, { color: colors.primary }]}>
                  Prize: {challenge.prize_description}
                </Text>
              )}
            </View>
            {formData.challengeId === challenge.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>

// 5. 업로드 시 challenge_entries 자동 생성
// handleUpload 함수에서 작품 업로드 성공 후:
if (formData.challengeId && uploadedArtworkId) {
  try {
    await supabase
      .from('challenge_entries')
      .insert({
        challenge_id: formData.challengeId,
        artwork_id: uploadedArtworkId,
        author_id: user.id,
      });
  } catch (error) {
    console.error('Failed to add challenge entry:', error);
    // 챌린지 참가 실패는 무시 (작품 업로드는 성공)
  }
}
```

**스타일 추가:**
```typescript
challengeItem: {
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
challengeItemSelected: {
  backgroundColor: `${colors.primary}10`,
},
challengeItemContent: {
  flex: 1,
},
challengeItemTitle: {
  ...typography.body,
  fontWeight: '600',
  marginBottom: spacing.xs,
},
challengeItemTopic: {
  ...typography.caption,
  marginBottom: spacing.xs,
},
challengeItemPrize: {
  ...typography.caption,
  fontWeight: '600',
},
```

---

### 4. 챌린지 상세 페이지 (Top 10, 리더보드)

**파일: `src/screens/ChallengeDetailScreen.tsx` (새 파일 생성)**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { ArtworkCard } from '../components/ArtworkCard';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export const ChallengeDetailScreen = () => {
  const route = useRoute();
  const { challengeId } = route.params as { challengeId: string };
  const { user } = useAuthStore();
  const isDark = useColorScheme() === 'dark';
  
  const [challenge, setChallenge] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  
  useEffect(() => {
    loadChallengeData();
  }, [challengeId]);
  
  const loadChallengeData = async () => {
    try {
      setLoading(true);
      
      // 1. 챌린지 정보
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
      
      if (challengeError) throw challengeError;
      setChallenge(challengeData);
      
      // 2. 참가 작품 (Top 10 우선, 나머지는 투표수 순)
      const { data: entriesData, error: entriesError } = await supabase
        .from('challenge_entries')
        .select(`
          *,
          artwork:artworks(*),
          author:profiles(*)
        `)
        .eq('challenge_id', challengeId)
        .order('is_top_10', { ascending: false })
        .order('votes_count', { ascending: false });
      
      if (entriesError) throw entriesError;
      setEntries(entriesData || []);
      
      // 3. 내 투표 확인
      if (user) {
        const { data: voteData } = await supabase
          .from('challenge_votes')
          .select('entry_id')
          .eq('challenge_id', challengeId)
          .eq('voter_id', user.id)
          .single();
        
        if (voteData) setMyVote(voteData.entry_id);
      }
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVote = async (entryId: string) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }
    
    if (challenge?.status !== 'voting') {
      alert('Voting is not open yet');
      return;
    }
    
    try {
      setVoting(true);
      
      // 이전 투표 취소
      if (myVote) {
        await supabase
          .from('challenge_votes')
          .delete()
          .eq('challenge_id', challengeId)
          .eq('voter_id', user.id);
      }
      
      // 새 투표
      if (myVote !== entryId) {
        const { error } = await supabase
          .from('challenge_votes')
          .insert({
            challenge_id: challengeId,
            entry_id: entryId,
            voter_id: user.id,
          });
        
        if (error) throw error;
        setMyVote(entryId);
      } else {
        // 같은 작품 투표 = 투표 취소
        setMyVote(null);
      }
      
      // 새로고침
      loadChallengeData();
    } catch (error: any) {
      console.error('Vote failed:', error);
      alert(error.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? colors.darkBackground : colors.background }]}>
      {/* Challenge Header */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.text }]}>
          {challenge?.title}
        </Text>
        <Text style={[styles.topic, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {challenge?.topic}
        </Text>
        <Text style={[styles.description, { color: isDark ? colors.darkTextMuted : colors.textMuted }]}>
          {challenge?.description}
        </Text>
        
        {challenge?.prize_description && (
          <View style={[styles.prizeBox, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="trophy" size={20} color={colors.primary} />
            <Text style={[styles.prizeText, { color: colors.primary }]}>
              {challenge.prize_description}
            </Text>
          </View>
        )}
        
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
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(challenge?.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(challenge?.status)}</Text>
        </View>
      </View>
      
      {/* Top 10 Section */}
      {entries.some(e => e.is_top_10) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
            Top 10
          </Text>
          {entries
            .filter(e => e.is_top_10)
            .map((entry, index) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{entry.final_rank}</Text>
                </View>
                
                <ArtworkCard
                  artwork={entry.artwork}
                  onPress={() => {/* Navigate to artwork */}}
                />
                
                <View style={styles.entryFooter}>
                  <View style={styles.voteInfo}>
                    <Ionicons name="heart" size={16} color={colors.error} />
                    <Text style={[styles.voteCount, { color: isDark ? colors.darkText : colors.text }]}>
                      {entry.votes_count} votes
                    </Text>
                  </View>
                  
                  {challenge?.status === 'voting' && (
                    <TouchableOpacity
                      style={[
                        styles.voteButton,
                        myVote === entry.id && styles.voteButtonActive,
                        { backgroundColor: myVote === entry.id ? colors.primary : 'transparent', borderColor: colors.primary }
                      ]}
                      onPress={() => handleVote(entry.id)}
                      disabled={voting}
                    >
                      <Text style={[styles.voteButtonText, { color: myVote === entry.id ? colors.white : colors.primary }]}>
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
            ))}
        </View>
      )}
      
      {/* All Entries */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.darkText : colors.text }]}>
          All Entries
        </Text>
        {entries
          .filter(e => !e.is_top_10)
          .map((entry) => (
            <View key={entry.id} style={[styles.entryCard, { backgroundColor: isDark ? colors.darkCard : colors.card }]}>
              <ArtworkCard
                artwork={entry.artwork}
                onPress={() => {/* Navigate to artwork */}}
              />
              
              <View style={styles.entryFooter}>
                <View style={styles.voteInfo}>
                  <Ionicons name="heart" size={16} color={colors.error} />
                  <Text style={[styles.voteCount, { color: isDark ? colors.darkText : colors.text }]}>
                    {entry.votes_count} votes
                  </Text>
                </View>
                
                {challenge?.status === 'voting' && (
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      myVote === entry.id && styles.voteButtonActive,
                      { backgroundColor: myVote === entry.id ? colors.primary : 'transparent', borderColor: colors.primary }
                    ]}
                    onPress={() => handleVote(entry.id)}
                    disabled={voting}
                  >
                    <Text style={[styles.voteButtonText, { color: myVote === entry.id ? colors.white : colors.primary }]}>
                      {myVote === entry.id ? 'Voted' : 'Vote'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
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
    case 'active': return 'Active - Submit your work!';
    case 'voting': return 'Voting Open';
    case 'ended': return 'Ended';
    default: return 'Upcoming';
  }
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
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  topic: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  prizeText: {
    ...typography.body,
    fontWeight: '600',
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
    ...typography.h2,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  entryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  rankText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
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
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  winnerText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
});
```

---

## 🎉 분기별 경매 시스템 (미래 확장)

### Database 테이블 (이미 생성됨)
- `challenge_auctions`: 분기별 경매
- `auction_items`: 경매 아이템

### 구현 아이디어
1. **분기 종료 시 자동 경매 생성**
   - 각 분기 우승작 자동 선정
   - 경매 페이지 자동 생성
   - 이메일 알림

2. **경매 UI**
   - 분기별 경매 목록
   - 실시간 입찰
   - 최고가 입찰자 표시

3. **수익 구조**
   - 경매 수수료: 10-15%
   - 작가 수익: 85-90%
   - 브랜드 가치 상승

---

## 🚀 배포 순서

1. **Database 스키마 적용**
   ```bash
   Supabase SQL Editor에서 실행:
   database/UPDATE-CHALLENGE-SYSTEM.sql
   ```

2. **Navigation 업데이트**
   - ChallengeDetailScreen을 네비게이터에 추가
   - ChallengeManagementScreen을 Admin 네비게이터에 추가

3. **테스트**
   - Admin으로 챌린지 생성
   - 작품 업로드 시 챌린지 선택
   - 투표 테스트
   - 우승자 발표 테스트

4. **프로덕션 배포**
   - iOS/Android 빌드
   - App Store/Play Store 업데이트

---

## 💡 향후 개선 사항

1. **알림 시스템**
   - 챌린지 시작 알림
   - 투표 시작 알림
   - 우승자 발표 알림

2. **소셜 공유**
   - 챌린지 참가 공유
   - 우승 공유
   - SNS 통합

3. **AI 심사**
   - 부적절한 작품 자동 필터링
   - 스팸 투표 감지
   - 품질 스코어링

4. **경매 시스템**
   - 실시간 경매
   - 자동 입찰
   - 결제 통합

---

## 📝 마케팅 활용

1. **첫 챌린지 이벤트**
   - "Launch Challenge"
   - 상금: $500
   - SNS 홍보
   - 인플루언서 협업

2. **월별 테마 챌린지**
   - 계절, 이벤트에 맞춘 주제
   - 꾸준한 참여 유도

3. **스폰서 챌린지**
   - 기업 협찬
   - 고액 상금
   - 브랜드 노출

---

완성! 🎉

