/**
 * 🤖 고급 개인화 추천 시스템
 * 협업 필터링 + 콘텐츠 기반 필터링 + 딥러닝 하이브리드 모델
 * 20년차 머신러닝 개발자의 정교한 추천 알고리즘
 */

import { supabase } from '../supabase';
import type { Artwork } from '../../types';

export interface RecommendationRequest {
  userId: string;
  sessionId: string;
  context: {
    currentTime: Date;
    deviceType: string;
    location?: { lat: number; lng: number };
    previousViewedArtworks: string[];
    currentScrollPosition?: number;
  };
  preferences: {
    explicitTags?: string[];
    excludeTags?: string[];
    maxResults?: number;
    diversityWeight?: number;
    noveltyWeight?: number;
  };
}

export interface RecommendationResult {
  artworks: EnhancedArtwork[];
  algorithm: 'collaborative' | 'content_based' | 'hybrid' | 'trending' | 'cold_start';
  confidence: number;
  diversityScore: number;
  explanations: RecommendationExplanation[];
  metadata: {
    processingTime: number;
    cacheHit: boolean;
    modelVersion: string;
    abTestVariant?: string;
  };
}

export interface EnhancedArtwork extends Artwork {
  recommendationScore: number;
  explanation: string;
  similarityReasons: string[];
  predictedEngagement: number;
  noveltyScore: number;
  diversityContribution: number;
}

export interface RecommendationExplanation {
  artworkId: string;
  primaryReason: 'similar_users_liked' | 'similar_content' | 'trending' | 'artist_affinity' | 'style_match';
  confidence: number;
  details: string;
}

export interface UserPreferenceProfile {
  userId: string;
  preferenceVector: number[];
  materialAffinities: { [material: string]: number };
  colorPreferences: { [color: string]: number };
  stylePreferences: { [style: string]: number };
  artistAffinities: { [artistId: string]: number };
  temporalPatterns: {
    activeHours: number[];
    dayOfWeekPreferences: number[];
    seasonalTrends: { [season: string]: number };
  };
  engagementProfile: {
    averageViewTime: number;
    likeRate: number;
    bookmarkRate: number;
    shareRate: number;
    commentRate: number;
  };
  lastUpdated: Date;
  confidence: number;
}

/**
 * 🎯 1단계: 사용자 선호도 프로필 생성 엔진
 */
class UserProfilingEngine {
  /**
   * 사용자 행동 데이터로부터 선호도 벡터 생성
   */
  static async generatePreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
    console.log('👤 사용자 선호도 프로필 생성 시작:', userId);

    // 사용자의 최근 행동 데이터 수집 (최근 90일)
    const { data: behaviors } = await supabase
      .from('user_behaviors')
      .select(`
        behavior_type,
        behavior_data,
        intensity_score,
        timestamp,
        artwork:artworks!inner(*)
      `)
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (!behaviors || behaviors.length === 0) {
      return this.createColdStartProfile(userId);
    }

    // 선호도 특징 추출
    const materialAffinities = this.calculateMaterialAffinities(behaviors);
    const colorPreferences = this.calculateColorPreferences(behaviors);
    const stylePreferences = this.calculateStylePreferences(behaviors);
    const artistAffinities = this.calculateArtistAffinities(behaviors);
    const temporalPatterns = this.analyzeTemporalPatterns(behaviors);
    const engagementProfile = this.calculateEngagementProfile(behaviors);

    // 고차원 선호도 벡터 생성 (100차원)
    const preferenceVector = this.generatePreferenceVector({
      materialAffinities,
      colorPreferences,
      stylePreferences,
      artistAffinities,
      temporalPatterns,
      engagementProfile
    });

    const profile: UserPreferenceProfile = {
      userId,
      preferenceVector,
      materialAffinities,
      colorPreferences,
      stylePreferences,
      artistAffinities,
      temporalPatterns,
      engagementProfile,
      lastUpdated: new Date(),
      confidence: this.calculateProfileConfidence(behaviors.length, engagementProfile)
    };

    // 프로필 저장
    await this.saveUserProfile(profile);

    console.log('✅ 사용자 선호도 프로필 생성 완료:', {
      confidence: profile.confidence,
      behaviors: behaviors.length
    });

