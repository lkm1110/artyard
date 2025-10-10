/**
 * 🤖 AI 오케스트레이션 서비스
 * 모든 AI/ML 시스템의 중앙 제어 및 조정
 * 20년차 머신러닝 개발자의 종합 AI 플랫폼
 */

import { AdvancedSpamDetectionService, trackUserBehavior } from './spamDetectionService';
import { AdvancedRecommendationService } from './recommendationService';
import { ContentModerationService } from './contentModerationService';
import { TrendingService } from './trendingService';
import { UserGrowthService } from './userGrowthService';

export interface AIServiceConfig {
  features: {
    spamDetection: boolean;
    contentModeration: boolean;
    personalizedRecommendations: boolean;
    trendingAnalysis: boolean;
    userGrowth: boolean;
    batchProcessing: boolean;
  };
  performance: {
    maxConcurrentAnalyses: number;
    analysisTimeout: number; // milliseconds
    cacheEnabled: boolean;
    cacheTTL: number; // seconds
  };
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    performanceTracking: boolean;
    errorReporting: boolean;
  };
}

export interface AIAnalysisResult {
  userId: string;
  contentId?: string;
  sessionId: string;
  analyses: {
    spamDetection?: any;
    contentModeration?: any;
    recommendations?: any;
    trendingScore?: any;
    userGrowth?: any;
  };
  executionTime: number;
  timestamp: Date;
  success: boolean;
  errors: string[];
}

/**
 * 🎯 AI 시스템 성능 모니터링
 */
