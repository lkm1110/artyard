/**
 * 📈 고급 트렌딩 & 큐레이션 알고리즘
 * 실시간 인기도 분석 및 콘텐츠 발견 시스템
 */

import { supabase } from '../supabase';
import type { Artwork } from '../../types';

export interface TrendingMetrics {
  artworkId: string;
  trendingScore: number;
  velocityScore: number;
  engagementRate: number;
  viralityCoefficient: number;
  qualityScore: number;
  recencyBonus: number;
  timeDecayFactor: number;
  categoryRank: number;
  globalRank: number;
}

export interface TrendingConfiguration {
  timeWindows: {
    viral: number;      // 24시간
    trending: number;   // 7일
    popular: number;    // 30일
  };
  weights: {
    likes: number;
    comments: number;
    bookmarks: number;
    shares: number;
    views: number;
  };
  decayFactors: {
    hourly: number;
    daily: number;
    weekly: number;
  };
  boosts: {
    newArtist: number;
    verifiedArtist: number;
    qualityThreshold: number;
  };
}

/**
 * 🎯 실시간 참여도 분석 엔진
 */
class EngagementAnalysisEngine {
  /**
   * 작품별 참여도 메트릭 계산
   */
  static async calculateEngagementMetrics(artworkId: string, timeWindow: number): Promise<{
    totalViews: number;
    engagementRate: number;
    velocityScore: number;
    peakActivity: number;
  }> {
    
    const since = new Date(Date.now() - timeWindow * 1000);

    // 행동 데이터 조회
    const { data: behaviors } = await supabase
      .from('user_behaviors')
      .select('behavior_type, intensity_score, timestamp')
      .eq('artwork_id', artworkId)
      .gte('timestamp', since.toISOString());

    if (!behaviors || behaviors.length === 0) {
      return { totalViews: 0, engagementRate: 0, velocityScore: 0, peakActivity: 0 };
    }

    // 행동 타입별 집계
    const behaviorCounts = behaviors.reduce((acc, behavior) => {
      acc[behavior.behavior_type] = (acc[behavior.behavior_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const totalViews = behaviorCounts.view || 0;
    const totalEngagements = (behaviorCounts.like || 0) + 
                           (behaviorCounts.bookmark || 0) + 
                           (behaviorCounts.share || 0) + 
                           (behaviorCounts.comment || 0);

    const engagementRate = totalViews > 0 ? totalEngagements / totalViews : 0;

    // 시간별 활동도 분석 (속도)
    const hourlyActivity = this.calculateHourlyActivity(behaviors);
    const velocityScore = this.calculateVelocity(hourlyActivity);
    const peakActivity = Math.max(...hourlyActivity);

    return {
      totalViews,
      engagementRate,
      velocityScore,
      peakActivity
    };
  }

  /**
   * 시간별 활동도 계산
   */
  private static calculateHourlyActivity(behaviors: any[]): number[] {
    const hourlyBuckets = new Array(24).fill(0);
    
    behaviors.forEach(behavior => {
      const hour = new Date(behavior.timestamp).getHours();
      const weight = this.getBehaviorWeight(behavior.behavior_type);
      hourlyBuckets[hour] += weight;
    });

    return hourlyBuckets;
  }

  /**
   * 속도 점수 계산 (가속도 개념)
   */
  private static calculateVelocity(hourlyActivity: number[]): number {
    if (hourlyActivity.length < 3) return 0;

    let totalAcceleration = 0;
    for (let i = 2; i < hourlyActivity.length; i++) {
      const acceleration = hourlyActivity[i] - 2 * hourlyActivity[i-1] + hourlyActivity[i-2];
      totalAcceleration += Math.max(0, acceleration); // 양수 가속도만 고려
    }

    return Math.min(1.0, totalAcceleration / 100);
  }

  /**
   * 행동 가중치
   */
  private static getBehaviorWeight(behaviorType: string): number {
    const weights: { [key: string]: number } = {
      view: 1.0,
      like: 3.0,
      bookmark: 5.0,
      share: 8.0,
      comment: 4.0
    };
    return weights[behaviorType] || 1.0;
  }
}

/**
 * 🎯 바이럴리티 분석 엔진
 */
class ViralityEngine {
  /**
   * 바이럴 계수 계산
   */
  static async calculateViralityCoefficient(artworkId: string): Promise<number> {
    // 공유 행동 분석
    const { data: shareData } = await supabase
      .from('user_behaviors')
      .select(`
        user_id,
        timestamp,
        session_id
      `)
      .eq('artwork_id', artworkId)
      .eq('behavior_type', 'share')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!shareData || shareData.length === 0) return 0;

    // 공유 후 2차 확산 분석
    const secondaryViews = await this.calculateSecondarySpread(artworkId, shareData);
    
    // 공유자들의 팔로워 수 고려
    const sharerInfluence = await this.calculateSharerInfluence(shareData.map(s => s.user_id));
    
    // 시간 패턴 분석 (급격한 확산 vs 점진적 확산)
    const spreadPattern = this.analyzeSpreadPattern(shareData);

    const viralityScore = 
      (secondaryViews * 0.4) +
      (sharerInfluence * 0.3) +
      (spreadPattern * 0.3);

    return Math.min(1.0, viralityScore);
  }

  /**
   * 2차 확산 계산
   */
  private static async calculateSecondarySpread(artworkId: string, shareData: any[]): Promise<number> {
    // 공유 이후 시간대의 새로운 뷰어 수 분석
    const shareTimestamps = shareData.map(s => new Date(s.timestamp).getTime());
    const firstShare = Math.min(...shareTimestamps);
    
    const { data: postShareViews } = await supabase
      .from('user_behaviors')
      .select('user_id')
      .eq('artwork_id', artworkId)
      .eq('behavior_type', 'view')
      .gte('timestamp', new Date(firstShare).toISOString());

    const uniqueViewers = new Set(postShareViews?.map(v => v.user_id) || []).size;
    const shareCount = shareData.length;
    
    return shareCount > 0 ? uniqueViewers / shareCount : 0;
  }

  /**
   * 공유자 영향력 계산
   */
  private static async calculateSharerInfluence(sharerIds: string[]): Promise<number> {
    if (sharerIds.length === 0) return 0;

    // 공유자들의 평균 팔로워 수 (간접 지표)
    const { data: sharerProfiles } = await supabase
      .from('user_levels')
      .select('total_followers')
      .in('user_id', sharerIds);

    const totalFollowers = sharerProfiles?.reduce((sum, profile) => sum + (profile.total_followers || 0), 0) || 0;
    const avgInfluence = totalFollowers / sharerIds.length;

    return Math.min(1.0, Math.log(1 + avgInfluence) / 10);
  }

  /**
   * 확산 패턴 분석
   */
  private static analyzeSpreadPattern(shareData: any[]): number {
    if (shareData.length < 2) return 0;

    const timestamps = shareData.map(s => new Date(s.timestamp).getTime()).sort();
    const intervals = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    // 급격한 확산일수록 높은 점수 (짧은 간격)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const rapidSpreadScore = Math.max(0, 1 - (avgInterval / (60 * 60 * 1000))); // 1시간 기준

    return rapidSpreadScore;
  }
}

/**
 * 🎯 품질 점수 계산 엔진
 */
class QualityAssessmentEngine {
  /**
   * 작품 품질 점수 계산
   */
  static async calculateQualityScore(artworkId: string): Promise<number> {
    // 작품 데이터 조회
    const { data: artwork } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(*)
      `)
      .eq('id', artworkId)
      .single();

    if (!artwork) return 0;

    let qualityScore = 0;

    // 1. 작가 평판 (30%)
    const artistReputation = await this.calculateArtistReputation(artwork.author);
    qualityScore += artistReputation * 0.3;

    // 2. 콘텐츠 풍부도 (25%)
    const contentRichness = this.assessContentRichness(artwork);
    qualityScore += contentRichness * 0.25;

    // 3. 기술적 품질 (20%)
    const technicalQuality = await this.assessTechnicalQuality(artwork);
    qualityScore += technicalQuality * 0.2;

    // 4. 커뮤니티 반응 품질 (15%)
    const communityQuality = await this.assessCommunityReaction(artworkId);
    qualityScore += communityQuality * 0.15;

    // 5. 독창성 (10%)
    const originality = await this.assessOriginality(artwork);
    qualityScore += originality * 0.1;

    return Math.min(1.0, qualityScore);
  }

  /**
   * 작가 평판 계산
   */
  private static async calculateArtistReputation(artist: any): Promise<number> {
    if (!artist) return 0;

    const { data: artistLevel } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', artist.id)
      .single();

    if (!artistLevel) return 0.1;

    const reputationScore = 
      (artistLevel.artist_rating * 0.4) +
      (Math.log(1 + artistLevel.total_followers) / 10 * 0.3) +
      (Math.log(1 + artistLevel.total_uploads) / 10 * 0.3);

    return Math.min(1.0, reputationScore);
  }

  /**
   * 콘텐츠 풍부도 평가
   */
  private static assessContentRichness(artwork: any): number {
    let richness = 0;

    // 제목 품질
    if (artwork.title && artwork.title.length >= 5) richness += 0.2;
    
    // 설명 품질  
    if (artwork.description && artwork.description.length >= 20) richness += 0.3;
    
    // 메타데이터 완성도
    if (artwork.material) richness += 0.2;
    if (artwork.size) richness += 0.1;
    if (artwork.year) richness += 0.1;
    
    // 이미지 품질 (URL 개수 기준)
    const imageCount = artwork.images ? artwork.images.length : 0;
    richness += Math.min(0.1, imageCount * 0.05);

    return Math.min(1.0, richness);
  }

  /**
   * 기술적 품질 평가
   */
  private static async assessTechnicalQuality(artwork: any): Promise<number> {
    // 실제 구현에서는 이미지 분석 API 사용
    // 현재는 간단한 휴리스틱 사용
    
    let technicalScore = 0.5; // 기본 점수

    // 이미지 URL 유효성 체크
    if (artwork.images && artwork.images.length > 0) {
      technicalScore += 0.3;
    }

    // 파일 형식 체크 (고품질 형식 선호)
    const highQualityFormats = ['.png', '.jpg', '.jpeg'];
    const hasHighQuality = artwork.images?.some((url: string) => 
      highQualityFormats.some(format => url.toLowerCase().includes(format))
    );
    
    if (hasHighQuality) technicalScore += 0.2;

    return Math.min(1.0, technicalScore);
  }

  /**
   * 커뮤니티 반응 품질 평가
   */
  private static async assessCommunityReaction(artworkId: string): Promise<number> {
    // 댓글 품질 분석
    const { data: comments } = await supabase
      .from('user_behaviors')
      .select('behavior_data')
      .eq('artwork_id', artworkId)
      .eq('behavior_type', 'comment');

    if (!comments || comments.length === 0) return 0.3; // 중립적 점수

    // 댓글 길이 및 품질 분석
    const avgCommentLength = comments.reduce((sum, comment) => {
      const content = comment.behavior_data?.content || '';
      return sum + content.length;
    }, 0) / comments.length;

    const qualityScore = Math.min(1.0, avgCommentLength / 50); // 50자 기준 정규화

    return qualityScore;
  }

  /**
   * 독창성 평가
   */
  private static async assessOriginality(artwork: any): Promise<number> {
    // 유사한 작품과의 비교 (간단한 키워드 기반)
    const { data: similarArtworks } = await supabase
      .from('artworks')
      .select('title, description')
      .eq('material', artwork.material)
      .neq('id', artwork.id)
      .limit(20);

    if (!similarArtworks) return 1.0;

    const artworkText = `${artwork.title} ${artwork.description}`.toLowerCase();
    const artworkKeywords = new Set(artworkText.split(/\s+/));

    let maxSimilarity = 0;
    similarArtworks.forEach(similar => {
      const similarText = `${similar.title} ${similar.description}`.toLowerCase();
      const similarKeywords = new Set(similarText.split(/\s+/));
      
      const intersection = new Set([...artworkKeywords].filter(k => similarKeywords.has(k)));
      const union = new Set([...artworkKeywords, ...similarKeywords]);
      
      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return Math.max(0, 1 - maxSimilarity);
  }
}

/**
 * 🎯 메인 트렌딩 서비스
 */
export class TrendingService {
  private static readonly CONFIG: TrendingConfiguration = {
    timeWindows: {
      viral: 24 * 60 * 60,        // 24시간
      trending: 7 * 24 * 60 * 60, // 7일  
      popular: 30 * 24 * 60 * 60  // 30일
    },
    weights: {
      likes: 3.0,
      comments: 4.0,
      bookmarks: 5.0,
      shares: 8.0,
      views: 1.0
    },
    decayFactors: {
      hourly: 0.95,
      daily: 0.85,
      weekly: 0.7
    },
    boosts: {
      newArtist: 1.2,
      verifiedArtist: 1.1,
      qualityThreshold: 0.7
    }
  };

  /**
   * 트렌딩 점수 계산
   */
  static async calculateTrendingScore(artworkId: string): Promise<TrendingMetrics> {
    console.log('📈 트렌딩 점수 계산 시작:', artworkId);

    try {
      // 병렬 분석 실행
      const [
        engagementMetrics,
        viralityCoefficient,
        qualityScore,
        artworkData
      ] = await Promise.all([
        EngagementAnalysisEngine.calculateEngagementMetrics(artworkId, this.CONFIG.timeWindows.trending),
        ViralityEngine.calculateViralityCoefficient(artworkId),
        QualityAssessmentEngine.calculateQualityScore(artworkId),
        this.getArtworkData(artworkId)
      ]);

      // 시간 감쇠 적용
      const ageInDays = (Date.now() - new Date(artworkData.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const timeDecayFactor = Math.pow(this.CONFIG.decayFactors.daily, ageInDays);
      
      // 신규성 보너스 (첫 72시간)
      const recencyBonus = ageInDays <= 3 ? Math.max(0, 1 - ageInDays / 3) * 0.3 : 0;

      // 기본 트렌딩 점수 계산
      let baseScore = 
        (engagementMetrics.engagementRate * 0.3) +
        (engagementMetrics.velocityScore * 0.25) +
        (viralityCoefficient * 0.2) +
        (qualityScore * 0.15) +
        (Math.log(1 + engagementMetrics.totalViews) / 10 * 0.1);

      // 아티스트 부스트 적용
      const artistBoost = await this.calculateArtistBoost(artworkData.author_id);
      baseScore *= artistBoost;

      // 시간 감쇠 적용
      const finalScore = (baseScore * timeDecayFactor) + recencyBonus;

      const metrics: TrendingMetrics = {
        artworkId,
        trendingScore: Math.min(1.0, finalScore),
        velocityScore: engagementMetrics.velocityScore,
        engagementRate: engagementMetrics.engagementRate,
        viralityCoefficient,
        qualityScore,
        recencyBonus,
        timeDecayFactor,
        categoryRank: 0, // 별도 계산 필요
        globalRank: 0    // 별도 계산 필요
      };

      // 분석 결과 저장
      await this.saveTrendingMetrics(metrics);

      console.log('✅ 트렌딩 점수 계산 완료:', {
        score: metrics.trendingScore,
        engagement: metrics.engagementRate,
        quality: metrics.qualityScore
      });

      return metrics;

    } catch (error) {
      console.error('💥 트렌딩 점수 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 트렌딩 작품 목록 생성
   */
  static async getTrendingArtworks(
    category: 'viral' | 'trending' | 'popular' = 'trending',
    limit: number = 20,
    material?: string
  ): Promise<Artwork[]> {
    
    console.log('📊 트렌딩 작품 목록 생성:', { category, limit, material });

    try {
      const timeWindow = this.CONFIG.timeWindows[category];
      const since = new Date(Date.now() - timeWindow * 1000);

      // 기본 쿼리
      let query = supabase
        .from('artworks')
        .select(`
          *,
          author:profiles!artworks_author_id_fkey(*),
          artwork_analytics!inner(trending_score, engagement_rate, quality_score)
        `)
        .eq('is_hidden', false)
        .gte('created_at', since.toISOString());

      // 재료 필터 적용
      if (material && material !== 'all') {
        query = query.eq('material', material);
      }

      // 카테고리별 정렬 기준
      switch (category) {
        case 'viral':
          query = query
            .gt('artwork_analytics.engagement_rate', 0.1)
            .order('artwork_analytics.trending_score', { ascending: false });
          break;
        case 'trending':
          query = query
            .gt('artwork_analytics.trending_score', 0.3)
            .order('artwork_analytics.trending_score', { ascending: false });
          break;
        case 'popular':
          query = query
            .gt('likes_count', 5)
            .order('likes_count', { ascending: false });
          break;
      }

      const { data: artworks, error } = await query.limit(limit);

      if (error) {
        console.error('트렌딩 조회 오류:', error);
        // 폴백: 기본 인기 작품
        return this.getFallbackTrendingArtworks(limit, material);
      }

      console.log('✅ 트렌딩 작품 조회 완료:', artworks?.length);
      return artworks || [];

    } catch (error) {
      console.error('💥 트렌딩 조회 실패:', error);
      return this.getFallbackTrendingArtworks(limit, material);
    }
  }

  /**
   * 배치 트렌딩 스코어 업데이트
   */
  static async updateAllTrendingScores(batchSize: number = 100): Promise<{updated: number, errors: number}> {
    console.log('🔄 배치 트렌딩 스코어 업데이트 시작');

    let updated = 0;
    let errors = 0;

    try {
      // 최근 생성된 작품들 우선 업데이트
      const { data: artworks } = await supabase
        .from('artworks')
        .select('id, created_at')
        .eq('is_hidden', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(batchSize);

      if (!artworks) return { updated: 0, errors: 0 };

      for (const artwork of artworks) {
        try {
          await this.calculateTrendingScore(artwork.id);
          updated++;
        } catch (error) {
          console.error(`작품 ${artwork.id} 업데이트 실패:`, error);
          errors++;
        }
      }

      console.log('✅ 배치 업데이트 완료:', { updated, errors });
      return { updated, errors };

    } catch (error) {
      console.error('💥 배치 업데이트 실패:', error);
      return { updated, errors };
    }
  }

  /**
   * 헬퍼 함수들
   */
  private static async getArtworkData(artworkId: string): Promise<any> {
    const { data } = await supabase
      .from('artworks')
      .select('created_at, author_id, material')
      .eq('id', artworkId)
      .single();
    return data;
  }

  private static async calculateArtistBoost(authorId: string): Promise<number> {
    const { data: artistLevel } = await supabase
      .from('user_levels')
      .select('current_level, total_uploads, artist_rating')
      .eq('user_id', authorId)
      .single();

    if (!artistLevel) return 1.0;

    let boost = 1.0;

    // 신규 작가 부스트 (첫 5작품)
    if (artistLevel.total_uploads <= 5) {
      boost *= this.CONFIG.boosts.newArtist;
    }

    // 고평점 작가 부스트
    if (artistLevel.artist_rating >= 4.0) {
      boost *= this.CONFIG.boosts.verifiedArtist;
    }

    return boost;
  }

  private static async saveTrendingMetrics(metrics: TrendingMetrics): Promise<void> {
    try {
      const analyticsData = {
        artwork_id: metrics.artworkId,
        trending_score: metrics.trendingScore,
        engagement_rate: metrics.engagementRate,
        virality_coefficient: metrics.viralityCoefficient,
        quality_score: metrics.qualityScore,
        analyzed_at: new Date().toISOString(),
        analysis_version: '2.0'
      };

      // 먼저 기존 레코드 확인
      const { data: existing } = await supabase
        .from('artwork_analytics')
        .select('artwork_id')
        .eq('artwork_id', metrics.artworkId)
        .single();

      if (existing) {
        // 기존 레코드 업데이트
        await supabase
          .from('artwork_analytics')
          .update(analyticsData)
          .eq('artwork_id', metrics.artworkId);
      } else {
        // 새 레코드 삽입
        await supabase
          .from('artwork_analytics')
          .insert(analyticsData);
      }
    } catch (error) {
      console.error('💥 트렌딩 메트릭 저장 실패:', error);
      // 오류가 발생해도 전체 프로세스를 중단하지 않음
    }
  }

  private static async getFallbackTrendingArtworks(limit: number, material?: string): Promise<Artwork[]> {
    let query = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(*)
      `)
      .eq('is_hidden', false)
      .order('likes_count', { ascending: false });

    if (material && material !== 'all') {
      query = query.eq('material', material);
    }

    const { data: artworks } = await query.limit(limit);
    return artworks || [];
  }

  /**
   * 카테고리별 순위 계산
   */
  static async calculateCategoryRanks(): Promise<void> {
    console.log('🏆 카테고리별 순위 계산 시작');

    const materials = ['Illustration', 'Photography', 'Printmaking', 'Craft', 'Design Poster', 'Drawing'];

    for (const material of materials) {
      try {
        const { data: artworks } = await supabase
          .from('artwork_analytics')
          .select('artwork_id, trending_score')
          .eq('artworks.material', material)
          .order('trending_score', { ascending: false })
          .limit(100);

        if (artworks) {
          for (let i = 0; i < artworks.length; i++) {
            await supabase
              .from('artwork_analytics')
              .update({ category_rank: i + 1 })
              .eq('artwork_id', artworks[i].artwork_id);
          }
        }
      } catch (error) {
        console.error(`${material} 카테고리 순위 계산 실패:`, error);
      }
    }

    console.log('✅ 카테고리별 순위 계산 완료');
  }
}