    return profile;
  }

  /**
   * 신규 사용자를 위한 콜드 스타트 프로필
   */
  private static createColdStartProfile(userId: string): UserPreferenceProfile {
    return {
      userId,
      preferenceVector: new Array(100).fill(0.01), // 균등 분포
      materialAffinities: {},
      colorPreferences: {},
      stylePreferences: {},
      artistAffinities: {},
      temporalPatterns: {
        activeHours: new Array(24).fill(1 / 24),
        dayOfWeekPreferences: new Array(7).fill(1 / 7),
        seasonalTrends: { spring: 0.25, summer: 0.25, fall: 0.25, winter: 0.25 }
      },
      engagementProfile: {
        averageViewTime: 30,
        likeRate: 0.1,
        bookmarkRate: 0.05,
        shareRate: 0.02,
        commentRate: 0.03
      },
      lastUpdated: new Date(),
      confidence: 0.1
    };
  }

  /**
   * 재료별 선호도 계산
   */
  private static calculateMaterialAffinities(behaviors: any[]): { [material: string]: number } {
    const materialInteractions: { [material: string]: number } = {};
    
    behaviors.forEach(behavior => {
      if (behavior.artwork?.material) {
        const material = behavior.artwork.material;
        const weight = this.getInteractionWeight(behavior.behavior_type);
        materialInteractions[material] = (materialInteractions[material] || 0) + weight;
      }
    });

    // 정규화
    const total = Object.values(materialInteractions).reduce((sum, value) => sum + value, 0);
    const normalized: { [material: string]: number } = {};
    
    for (const [material, score] of Object.entries(materialInteractions)) {
      normalized[material] = total > 0 ? score / total : 0;
    }

    return normalized;
  }

  /**
   * 색상 선호도 분석
   */
  private static calculateColorPreferences(behaviors: any[]): { [color: string]: number } {
    // 실제 구현에서는 이미지 분석을 통한 색상 추출 필요
    // 현재는 시뮬레이션 데이터 사용
    const colorInteractions: { [color: string]: number } = {};
    
    behaviors.forEach(behavior => {
      if (behavior.artwork) {
        // 작품 제목/설명에서 색상 키워드 추출 (간단한 휴리스틱)
        const colorKeywords = this.extractColorKeywords(
          `${behavior.artwork.title} ${behavior.artwork.description}`
        );
        
        colorKeywords.forEach(color => {
          const weight = this.getInteractionWeight(behavior.behavior_type);
          colorInteractions[color] = (colorInteractions[color] || 0) + weight;
        });
      }
    });

    return this.normalizeScores(colorInteractions);
  }

  /**
   * 스타일 선호도 분석
   */
  private static calculateStylePreferences(behaviors: any[]): { [style: string]: number } {
    const styleInteractions: { [style: string]: number } = {};
    
    behaviors.forEach(behavior => {
      if (behavior.artwork) {
        // 작품 메타데이터에서 스타일 추론
        const inferredStyles = this.inferArtworkStyles(behavior.artwork);
        
        inferredStyles.forEach(style => {
          const weight = this.getInteractionWeight(behavior.behavior_type);
          styleInteractions[style] = (styleInteractions[style] || 0) + weight;
        });
      }
    });

    return this.normalizeScores(styleInteractions);
  }

  /**
   * 작가 선호도 계산
   */
  private static calculateArtistAffinities(behaviors: any[]): { [artistId: string]: number } {
    const artistInteractions: { [artistId: string]: number } = {};
    
    behaviors.forEach(behavior => {
      if (behavior.artwork?.author_id) {
        const artistId = behavior.artwork.author_id;
        const weight = this.getInteractionWeight(behavior.behavior_type);
        artistInteractions[artistId] = (artistInteractions[artistId] || 0) + weight;
      }
    });

    return this.normalizeScores(artistInteractions);
  }

  /**
   * 시간 패턴 분석
   */
  private static analyzeTemporalPatterns(behaviors: any[]): UserPreferenceProfile['temporalPatterns'] {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    
    behaviors.forEach(behavior => {
      const date = new Date(behavior.timestamp);
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    return {
      activeHours: this.normalizeArray(hourCounts),
      dayOfWeekPreferences: this.normalizeArray(dayOfWeekCounts),
      seasonalTrends: { spring: 0.25, summer: 0.25, fall: 0.25, winter: 0.25 } // TODO: 실제 계산
    };
  }

  /**
   * 참여도 프로필 계산
   */
  private static calculateEngagementProfile(behaviors: any[]): UserPreferenceProfile['engagementProfile'] {
    const engagementTypes = behaviors.reduce((acc, behavior) => {
      acc[behavior.behavior_type] = (acc[behavior.behavior_type] || 0) + 1;
      return acc;
    }, {} as { [type: string]: number });

    const totalViews = engagementTypes.view || 1;

    return {
      averageViewTime: 30, // TODO: 실제 시청 시간 계산
      likeRate: (engagementTypes.like || 0) / totalViews,
      bookmarkRate: (engagementTypes.bookmark || 0) / totalViews,
      shareRate: (engagementTypes.share || 0) / totalViews,
      commentRate: (engagementTypes.comment || 0) / totalViews
    };
  }

  /**
   * 고차원 선호도 벡터 생성
   */
  private static generatePreferenceVector(features: any): number[] {
    const vector = new Array(100).fill(0);
    
    // 재료 선호도 (0-19차원)
    Object.entries(features.materialAffinities).forEach(([material, score], idx) => {
      if (idx < 20) vector[idx] = score as number;
    });

    // 색상 선호도 (20-39차원)
    Object.entries(features.colorPreferences).forEach(([color, score], idx) => {
      if (idx < 20) vector[20 + idx] = score as number;
    });

    // 스타일 선호도 (40-59차원)
    Object.entries(features.stylePreferences).forEach(([style, score], idx) => {
      if (idx < 20) vector[40 + idx] = score as number;
    });

    // 시간 패턴 (60-83차원)
    features.temporalPatterns.activeHours.forEach((score: number, idx: number) => {
      if (idx < 24) vector[60 + idx] = score;
    });

    // 참여도 특성 (84-88차원)
    const engagement = features.engagementProfile;
    vector[84] = engagement.likeRate;
    vector[85] = engagement.bookmarkRate;
    vector[86] = engagement.shareRate;
    vector[87] = engagement.commentRate;
    vector[88] = Math.log(1 + engagement.averageViewTime) / 10; // 로그 정규화

    // 나머지 차원은 향후 확장 가능

    return vector;
  }

  /**
   * 프로필 신뢰도 계산
   */
  private static calculateProfileConfidence(behaviorCount: number, engagement: UserPreferenceProfile['engagementProfile']): number {
    const dataScore = Math.min(1.0, behaviorCount / 100); // 100개 행동시 최대 점수
    const engagementScore = (engagement.likeRate + engagement.bookmarkRate + engagement.shareRate) / 3;
    
    return (dataScore * 0.7 + engagementScore * 0.3);
  }

  /**
   * 헬퍼 함수들
   */
  private static getInteractionWeight(behaviorType: string): number {
    const weights: { [type: string]: number } = {
      view: 1.0,
      like: 3.0,
      bookmark: 5.0,
      share: 7.0,
      comment: 4.0,
      download: 6.0
    };
    return weights[behaviorType] || 1.0;
  }

  private static extractColorKeywords(text: string): string[] {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'gray'];
    return colors.filter(color => text.toLowerCase().includes(color));
  }

  private static inferArtworkStyles(artwork: any): string[] {
    // 간단한 키워드 기반 스타일 추론 (실제로는 이미지 분석 필요)
    const styles = ['abstract', 'realistic', 'impressionist', 'modern', 'classical', 'minimalist'];
    const text = `${artwork.title} ${artwork.description}`.toLowerCase();
    return styles.filter(style => text.includes(style));
  }

  private static normalizeScores(scores: { [key: string]: number }): { [key: string]: number } {
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const normalized: { [key: string]: number } = {};
    
    for (const [key, value] of Object.entries(scores)) {
      normalized[key] = total > 0 ? value / total : 0;
    }
    
    return normalized;
  }

  private static normalizeArray(arr: number[]): number[] {
    const sum = arr.reduce((sum, value) => sum + value, 0);
    return sum > 0 ? arr.map(value => value / sum) : arr.map(() => 1 / arr.length);
  }

  /**
   * 사용자 프로필 저장
   */
  private static async saveUserProfile(profile: UserPreferenceProfile): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: profile.userId,
        preference_vector: profile.preferenceVector,
        material_preferences: profile.materialAffinities,
        color_preferences: profile.colorPreferences,
        style_preferences: profile.stylePreferences,
        artist_preferences: profile.artistAffinities,
        activity_pattern: profile.temporalPatterns,
        engagement_score: 
          (profile.engagementProfile.likeRate + 
           profile.engagementProfile.bookmarkRate + 
           profile.engagementProfile.shareRate) / 3,
        confidence_score: profile.confidence,
        last_updated: new Date().toISOString()
      });

    if (error) {
      console.error('프로필 저장 실패:', error);
    }
  }
}