class AIPerformanceMonitor {
  private static metrics = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    avgExecutionTime: 0,
    activeAnalyses: 0
  };

  static startAnalysis(): string {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.activeAnalyses++;
    this.metrics.totalAnalyses++;
    return analysisId;
  }

  static endAnalysis(analysisId: string, executionTime: number, success: boolean): void {
    this.metrics.activeAnalyses = Math.max(0, this.metrics.activeAnalyses - 1);
    
    if (success) {
      this.metrics.successfulAnalyses++;
    } else {
      this.metrics.failedAnalyses++;
    }

    // 이동 평균으로 실행 시간 업데이트
    this.metrics.avgExecutionTime = 
      (this.metrics.avgExecutionTime * 0.9) + (executionTime * 0.1);

    console.log(`🔍 AI 분석 완료 [${analysisId}]: ${executionTime}ms, 성공: ${success}`);
  }

  static getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalAnalyses > 0 
        ? (this.metrics.successfulAnalyses / this.metrics.totalAnalyses * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

/**
 * 🎯 배치 처리 엔진
 */
class BatchProcessingEngine {
  private static isRunning = false;
  private static queue: Array<() => Promise<void>> = [];

  /**
   * 배치 작업 큐에 추가
   */
  static addToBatch(task: () => Promise<void>): void {
    this.queue.push(task);
    
    if (!this.isRunning) {
      this.processBatch();
    }
  }

  /**
   * 배치 처리 실행
   */
  private static async processBatch(): Promise<void> {
    if (this.isRunning || this.queue.length === 0) return;
    
    this.isRunning = true;
    console.log(`🔄 배치 처리 시작: ${this.queue.length}개 작업`);

    const batchSize = 10; // 동시 처리 작업 수
    
    while (this.queue.length > 0) {
      const currentBatch = this.queue.splice(0, batchSize);
      
      await Promise.allSettled(
        currentBatch.map(task => task())
      );
    }

    this.isRunning = false;
    console.log('✅ 배치 처리 완료');
  }

  /**
   * 정기 배치 작업 스케줄링
   */
  static scheduleRegularBatch(): void {
    // 1시간마다 트렌딩 스코어 업데이트
    setInterval(async () => {
      this.addToBatch(async () => {
        await TrendingService.updateAllTrendingScores(50);
      });
    }, 60 * 60 * 1000);

    // 30분마다 콘텐츠 스캔
    setInterval(async () => {
      this.addToBatch(async () => {
        await ContentModerationService.batchScanContent('artwork', 20);
      });
      
      this.addToBatch(async () => {
        await ContentModerationService.batchScanContent('comment', 50);
      });
    }, 30 * 60 * 1000);

    // 6시간마다 카테고리 랭킹 업데이트
    setInterval(async () => {
      this.addToBatch(async () => {
        await TrendingService.calculateCategoryRanks();
      });
    }, 6 * 60 * 60 * 1000);

    console.log('⏰ 정기 배치 작업이 스케줄링되었습니다');
  }
}

/**
 * 🎯 메인 AI 오케스트레이션 서비스
 */
export class AIOrchestrationService {
  private static config: AIServiceConfig = {
    features: {
      spamDetection: true,
      contentModeration: true,
      personalizedRecommendations: true,
      trendingAnalysis: true,
      userGrowth: true,
      batchProcessing: true
    },
    performance: {
      maxConcurrentAnalyses: 5,
      analysisTimeout: 30000, // 30초
      cacheEnabled: true,
      cacheTTL: 300 // 5분
    },
    monitoring: {
      logLevel: 'info',
      performanceTracking: true,
      errorReporting: true
    }
  };

  /**
   * AI 시스템 초기화
   */
  static async initialize(config?: Partial<AIServiceConfig>): Promise<void> {
    console.log('🤖 AI 오케스트레이션 시스템 초기화 중...');

    // 설정 병합
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // 배치 처리 스케줄링 시작
      if (this.config.features.batchProcessing) {
        BatchProcessingEngine.scheduleRegularBatch();
      }

      console.log('✅ AI 시스템 초기화 완료');
      console.log('📊 활성화된 기능들:', Object.entries(this.config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature)
      );

    } catch (error) {
      console.error('💥 AI 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 종합 콘텐츠 분석 (업로드 시)
   */
  static async analyzeContentUpload(
    userId: string,
    artworkId: string,
    contentData: {
      title: string;
      description: string;
      imageUrls: string[];
      material: string;
      price: string;
      metadata?: any;
    },
    sessionId: string = 'unknown'
  ): Promise<AIAnalysisResult> {

    const analysisId = AIPerformanceMonitor.startAnalysis();
    const startTime = Date.now();
    const errors: string[] = [];
    const analyses: any = {};

    console.log('🔍 종합 콘텐츠 분석 시작:', { userId, artworkId });

    try {
      // 병렬 분석 실행
      const analysisPromises: Promise<any>[] = [];

      // 1. 스팸 탐지 분석
      if (this.config.features.spamDetection) {
        analysisPromises.push(
          AdvancedSpamDetectionService.analyzeContent(
            userId,
            artworkId,
            'artwork',
            {
              text: `${contentData.title} ${contentData.description}`,
              imageUrl: contentData.imageUrls[0],
              metadata: contentData.metadata
            },
            { sessionId }
          ).then(result => ({ spamDetection: result }))
          .catch(error => {
            errors.push(`스팸 탐지 실패: ${error.message}`);
            return { spamDetection: null };
          })
        );
      }

      // 2. 콘텐츠 조정 분석
      if (this.config.features.contentModeration) {
        analysisPromises.push(
          ContentModerationService.analyzeContent({
            contentId: artworkId,
            contentType: 'artwork',
            reportReason: 'Automated upload analysis',
            reportCategory: 'other',
            content: {
              text: `${contentData.title} ${contentData.description}`,
              imageUrl: contentData.imageUrls[0],
              metadata: contentData
            }
          }).then(result => ({ contentModeration: result }))
          .catch(error => {
            errors.push(`콘텐츠 조정 실패: ${error.message}`);
            return { contentModeration: null };
          })
        );
      }

      // 3. 트렌딩 점수 계산 (비동기)
      if (this.config.features.trendingAnalysis) {
        BatchProcessingEngine.addToBatch(async () => {
          try {
            await TrendingService.calculateTrendingScore(artworkId);
          } catch (error) {
            console.error('트렌딩 점수 계산 실패:', error);
          }
        });
      }

      // 병렬 분석 결과 수집
      const analysisResults = await Promise.allSettled(analysisPromises);
      
      analysisResults.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(analyses, result.value);
        }
      });

      // 4. 사용자 행동 추적
      await trackUserBehavior(userId, 'upload', {
        artwork_id: artworkId,
        title: contentData.title,
        material: contentData.material,
        price: contentData.price
      }, 1.0, sessionId);

      // 5. 사용자 성장 업데이트
      if (this.config.features.userGrowth) {
        BatchProcessingEngine.addToBatch(async () => {
          try {
            await UserGrowthService.updateUserProgress(userId, 'upload_artwork', {
              artworkId,
              qualityScore: analyses.contentModeration?.confidence || 0.5
            });
          } catch (error) {
            console.error('사용자 성장 업데이트 실패:', error);
          }
        });
      }

      // 6. 자동 조치 실행 (필요시)
      if (analyses.spamDetection?.isSpam && analyses.spamDetection.recommendedAction !== 'ALLOW') {
        await AdvancedSpamDetectionService.executeAutoModeration(userId, analyses.spamDetection);
      }

      const executionTime = Date.now() - startTime;
      const success = errors.length === 0;

      AIPerformanceMonitor.endAnalysis(analysisId, executionTime, success);

      const result: AIAnalysisResult = {
        userId,
        contentId: artworkId,
        sessionId,
        analyses,
        executionTime,
        timestamp: new Date(),
        success,
        errors
      };

      console.log('✅ 종합 콘텐츠 분석 완료:', {
        success,
        executionTime: `${executionTime}ms`,
        errorsCount: errors.length
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      AIPerformanceMonitor.endAnalysis(analysisId, executionTime, false);
      
      console.error('💥 종합 콘텐츠 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 개인화 추천 생성
   */
  static async generatePersonalizedRecommendations(
    userId: string,
    sessionId: string,
    context: {
      currentTime?: Date;
      deviceType?: string;
      location?: { lat: number; lng: number };
      previousViewedArtworks?: string[];
    } = {}
  ): Promise<any> {
    
    if (!this.config.features.personalizedRecommendations) {
      console.warn('개인화 추천 기능이 비활성화되어 있습니다');
      return null;
    }

    const analysisId = AIPerformanceMonitor.startAnalysis();
    const startTime = Date.now();

    try {
      console.log('🎯 개인화 추천 생성 시작:', userId);

      const recommendations = await AdvancedRecommendationService.generateRecommendations({
        userId,
        sessionId,
        context: {
          currentTime: context.currentTime || new Date(),
          deviceType: context.deviceType || 'unknown',
          location: context.location,
          previousViewedArtworks: context.previousViewedArtworks || []
        },
        preferences: {
          maxResults: 20,
          diversityWeight: 0.3,
          noveltyWeight: 0.2
        }
      });

      const executionTime = Date.now() - startTime;
      AIPerformanceMonitor.endAnalysis(analysisId, executionTime, true);

      console.log('✅ 개인화 추천 생성 완료:', {
        algorithm: recommendations.algorithm,
        count: recommendations.artworks.length,
        confidence: recommendations.confidence
      });

      return recommendations;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      AIPerformanceMonitor.endAnalysis(analysisId, executionTime, false);
      
      console.error('💥 개인화 추천 생성 실패:', error);
      return null;
    }
  }

  /**
   * 사용자 행동 처리
   */
  static async handleUserAction(
    userId: string,
    action: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'share' | 'comment' | 'view',
    targetId: string,
    metadata: any = {},
    sessionId: string = 'unknown'
  ): Promise<void> {

    console.log('👤 사용자 행동 처리:', { userId, action, targetId });

    try {
      // 행동 추적
      await trackUserBehavior(userId, action, {
        target_id: targetId,
        ...metadata
      }, 1.0, sessionId);

      // 사용자 성장 업데이트 (배치)
      if (this.config.features.userGrowth) {
        BatchProcessingEngine.addToBatch(async () => {
          try {
            const activityMap: { [key: string]: string } = {
              'like': 'give_like',
              'comment': 'give_comment',
              'bookmark': 'bookmark',
              'share': 'share',
              'view': 'view'
            };

            const growthActivity = activityMap[action];
            if (growthActivity) {
              await UserGrowthService.updateUserProgress(userId, growthActivity, {
                targetId,
                ...metadata
              });
            }
          } catch (error) {
            console.error('사용자 성장 업데이트 실패:', error);
          }
        });
      }

      // 트렌딩 점수 업데이트 (배치)
      if (this.config.features.trendingAnalysis && ['like', 'share', 'comment'].includes(action)) {
        BatchProcessingEngine.addToBatch(async () => {
          try {
            await TrendingService.calculateTrendingScore(targetId);
          } catch (error) {
            console.error('트렌딩 점수 업데이트 실패:', error);
          }
        });
      }

    } catch (error) {
      console.error('💥 사용자 행동 처리 실패:', error);
    }
  }

  /**
   * 신고 처리
   */
  static async handleContentReport(
    reporterId: string,
    contentId: string,
    contentType: 'artwork' | 'comment' | 'profile' | 'message',
    reason: string,
    category: string,
    evidence?: any
  ): Promise<any> {

    if (!this.config.features.contentModeration) {
      console.warn('콘텐츠 조정 기능이 비활성화되어 있습니다');
      return null;
    }

    console.log('🚨 콘텐츠 신고 처리:', { reporterId, contentId, contentType, category });

    try {
      const result = await ContentModerationService.processReport({
        contentId,
        contentType,
        reporterId,
        reportReason: reason,
        reportCategory: category as any,
        content: evidence || {},
      });

      console.log('✅ 신고 처리 완료:', result);
      return result;

    } catch (error) {
      console.error('💥 신고 처리 실패:', error);
      throw error;
    }
  }

  /**
   * AI 시스템 상태 조회
   */
  static getSystemStatus(): {
    isHealthy: boolean;
    activeFeatures: string[];
    performance: any;
    configuration: AIServiceConfig;
  } {
    const performance = AIPerformanceMonitor.getMetrics();
    const activeFeatures = Object.entries(this.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);

    return {
      isHealthy: performance.activeAnalyses < this.config.performance.maxConcurrentAnalyses,
      activeFeatures,
      performance,
      configuration: this.config
    };
  }

  /**
   * 설정 업데이트
   */
  static updateConfiguration(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ AI 시스템 설정 업데이트 완료');
  }

  /**
   * 긴급 정지 (모든 AI 기능 비활성화)
   */
  static emergencyShutdown(reason: string): void {
    console.log('🆘 AI 시스템 긴급 정지:', reason);
    
    Object.keys(this.config.features).forEach(feature => {
      (this.config.features as any)[feature] = false;
    });

    console.log('🛑 모든 AI 기능이 비활성화되었습니다');
  }

  /**
   * 시스템 재시작
   */
  static async restart(): Promise<void> {
    console.log('🔄 AI 시스템 재시작 중...');
    
    // 모든 기능 재활성화
    Object.keys(this.config.features).forEach(feature => {
      (this.config.features as any)[feature] = true;
    });

    await this.initialize();
    console.log('✅ AI 시스템 재시작 완료');
  }
}

// React Native/웹 환경용 전역 에러 핸들러
if (typeof window !== 'undefined' && window.addEventListener && typeof document !== 'undefined') {
  // 웹 환경에서만 실행
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 AI 시스템 처리되지 않은 Promise 거부:', event.reason);
    // TODO: 에러 리포팅 시스템으로 전송
  });

  window.addEventListener('error', (event) => {
    console.error('🚨 AI 시스템 처리되지 않은 예외:', event.error);
    // TODO: 에러 리포팅 시스템으로 전송
  });
} else if (typeof global !== 'undefined' && typeof process !== 'undefined' && process.on) {
  // Node.js 환경 (개발 서버)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 AI 시스템 처리되지 않은 Promise 거부:', reason);
    // TODO: 에러 리포팅 시스템으로 전송
  });

  process.on('uncaughtException', (error) => {
    console.error('🚨 AI 시스템 처리되지 않은 예외:', error);
    // TODO: 에러 리포팅 시스템으로 전송
  });
} else {
  // React Native 환경 - 별도 에러 핸들링 없음 (React Native가 자체 처리)
  console.log('🤖 AI 시스템이 React Native 환경에서 초기화되었습니다');
}

export default AIOrchestrationService;
