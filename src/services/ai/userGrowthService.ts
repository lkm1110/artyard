/**
 * 🎮 사용자 성장 & Gamification 시스템
 * 레벨, 뱃지, 도전과제, 평점 시스템을 통한 사용자 참여 증진
 */

import { supabase } from '../supabase';

export interface UserGrowthMetrics {
  userId: string;
  currentLevel: number;
  experiencePoints: number;
  pointsToNextLevel: number;
  levelProgress: number;
  artistRating: number;
  communityRating: number;
  overallRating: number;
  newBadges: string[];
  achievements: Achievement[];
  growthInsights: GrowthInsight[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'creation' | 'engagement' | 'community' | 'quality' | 'milestone';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  points: number;
  unlockedAt: Date;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
}

export interface GrowthInsight {
  type: 'strength' | 'improvement' | 'milestone' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface LevelDefinition {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  perks: string[];
  requirements?: {
    uploads?: number;
    likes?: number;
    followers?: number;
  };
}

/**
 * 🎯 경험치 계산 엔진
 */
class ExperienceEngine {
  private static readonly POINT_VALUES = {
    // 창작 활동
    upload_artwork: 50,
    artwork_featured: 200,
    artwork_trending: 100,
    
    // 참여 활동
    receive_like: 5,
    receive_comment: 10,
    receive_bookmark: 15,
    receive_share: 25,
    
    // 커뮤니티 활동
    give_like: 2,
    give_comment: 5,
    give_helpful_comment: 15,
    follow_artist: 3,
    get_followed: 10,
    
    // 품질 보너스
    high_quality_upload: 30, // 품질 점수 > 0.8
    original_content: 20,    // 독창성 점수 > 0.7
    
    // 마일스톤 보너스
    first_upload: 100,
    first_like: 25,
    first_comment: 50,
    first_follower: 75,
    
    // 연속 활동 보너스
    daily_streak_bonus: 10,  // 일일 연속 활동
    weekly_streak_bonus: 50, // 주간 연속 활동
    
    // 페널티
    content_removed: -100,
    spam_warning: -50,
    negative_feedback: -10
  };

  /**
   * 사용자 활동 기반 경험치 계산
   */
  static async calculateExperienceGain(
    userId: string,
    activity: keyof typeof ExperienceEngine.POINT_VALUES,
    metadata: any = {}
  ): Promise<number> {
    
    let basePoints = this.POINT_VALUES[activity] || 0;
    let multiplier = 1.0;

    // 품질 기반 보너스
    if (metadata.qualityScore && metadata.qualityScore > 0.8) {
      multiplier += 0.5;
    }

    // 참여도 기반 보너스 
    if (metadata.engagementRate && metadata.engagementRate > 0.3) {
      multiplier += 0.3;
    }

    // 연속 활동 보너스
    const streakBonus = await this.calculateStreakBonus(userId, activity);
    multiplier += streakBonus;

    // 신규 사용자 보너스 (첫 30일)
    const newUserBonus = await this.calculateNewUserBonus(userId);
    multiplier += newUserBonus;

    const finalPoints = Math.round(basePoints * multiplier);
    
    console.log(`💎 경험치 획득: ${activity} = ${finalPoints}점 (기본: ${basePoints}, 배수: ${multiplier.toFixed(2)})`);
    
    return finalPoints;
  }

  /**
   * 연속 활동 보너스 계산
   */
  private static async calculateStreakBonus(userId: string, activity: string): Promise<number> {
    // 최근 7일간의 활동 조회
    const { data: recentActivity } = await supabase
      .from('user_behaviors')
      .select('timestamp, behavior_type')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (!recentActivity || recentActivity.length === 0) return 0;

    // 일별 활동 분석
    const dailyActivity = new Map<string, boolean>();
    recentActivity.forEach(activity => {
      const day = new Date(activity.timestamp).toDateString();
      dailyActivity.set(day, true);
    });

    // 연속 일수 계산
    let streakDays = 0;
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDay = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = checkDay.toDateString();
      
      if (dailyActivity.has(dayKey)) {
        streakDays++;
      } else {
        break;
      }
    }

    // 연속 보너스 (최대 50%)
    return Math.min(0.5, streakDays * 0.1);
  }