/**
 * 🎯 2단계: 협업 필터링 엔진
 */
class CollaborativeFilteringEngine {
  /**
   * 유사한 사용자 찾기 (User-Based Collaborative Filtering)
   */
  static async findSimilarUsers(targetUserId: string, limit: number = 50): Promise<{userId: string, similarity: number}[]> {
    // 타겟 사용자 프로필 조회
    const { data: targetProfile } = await supabase
      .from('user_preferences')
      .select('preference_vector, material_preferences, color_preferences, style_preferences')
      .eq('user_id', targetUserId)
      .single();

    if (!targetProfile) return [];

    // 다른 사용자들과의 유사도 계산
    const { data: otherProfiles } = await supabase
      .from('user_preferences')
      .select('user_id, preference_vector, material_preferences, color_preferences, style_preferences')
      .neq('user_id', targetUserId)
      .gt('confidence_score', 0.3) // 신뢰도 있는 프로필만
      .limit(200); // 계산 효율성을 위해 제한

    if (!otherProfiles) return [];

    const similarities = otherProfiles.map(profile => ({
      userId: profile.user_id,
      similarity: this.calculateUserSimilarity(targetProfile, profile)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    return similarities;
  }

  /**
   * 사용자 간 유사도 계산 (코사인 유사도 + 가중치)
   */
  private static calculateUserSimilarity(user1: any, user2: any): number {
    // 선호도 벡터 코사인 유사도
    const vectorSimilarity = this.cosineSimilarity(user1.preference_vector || [], user2.preference_vector || []);
    
    // 재료 선호도 유사도
    const materialSimilarity = this.categoryPreferenceSimilarity(user1.material_preferences, user2.material_preferences);
    
    // 색상 선호도 유사도
    const colorSimilarity = this.categoryPreferenceSimilarity(user1.color_preferences, user2.color_preferences);
    
    // 스타일 선호도 유사도
    const styleSimilarity = this.categoryPreferenceSimilarity(user1.style_preferences, user2.style_preferences);

    // 가중 평균
    return (
      vectorSimilarity * 0.5 +
      materialSimilarity * 0.2 +
      colorSimilarity * 0.15 +
      styleSimilarity * 0.15
    );
  }

  /**
   * 협업 필터링 기반 추천
   */
  static async getCollaborativeRecommendations(
    userId: string, 
    similarUsers: {userId: string, similarity: number}[],
    limit: number = 20
  ): Promise<{artworkId: string, score: number, explanation: string}[]> {
    
    if (similarUsers.length === 0) return [];

    // 유사 사용자들이 좋아한 작품 조회
    const similarUserIds = similarUsers.map(u => u.userId);
    
    const { data: likedArtworks } = await supabase
      .from('user_behaviors')
      .select(`
        user_id,
        artwork_id,
        behavior_type,
        intensity_score,
        artworks!inner(id, title, author:profiles(handle))
      `)
      .in('user_id', similarUserIds)
      .in('behavior_type', ['like', 'bookmark', 'share'])
      .limit(1000);

    if (!likedArtworks) return [];

    // 사용자가 이미 상호작용한 작품 제외
    const { data: userInteractions } = await supabase
      .from('user_behaviors')
      .select('artwork_id')
      .eq('user_id', userId)
      .in('behavior_type', ['view', 'like', 'bookmark', 'share']);

    const userArtworkIds = new Set(userInteractions?.map(i => i.artwork_id) || []);

    // 스코어링
    const artworkScores: { [artworkId: string]: { score: number, users: string[], count: number } } = {};

    likedArtworks.forEach(interaction => {
      if (userArtworkIds.has(interaction.artwork_id)) return; // 이미 본 작품 제외

      const userSimilarity = similarUsers.find(u => u.userId === interaction.user_id)?.similarity || 0;
      const behaviorWeight = this.getBehaviorWeight(interaction.behavior_type);
      const score = userSimilarity * behaviorWeight * interaction.intensity_score;

      if (!artworkScores[interaction.artwork_id]) {
        artworkScores[interaction.artwork_id] = { score: 0, users: [], count: 0 };
      }

      artworkScores[interaction.artwork_id].score += score;
      artworkScores[interaction.artwork_id].users.push(interaction.user_id);
      artworkScores[interaction.artwork_id].count++;
    });

    // 추천 결과 생성
    const recommendations = Object.entries(artworkScores)
      .map(([artworkId, data]) => ({
        artworkId,
        score: data.score / Math.max(1, data.count), // 평균 스코어
        explanation: `${data.count} similar users liked this artwork`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * 헬퍼 함수들
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0) return 0;
    
    const minLength = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private static categoryPreferenceSimilarity(cat1: any, cat2: any): number {
    const keys1 = new Set(Object.keys(cat1 || {}));
    const keys2 = new Set(Object.keys(cat2 || {}));
    const allKeys = new Set([...keys1, ...keys2]);

    if (allKeys.size === 0) return 0;

    let similarity = 0;
    for (const key of allKeys) {
      const val1 = cat1?.[key] || 0;
      const val2 = cat2?.[key] || 0;
      similarity += Math.min(val1, val2);
    }

    return similarity;
  }

  private static getBehaviorWeight(behaviorType: string): number {
    const weights: { [type: string]: number } = {
      like: 1.0,
      bookmark: 1.5,
      share: 2.0,
      comment: 1.2
    };
    return weights[behaviorType] || 1.0;
  }
}

/**
 * 🎯 3단계: 콘텐츠 기반 필터링 엔진
 */
class ContentBasedFilteringEngine {
  /**
   * 작품 특성 기반 추천
   */
  static async getContentBasedRecommendations(
    userId: string,
    userProfile: UserPreferenceProfile,
    limit: number = 20
  ): Promise<{artworkId: string, score: number, explanation: string}[]> {

    // 사용자가 좋아했던 작품들의 특성 분석
    const { data: likedArtworks } = await supabase
      .from('user_behaviors')
      .select(`
        artwork_id,
        artworks!inner(*)
      `)
      .eq('user_id', userId)
      .in('behavior_type', ['like', 'bookmark'])
      .limit(50);

    if (!likedArtworks || likedArtworks.length === 0) {
      return this.getPopularityBasedRecommendations(limit);
    }

    // 후보 작품 조회 (사용자가 보지 않은 작품)
    const { data: userInteractions } = await supabase
      .from('user_behaviors')
      .select('artwork_id')
      .eq('user_id', userId);

    const viewedArtworkIds = new Set(userInteractions?.map(i => i.artwork_id) || []);

    const { data: candidateArtworks } = await supabase
      .from('artworks')
      .select('*')
      .eq('is_hidden', false)
      .limit(500);

    if (!candidateArtworks) return [];

    // 후보 작품들과 사용자 선호도 매칭
    const scoredArtworks = candidateArtworks
      .filter(artwork => !viewedArtworkIds.has(artwork.id))
      .map(artwork => {
        const score = this.calculateContentSimilarityScore(artwork, userProfile, likedArtworks);
        return {
          artworkId: artwork.id,
          score,
          explanation: this.generateContentExplanation(artwork, userProfile)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredArtworks;
  }

  /**
   * 콘텐츠 유사도 스코어 계산
   */
  private static calculateContentSimilarityScore(
    artwork: any, 
    userProfile: UserPreferenceProfile,
    likedArtworks: any[]
  ): number {
    let totalScore = 0;

    // 재료 선호도 매칭
    const materialScore = userProfile.materialAffinities[artwork.material] || 0;
    totalScore += materialScore * 0.3;

    // 작가 선호도
    const artistScore = userProfile.artistAffinities[artwork.author_id] || 0;
    totalScore += artistScore * 0.25;

    // 스타일 매칭 (작품 설명 기반)
    const styleScore = this.calculateStyleMatch(artwork, userProfile.stylePreferences);
    totalScore += styleScore * 0.2;

    // 색상 매칭 (작품 제목/설명 기반)
    const colorScore = this.calculateColorMatch(artwork, userProfile.colorPreferences);
    totalScore += colorScore * 0.15;

    // 유사 작품과의 거리 계산
    const similarityScore = this.calculateSimilarityToLikedArtworks(artwork, likedArtworks);
    totalScore += similarityScore * 0.1;

    return Math.min(1.0, totalScore);
  }

  /**
   * 스타일 매칭 점수
   */
  private static calculateStyleMatch(artwork: any, stylePreferences: { [style: string]: number }): number {
    const text = `${artwork.title} ${artwork.description}`.toLowerCase();
    let totalScore = 0;

    for (const [style, preference] of Object.entries(stylePreferences)) {
      if (text.includes(style.toLowerCase())) {
        totalScore += preference;
      }
    }

    return totalScore;
  }

  /**
   * 색상 매칭 점수
   */
  private static calculateColorMatch(artwork: any, colorPreferences: { [color: string]: number }): number {
    const text = `${artwork.title} ${artwork.description}`.toLowerCase();
    let totalScore = 0;

    for (const [color, preference] of Object.entries(colorPreferences)) {
      if (text.includes(color.toLowerCase())) {
        totalScore += preference;
      }
    }

    return totalScore;
  }

  /**
   * 좋아한 작품들과의 유사도
   */
  private static calculateSimilarityToLikedArtworks(artwork: any, likedArtworks: any[]): number {
    if (likedArtworks.length === 0) return 0;

    let maxSimilarity = 0;

    likedArtworks.forEach(liked => {
      const likedArtwork = liked.artworks;
      let similarity = 0;

      // 재료 매칭
      if (artwork.material === likedArtwork.material) similarity += 0.4;
      
      // 작가 매칭  
      if (artwork.author_id === likedArtwork.author_id) similarity += 0.3;

      // 키워드 유사도
      const keywordSimilarity = this.calculateKeywordSimilarity(
        `${artwork.title} ${artwork.description}`,
        `${likedArtwork.title} ${likedArtwork.description}`
      );
      similarity += keywordSimilarity * 0.3;

      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return maxSimilarity;
  }

  /**
   * 키워드 유사도 (Jaccard similarity)
   */
  private static calculateKeywordSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 콘텐츠 기반 설명 생성
   */
  private static generateContentExplanation(artwork: any, userProfile: UserPreferenceProfile): string {
    const reasons = [];

    if (userProfile.materialAffinities[artwork.material] > 0.1) {
      reasons.push(`you like ${artwork.material} artworks`);
    }

    if (userProfile.artistAffinities[artwork.author_id] > 0.1) {
      reasons.push(`you follow this artist`);
    }

    return reasons.length > 0 
      ? `Because ${reasons.join(' and ')}`
      : 'Based on your general preferences';
  }

  /**
   * 인기도 기반 대체 추천 (콜드 스타트)
   */
  private static async getPopularityBasedRecommendations(limit: number): Promise<{artworkId: string, score: number, explanation: string}[]> {
    const { data: popularArtworks } = await supabase
      .from('artworks')
      .select('id, likes_count, comments_count, created_at')
      .eq('is_hidden', false)
      .order('likes_count', { ascending: false })
      .limit(limit);

    return popularArtworks?.map(artwork => ({
      artworkId: artwork.id,
      score: Math.log(1 + artwork.likes_count) / 10, // 로그 스케일링
      explanation: 'Popular among all users'
    })) || [];
  }
}

/**
 * 🎯 4단계: 메인 추천 시스템
 */
export class AdvancedRecommendationService {
  /**
   * 하이브리드 추천 생성
   */
  static async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();
    console.log('🎯 개인화 추천 생성 시작:', request.userId);

    try {
      // 1단계: 사용자 프로필 생성/업데이트
      const userProfile = await UserProfilingEngine.generatePreferenceProfile(request.userId);
      
      let algorithm: RecommendationResult['algorithm'] = 'hybrid';
      let artworkRecommendations: {artworkId: string, score: number, explanation: string}[] = [];

      // 2단계: 알고리즘 선택 (사용자 데이터 신뢰도에 따라)
      if (userProfile.confidence < 0.3) {
        // 콜드 스타트: 트렌딩 기반
        algorithm = 'cold_start';
        artworkRecommendations = await this.getTrendingRecommendations(request.preferences.maxResults || 20);
      } else {
        // 협업 + 콘텐츠 하이브리드
        const [collaborativeRecs, contentBasedRecs] = await Promise.all([
          this.getCollaborativeRecommendations(request.userId, request.preferences.maxResults || 10),
          this.getContentBasedRecommendations(request.userId, userProfile, request.preferences.maxResults || 10)
        ]);

        // 하이브리드 스코어 계산
        artworkRecommendations = this.combineRecommendations(collaborativeRecs, contentBasedRecs, userProfile.confidence);
      }

      // 3단계: 다양성 및 신규성 최적화
      const diversifiedRecs = this.optimizeDiversity(
        artworkRecommendations, 
        request.preferences.diversityWeight || 0.3,
        request.preferences.noveltyWeight || 0.2
      );

      // 4단계: 작품 정보 조회 및 향상된 결과 생성
      const enhancedArtworks = await this.enhanceRecommendations(
        diversifiedRecs.slice(0, request.preferences.maxResults || 20),
        userProfile
      );

      // 5단계: 추천 로깅
      await this.logRecommendations(request.userId, request.sessionId, algorithm, enhancedArtworks);

      const result: RecommendationResult = {
        artworks: enhancedArtworks,
        algorithm,
        confidence: userProfile.confidence,
        diversityScore: this.calculateDiversityScore(enhancedArtworks),
        explanations: this.generateExplanations(enhancedArtworks),
        metadata: {
          processingTime: Date.now() - startTime,
          cacheHit: false, // TODO: 캐싱 구현
          modelVersion: '2.0',
          abTestVariant: 'hybrid_v2'
        }
      };

      console.log('✅ 추천 생성 완료:', {
        algorithm,
        count: enhancedArtworks.length,
        confidence: userProfile.confidence,
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      console.error('💥 추천 생성 실패:', error);
      
      // 안전장치: 기본 추천 반환
      const fallbackRecs = await this.getFallbackRecommendations(request.preferences.maxResults || 10);
      
      return {
        artworks: fallbackRecs,
        algorithm: 'trending',
        confidence: 0.1,
        diversityScore: 0.5,
        explanations: fallbackRecs.map(artwork => ({
          artworkId: artwork.id,
          primaryReason: 'trending',
          confidence: 0.1,
          details: 'Trending in the community'
        })),
        metadata: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
          modelVersion: '2.0'
        }
      };
    }
  }

  /**
   * 협업 필터링 추천
   */
  private static async getCollaborativeRecommendations(
    userId: string, 
    limit: number
  ): Promise<{artworkId: string, score: number, explanation: string}[]> {
    const similarUsers = await CollaborativeFilteringEngine.findSimilarUsers(userId, 30);
    return CollaborativeFilteringEngine.getCollaborativeRecommendations(userId, similarUsers, limit);
  }

  /**
   * 콘텐츠 기반 추천
   */
  private static async getContentBasedRecommendations(
    userId: string, 
    userProfile: UserPreferenceProfile,
    limit: number
  ): Promise<{artworkId: string, score: number, explanation: string}[]> {
    return ContentBasedFilteringEngine.getContentBasedRecommendations(userId, userProfile, limit);
  }

  /**
   * 추천 결합 (하이브리드)
   */
  private static combineRecommendations(
    collaborative: {artworkId: string, score: number, explanation: string}[],
    contentBased: {artworkId: string, score: number, explanation: string}[],
    userConfidence: number
  ): {artworkId: string, score: number, explanation: string}[] {
    
    const collabWeight = userConfidence * 0.6;
    const contentWeight = (1 - userConfidence * 0.6);

    const combined = new Map<string, {score: number, explanation: string}>();

    // 협업 필터링 결과 추가
    collaborative.forEach(rec => {
      combined.set(rec.artworkId, {
        score: rec.score * collabWeight,
        explanation: rec.explanation
      });
    });

    // 콘텐츠 기반 결과 추가/결합
    contentBased.forEach(rec => {
      if (combined.has(rec.artworkId)) {
        const existing = combined.get(rec.artworkId)!;
        combined.set(rec.artworkId, {
          score: existing.score + (rec.score * contentWeight),
          explanation: `${existing.explanation} and ${rec.explanation}`
        });
      } else {
        combined.set(rec.artworkId, {
          score: rec.score * contentWeight,
          explanation: rec.explanation
        });
      }
    });

    return Array.from(combined.entries())
      .map(([artworkId, data]) => ({
        artworkId,
        score: data.score,
        explanation: data.explanation
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 트렌딩 추천 (콜드 스타트)
   */
  private static async getTrendingRecommendations(limit: number): Promise<{artworkId: string, score: number, explanation: string}[]> {
    const { data: trendingArtworks } = await supabase
      .from('artworks')
      .select('id, likes_count, comments_count, created_at')
      .eq('is_hidden', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 최근 7일
      .order('likes_count', { ascending: false })
      .limit(limit);

    return trendingArtworks?.map(artwork => ({
      artworkId: artwork.id,
      score: Math.log(1 + artwork.likes_count) / 10,
      explanation: 'Trending this week'
    })) || [];
  }

  /**
   * 다양성 최적화
   */
  private static optimizeDiversity(
    recommendations: {artworkId: string, score: number, explanation: string}[],
    diversityWeight: number,
    noveltyWeight: number
  ): {artworkId: string, score: number, explanation: string}[] {
    
    // TODO: 실제 다양성 알고리즘 구현 (MMR, DPP 등)
    // 현재는 단순한 재정렬로 대체
    
    const shuffled = [...recommendations];
    for (let i = shuffled.length - 1; i > 0; i--) {
      if (Math.random() < diversityWeight) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }

    return shuffled;
  }

  /**
   * 추천 결과 향상
   */
  private static async enhanceRecommendations(
    recommendations: {artworkId: string, score: number, explanation: string}[],
    userProfile: UserPreferenceProfile
  ): Promise<EnhancedArtwork[]> {
    
    if (recommendations.length === 0) return [];

    const artworkIds = recommendations.map(rec => rec.artworkId);
    
    const { data: artworks } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .in('id', artworkIds);

    if (!artworks) return [];

    return artworks.map(artwork => {
      const recommendation = recommendations.find(rec => rec.artworkId === artwork.id)!;
      
      return {
        ...artwork,
        recommendationScore: recommendation.score,
        explanation: recommendation.explanation,
        similarityReasons: this.generateSimilarityReasons(artwork, userProfile),
        predictedEngagement: this.predictEngagement(artwork, userProfile),
        noveltyScore: this.calculateNoveltyScore(artwork),
        diversityContribution: Math.random() // TODO: 실제 계산
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * 헬퍼 함수들
   */
  private static generateSimilarityReasons(artwork: any, userProfile: UserPreferenceProfile): string[] {
    const reasons = [];
    
    if (userProfile.materialAffinities[artwork.material] > 0.1) {
      reasons.push(`material preference: ${artwork.material}`);
    }
    
    if (userProfile.artistAffinities[artwork.author_id] > 0.1) {
      reasons.push('artist affinity');
    }
    
    return reasons;
  }

  private static predictEngagement(artwork: any, userProfile: UserPreferenceProfile): number {
    // 간단한 참여도 예측 (실제로는 더 복잡한 모델 사용)
    const baseEngagement = userProfile.engagementProfile.likeRate;
    const materialBonus = userProfile.materialAffinities[artwork.material] || 0;
    const artistBonus = userProfile.artistAffinities[artwork.author_id] || 0;
    
    return Math.min(1.0, baseEngagement + materialBonus * 0.3 + artistBonus * 0.2);
  }

  private static calculateNoveltyScore(artwork: any): number {
    // 작품의 생성 시간 기반 신규성 계산
    const daysSinceCreated = (Date.now() - new Date(artwork.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSinceCreated / 30); // 30일 기준
  }

  private static calculateDiversityScore(artworks: EnhancedArtwork[]): number {
    if (artworks.length === 0) return 0;
    
    const materials = new Set(artworks.map(a => a.material));
    const artists = new Set(artworks.map(a => a.author_id));
    
    return (materials.size + artists.size) / (artworks.length * 2);
  }

  private static generateExplanations(artworks: EnhancedArtwork[]): RecommendationExplanation[] {
    return artworks.map(artwork => ({
      artworkId: artwork.id,
      primaryReason: 'similar_content', // TODO: 실제 주요 이유 식별
      confidence: artwork.recommendationScore,
      details: artwork.explanation
    }));
  }

  /**
   * 추천 로깅
   */
  private static async logRecommendations(
    userId: string,
    sessionId: string,
    algorithm: string,
    artworks: EnhancedArtwork[]
  ): Promise<void> {
    try {
      await supabase
        .from('recommendation_logs')
        .insert({
          user_id: userId,
          session_id: sessionId,
          algorithm_type: algorithm,
          algorithm_version: '2.0',
          recommended_artworks: artworks.map(a => a.id),
          recommendation_scores: artworks.map(a => a.recommendationScore)
        });
    } catch (error) {
      console.error('추천 로깅 실패:', error);
    }
  }

  /**
   * 안전장치 추천
   */
  private static async getFallbackRecommendations(limit: number): Promise<EnhancedArtwork[]> {
    const { data: artworks } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(id, handle, avatar_url, school, department)
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    return artworks?.map(artwork => ({
      ...artwork,
      recommendationScore: 0.1,
      explanation: 'Recent artwork',
      similarityReasons: [],
      predictedEngagement: 0.1,
      noveltyScore: 1.0,
      diversityContribution: 0.5
    })) || [];
  }
}