  /**
   * 신규 사용자 보너스
   */
  private static async calculateNewUserBonus(userId: string): Promise<number> {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (!userProfile) return 0;

    const accountAge = (Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24);
    
    // 첫 30일간 50% 보너스, 점진적 감소
    if (accountAge <= 30) {
      return Math.max(0, 0.5 - (accountAge / 60)); // 30일에서 0%까지 선형 감소
    }
    
    return 0;
  }
}

/**
 * 🏆 뱃지 & 업적 시스템
 */
class AchievementEngine {
  private static readonly ACHIEVEMENTS: { [key: string]: Omit<Achievement, 'id' | 'unlockedAt'> } = {
    // 창작 관련 업적
    'first_steps': {
      name: '첫 걸음',
      description: '첫 작품을 업로드했습니다',
      category: 'creation',
      difficulty: 'bronze',
      points: 100
    },
    'prolific_creator': {
      name: '왕성한 창작자',
      description: '10개의 작품을 업로드했습니다',
      category: 'creation',
      difficulty: 'silver',
      points: 300
    },
    'art_master': {
      name: '예술 대가',
      description: '50개의 작품을 업로드했습니다',
      category: 'creation',
      difficulty: 'gold',
      points: 1000
    },
    
    // 품질 관련 업적
    'quality_creator': {
      name: '품질 창작자',
      description: '5개의 고품질 작품을 업로드했습니다',
      category: 'quality',
      difficulty: 'silver',
      points: 500
    },
    'perfectionist': {
      name: '완벽주의자',
      description: '평균 품질 점수 9.0 이상을 달성했습니다',
      category: 'quality',
      difficulty: 'platinum',
      points: 2000
    },
    
    // 인기 관련 업적
    'rising_star': {
      name: '떠오르는 스타',
      description: '작품이 100개의 좋아요를 받았습니다',
      category: 'engagement',
      difficulty: 'silver',
      points: 400
    },
    'viral_sensation': {
      name: '바이럴 센세이션',
      description: '작품이 1000개의 좋아요를 받았습니다',
      category: 'engagement',
      difficulty: 'gold',
      points: 1500
    },
    
    // 커뮤니티 관련 업적
    'supportive_member': {
      name: '든든한 멤버',
      description: '100개의 좋아요를 다른 작품에 주었습니다',
      category: 'community',
      difficulty: 'bronze',
      points: 200
    },
    'community_champion': {
      name: '커뮤니티 챔피언',
      description: '1000개의 댓글을 작성했습니다',
      category: 'community',
      difficulty: 'gold',
      points: 800
    },
    
    // 특별 업적
    'trendsetter': {
      name: '트렌드세터',
      description: '작품이 트렌딩에 올랐습니다',
      category: 'milestone',
      difficulty: 'gold',
      points: 1200
    },
    'legend': {
      name: '전설',
      description: '레벨 50에 도달했습니다',
      category: 'milestone',
      difficulty: 'legendary',
      points: 5000
    }
  };

  /**
   * 사용자 업적 확인 및 해제
   */
  static async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    
    // 현재 사용자 통계 조회
    const userStats = await this.getUserStats(userId);
    const existingBadges = await this.getExistingBadges(userId);
    
    // 각 업적 조건 확인
    for (const [achievementId, achievement] of Object.entries(this.ACHIEVEMENTS)) {
      if (existingBadges.includes(achievementId)) continue; // 이미 획득한 업적 스킵
      
      const unlocked = await this.checkAchievementCondition(achievementId, userStats);
      
      if (unlocked) {
        const newAchievement: Achievement = {
          id: achievementId,
          ...achievement,
          unlockedAt: new Date()
        };
        
        newAchievements.push(newAchievement);
        
        // 뱃지 추가
        await this.addBadgeToUser(userId, achievementId);
        
        // 경험치 보상
        await this.awardExperience(userId, achievement.points, `Achievement: ${achievement.name}`);
        
        console.log(`🏆 업적 해제: ${achievement.name} (${achievement.points}점)`);
      }
    }
    
    return newAchievements;
  }

  /**
   * 업적 조건 확인
   */
  private static async checkAchievementCondition(achievementId: string, userStats: any): Promise<boolean> {
    switch (achievementId) {
      case 'first_steps':
        return userStats.totalUploads >= 1;
        
      case 'prolific_creator':
        return userStats.totalUploads >= 10;
        
      case 'art_master':
        return userStats.totalUploads >= 50;
        
      case 'quality_creator':
        return userStats.highQualityUploads >= 5;
        
      case 'perfectionist':
        return userStats.averageQualityScore >= 0.9;
        
      case 'rising_star':
        return userStats.maxLikesOnSingleArtwork >= 100;
        
      case 'viral_sensation':
        return userStats.maxLikesOnSingleArtwork >= 1000;
        
      case 'supportive_member':
        return userStats.totalLikesGiven >= 100;
        
      case 'community_champion':
        return userStats.totalCommentsGiven >= 1000;
        
      case 'trendsetter':
        return userStats.trendingCount >= 1;
        
      case 'legend':
        return userStats.currentLevel >= 50;
        
      default:
        return false;
    }
  }

  /**
   * 사용자 통계 조회
   */
  private static async getUserStats(userId: string): Promise<any> {
    const [levelData, behaviorStats, artworkStats] = await Promise.all([
      supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single(),
        
      supabase
        .from('user_behaviors')
        .select('behavior_type')
        .eq('user_id', userId),
        
      supabase
        .from('artworks')
        .select('likes_count')
        .eq('author_id', userId)
    ]);

    const behaviorCounts = behaviorStats.data?.reduce((acc, behavior) => {
      acc[behavior.behavior_type] = (acc[behavior.behavior_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }) || {};

    const artworkLikes = artworkStats.data?.map(a => a.likes_count) || [];

    return {
      currentLevel: levelData.data?.current_level || 1,
      totalUploads: levelData.data?.total_uploads || 0,
      totalLikesReceived: levelData.data?.total_likes_received || 0,
      totalCommentsReceived: levelData.data?.total_comments_received || 0,
      totalFollowers: levelData.data?.total_followers || 0,
      totalLikesGiven: behaviorCounts.like || 0,
      totalCommentsGiven: behaviorCounts.comment || 0,
      maxLikesOnSingleArtwork: Math.max(...artworkLikes, 0),
      averageQualityScore: 0.7, // TODO: 실제 계산
      highQualityUploads: 0,    // TODO: 실제 계산
      trendingCount: 0          // TODO: 실제 계산
    };
  }

  private static async getExistingBadges(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('user_levels')
      .select('badges')
      .eq('user_id', userId)
      .single();
      
    return data?.badges || [];
  }

  private static async addBadgeToUser(userId: string, badgeId: string): Promise<void> {
    const existingBadges = await this.getExistingBadges(userId);
    const updatedBadges = [...existingBadges, badgeId];
    
    await supabase
      .from('user_levels')
      .update({ badges: updatedBadges })
      .eq('user_id', userId);
  }

  private static async awardExperience(userId: string, points: number, reason: string): Promise<void> {
    const { data: currentLevel } = await supabase
      .from('user_levels')
      .select('experience_points')
      .eq('user_id', userId)
      .single();

    const newXP = (currentLevel?.experience_points || 0) + points;
    
    await supabase
      .from('user_levels')
      .update({ experience_points: newXP })
      .eq('user_id', userId);

    console.log(`✨ 경험치 지급: ${points}점 (${reason})`);
  }
}

/**
 * 🎖️ 평점 시스템
 */
class RatingEngine {
  /**
   * 작가 평점 계산
   */
  static async calculateArtistRating(userId: string): Promise<number> {
    try {
      // 사용자의 작품 ID들을 먼저 조회
      const { data: userArtworks } = await supabase
        .from('artworks')
        .select('id')
        .eq('author_id', userId)
        .eq('is_hidden', false);

      if (!userArtworks || userArtworks.length === 0) {
        return 0.5; // 기본 평점
      }

      const artworkIds = userArtworks.map(artwork => artwork.id);

      // 작품 품질 평균 계산
      const { data: artworkQuality } = await supabase
        .from('artwork_analytics')
        .select('quality_score')
        .in('artwork_id', artworkIds);

      const avgQuality = artworkQuality?.length > 0 
        ? artworkQuality.reduce((sum, q) => sum + (q.quality_score || 0.5), 0) / artworkQuality.length 
        : 0.5;

      // 커뮤니티 피드백 (좋아요 비율)
      const { data: userStats } = await supabase
        .from('user_levels')
        .select('total_uploads, total_likes_received, total_comments_received')
        .eq('user_id', userId)
        .single();

      const likesPerUpload = userStats?.total_uploads > 0 
        ? userStats.total_likes_received / userStats.total_uploads 
        : 0;

      const commentsPerUpload = userStats?.total_uploads > 0
        ? userStats.total_comments_received / userStats.total_uploads
        : 0;

      // 일관성 (정기적 활동)
      const consistencyScore = await this.calculateConsistencyScore(userId);

      // 가중 평균으로 최종 평점 계산 (1-5 스케일)
      const rating = 1 + (
        avgQuality * 1.6 +           // 40% - 작품 품질
        (Math.min(likesPerUpload / 10, 1) * 1.2) + // 30% - 인기도 (10 좋아요 = 만점)
        (Math.min(commentsPerUpload / 5, 1) * 0.8) + // 20% - 참여도 (5 댓글 = 만점)
        consistencyScore * 0.4        // 10% - 일관성
      );

      return Math.min(5.0, Math.max(1.0, rating));

    } catch (error) {
      console.error('💥 작가 평점 계산 실패:', error);
      return 1.0; // 오류 시 기본값
    }
  }

  /**
   * 커뮤니티 평점 계산
   */
  static async calculateCommunityRating(userId: string): Promise<number> {
    // 도움이 되는 댓글/피드백 제공
    const helpfulnessScore = await this.calculateHelpfulnessScore(userId);
    
    // 다른 작가들과의 상호작용 빈도
    const interactionScore = await this.calculateInteractionScore(userId);
    
    // 신고 이력 (페널티)
    const moderationPenalty = await this.getModerationPenalty(userId);

    const rating = 1 + (
      helpfulnessScore * 2.0 +      // 50% - 도움 제공도
      interactionScore * 1.2 +      // 30% - 상호작용
      0.8                           // 20% - 기본 점수
    ) * (1 - moderationPenalty);    // 제재 페널티 적용

    return Math.min(5.0, Math.max(1.0, rating));
  }

  private static async calculateConsistencyScore(userId: string): Promise<number> {
    // 최근 12주간 주별 활동 분석
    const weeks = 12;
    const weeklyActivity = new Array(weeks).fill(0);
    
    const { data: recentActivity } = await supabase
      .from('user_behaviors')
      .select('timestamp, behavior_type')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString());

    recentActivity?.forEach(activity => {
      const weekIndex = Math.floor(
        (Date.now() - new Date(activity.timestamp).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weekIndex < weeks) {
        weeklyActivity[weekIndex]++;
      }
    });

    // 활동한 주의 비율로 일관성 측정
    const activeWeeks = weeklyActivity.filter(count => count > 0).length;
    return activeWeeks / weeks;
  }

  private static async calculateHelpfulnessScore(userId: string): Promise<number> {
    // TODO: 댓글의 품질이나 도움 정도를 측정하는 실제 로직
    // 현재는 댓글 수 기반 간단한 계산
    const { data: comments } = await supabase
      .from('user_behaviors')
      .select('behavior_data')
      .eq('user_id', userId)
      .eq('behavior_type', 'comment');

    const commentCount = comments?.length || 0;
    return Math.min(1.0, commentCount / 50); // 50개 댓글 = 만점
  }

  private static async calculateInteractionScore(userId: string): Promise<number> {
    // 다양한 작가들과의 상호작용
    const { data: interactions } = await supabase
      .from('user_behaviors')
      .select('artwork_id, artworks(author_id)')
      .eq('user_id', userId)
      .in('behavior_type', ['like', 'comment', 'bookmark']);

    if (!interactions) return 0;

    const uniqueArtists = new Set(
      interactions
        .filter(i => i.artworks?.author_id && i.artworks.author_id !== userId)
        .map(i => i.artworks?.author_id)
    );

    return Math.min(1.0, uniqueArtists.size / 25); // 25명과 상호작용 = 만점
  }

  private static async getModerationPenalty(userId: string): Promise<number> {
    const { data: moderationHistory } = await supabase
      .from('user_moderation')
      .select('action_type, severity_level')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!moderationHistory || moderationHistory.length === 0) return 0;

    // 제재 이력에 따른 페널티 계산 (0-0.5)
    const totalPenalty = moderationHistory.reduce((penalty, mod) => {
      return penalty + (mod.severity_level * 0.1);
    }, 0);

    return Math.min(0.5, totalPenalty);
  }
}

/**
 * 🎯 메인 사용자 성장 서비스
 */
export class UserGrowthService {
  private static readonly LEVEL_DEFINITIONS: LevelDefinition[] = [
    { level: 1, title: '신입 아티스트', minPoints: 0, maxPoints: 100, perks: ['기본 프로필'] },
    { level: 5, title: '취미 창작자', minPoints: 500, maxPoints: 1000, perks: ['프로필 꾸미기'] },
    { level: 10, title: '아마추어 작가', minPoints: 2000, maxPoints: 4000, perks: ['작품 부스트'] },
    { level: 20, title: '세미프로 아티스트', minPoints: 8000, maxPoints: 15000, perks: ['트렌딩 우선권'] },
    { level: 30, title: '프로 작가', minPoints: 25000, maxPoints: 40000, perks: ['검증 뱃지'] },
    { level: 50, title: '마스터 아티스트', minPoints: 75000, maxPoints: Infinity, perks: ['전용 갤러리'] }
  ];

  /**
   * 사용자 성장 현황 업데이트
   */
  static async updateUserProgress(userId: string, activity: string, metadata: any = {}): Promise<UserGrowthMetrics> {
    console.log('📈 사용자 성장 현황 업데이트:', { userId, activity });

    try {
      // 경험치 획득
      const experienceGain = await ExperienceEngine.calculateExperienceGain(
        userId, 
        activity as keyof typeof ExperienceEngine['POINT_VALUES'], 
        metadata
      );

      // 레벨 정보 업데이트
      await this.updateUserLevel(userId, experienceGain);

      // 업적 확인 및 해제
      const newAchievements = await AchievementEngine.checkAndUnlockAchievements(userId);

      // 평점 업데이트
      const [artistRating, communityRating] = await Promise.all([
        RatingEngine.calculateArtistRating(userId),
        RatingEngine.calculateCommunityRating(userId)
      ]);

      await this.updateUserRatings(userId, artistRating, communityRating);

      // 최종 성장 메트릭 생성
      const growthMetrics = await this.getGrowthMetrics(userId, newAchievements);

      console.log('✅ 사용자 성장 업데이트 완료:', {
        level: growthMetrics.currentLevel,
        xp: growthMetrics.experiencePoints,
        rating: growthMetrics.overallRating,
        newBadges: growthMetrics.newBadges.length
      });

      return growthMetrics;

    } catch (error) {
      console.error('💥 사용자 성장 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 레벨 업데이트
   */
  private static async updateUserLevel(userId: string, experienceGain: number): Promise<void> {
    const { data: currentLevel } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentLevel) {
      // 새 사용자 레벨 생성
      await supabase
        .from('user_levels')
        .insert({
          user_id: userId,
          current_level: 1,
          experience_points: experienceGain,
          points_to_next_level: 100,
          artist_rating: 1.0,
          community_rating: 1.0,
          overall_rating: 1.0
        });
      return;
    }

    const newXP = currentLevel.experience_points + experienceGain;
    let newLevel = currentLevel.current_level;
    let pointsToNext = currentLevel.points_to_next_level;

    // 레벨업 체크 및 처리는 데이터베이스 트리거에서 처리
    await supabase
      .from('user_levels')
      .update({ experience_points: newXP })
      .eq('user_id', userId);
  }

  /**
   * 평점 업데이트
   */
  private static async updateUserRatings(userId: string, artistRating: number, communityRating: number): Promise<void> {
    const overallRating = (artistRating + communityRating) / 2;

    await supabase
      .from('user_levels')
      .update({
        artist_rating: Math.round(artistRating * 10) / 10,
        community_rating: Math.round(communityRating * 10) / 10,
        overall_rating: Math.round(overallRating * 10) / 10
      })
      .eq('user_id', userId);
  }

  /**
   * 종합 성장 메트릭 생성
   */
  private static async getGrowthMetrics(userId: string, newAchievements: Achievement[]): Promise<UserGrowthMetrics> {
    const { data: userLevel } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userLevel) throw new Error('사용자 레벨 정보를 찾을 수 없습니다');

    // 레벨 진행률 계산
    const currentLevelDef = this.LEVEL_DEFINITIONS.find(def => def.level <= userLevel.current_level);
    const nextLevelDef = this.LEVEL_DEFINITIONS.find(def => def.level > userLevel.current_level);
    
    const levelProgress = nextLevelDef 
      ? (userLevel.experience_points - (currentLevelDef?.minPoints || 0)) / 
        (nextLevelDef.minPoints - (currentLevelDef?.minPoints || 0))
      : 1.0;

    // 성장 인사이트 생성
    const growthInsights = await this.generateGrowthInsights(userId, userLevel);

    return {
      userId,
      currentLevel: userLevel.current_level,
      experiencePoints: userLevel.experience_points,
      pointsToNextLevel: userLevel.points_to_next_level,
      levelProgress: Math.max(0, Math.min(1, levelProgress)),
      artistRating: userLevel.artist_rating,
      communityRating: userLevel.community_rating,
      overallRating: userLevel.overall_rating,
      newBadges: newAchievements.map(a => a.id),
      achievements: newAchievements,
      growthInsights
    };
  }

  /**
   * 성장 인사이트 생성
   */
  private static async generateGrowthInsights(userId: string, userLevel: any): Promise<GrowthInsight[]> {
    const insights: GrowthInsight[] = [];

    // 강점 분석
    if (userLevel.artist_rating >= 4.0) {
      insights.push({
        type: 'strength',
        title: '뛰어난 작품 품질',
        description: '당신의 작품은 커뮤니티에서 높은 품질로 인정받고 있습니다.',
        actionable: false,
        priority: 'low'
      });
    }

    if (userLevel.community_rating >= 4.0) {
      insights.push({
        type: 'strength',
        title: '활발한 커뮤니티 참여',
        description: '다른 작가들과의 활발한 소통으로 좋은 평가를 받고 있습니다.',
        actionable: false,
        priority: 'low'
      });
    }

    // 개선 제안
    if (userLevel.artist_rating < 3.0) {
      insights.push({
        type: 'improvement',
        title: '작품 품질 향상 기회',
        description: '더 많은 시간을 들여 작품을 완성하고 다양한 기법을 시도해보세요.',
        actionable: true,
        priority: 'high'
      });
    }

    if (userLevel.community_rating < 3.0) {
      insights.push({
        type: 'improvement',
        title: '커뮤니티 참여 독려',
        description: '다른 작가들의 작품에 좋아요와 댓글을 남겨 커뮤니티 활동을 늘려보세요.',
        actionable: true,
        priority: 'medium'
      });
    }

    // 마일스톤 축하
    const nextLevelDef = this.LEVEL_DEFINITIONS.find(def => def.level > userLevel.current_level);
    if (nextLevelDef && userLevel.experience_points >= nextLevelDef.minPoints * 0.8) {
      insights.push({
        type: 'milestone',
        title: '레벨업 임박!',
        description: `${nextLevelDef.title} 레벨까지 ${nextLevelDef.minPoints - userLevel.experience_points}점 남았습니다.`,
        actionable: true,
        priority: 'medium'
      });
    }

    return insights;
  }

  /**
   * 사용자 랭킹 조회
   */
  static async getUserRanking(userId: string): Promise<{
    globalRank: number;
    levelRank: number;
    categoryRank: number;
    totalUsers: number;
  }> {
    // 전체 랭킹
    const { data: globalRankData } = await supabase
      .from('user_levels')
      .select('user_id')
      .order('overall_rating', { ascending: false })
      .order('current_level', { ascending: false })
      .order('experience_points', { ascending: false });

    const globalRank = globalRankData?.findIndex(u => u.user_id === userId) + 1 || 0;
    const totalUsers = globalRankData?.length || 0;

    // 동일 레벨 내 랭킹
    const { data: userLevel } = await supabase
      .from('user_levels')
      .select('current_level')
      .eq('user_id', userId)
      .single();

    const { data: sameLevelUsers } = await supabase
      .from('user_levels')
      .select('user_id')
      .eq('current_level', userLevel?.current_level || 1)
      .order('experience_points', { ascending: false });

    const levelRank = sameLevelUsers?.findIndex(u => u.user_id === userId) + 1 || 0;

    return {
      globalRank,
      levelRank,
      categoryRank: 0, // TODO: 전문 분야별 랭킹
      totalUsers
    };
  }

  /**
   * 리더보드 조회
   */
  static async getLeaderboard(
    type: 'overall' | 'level' | 'artist_rating' | 'community_rating' = 'overall',
    limit: number = 10
  ): Promise<any[]> {
    
    let orderBy: string;
    switch (type) {
      case 'level':
        orderBy = 'current_level';
        break;
      case 'artist_rating':
        orderBy = 'artist_rating';
        break;
      case 'community_rating':
        orderBy = 'community_rating';
        break;
      default:
        orderBy = 'overall_rating';
    }

    const { data: leaderboard } = await supabase
      .from('user_levels')
      .select(`
        user_id,
        current_level,
        experience_points,
        artist_rating,
        community_rating,
        overall_rating,
        total_uploads,
        profiles!inner(handle, avatar_url)
      `)
      .order(orderBy, { ascending: false })
      .order('experience_points', { ascending: false })
      .limit(limit);

    return leaderboard || [];
  }
}
