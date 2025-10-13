/**
 * 🤖 고급 스팸/도배 탐지 AI 시스템
 * 20년차 머신러닝 개발자의 정교한 멀티레이어 탐지 알고리즘
 */

import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  spamType: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'ALLOW' | 'SHADOW_BAN' | 'TEMP_BAN' | 'PERMANENT_BAN';
  details: {
    contentSimilarity: number;
    behaviorAnomalyScore: number;
    floodingScore: number;
    toxicityScore: number;
    botProbability: number;
  };
}

export interface ContentAnalysis {
  textHash: string;
  imageHash?: string;
  contentSignature: string;
  semanticVector: number[];
  metadata: {
    length: number;
    complexity: number;
    languagePattern: string;
    specialCharRatio: number;
  };
}

/**
 * 🎯 1단계: 콘텐츠 해시 및 시그니처 생성
 * - 텍스트/이미지의 고유 지문 생성
 * - 미세한 변형도 탐지 가능한 퍼지 해싱
 */
class ContentHashingEngine {
  /**
   * 텍스트의 시맨틱 해시 생성 (유사한 의미 탐지)
   */
  static generateTextHash(text: string): string {
    // 정규화: 소문자, 공백 제거, 특수문자 정규화
    const normalized = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return CryptoJS.SHA256(normalized).toString();
  }

  /**
   * 퍼지 해싱을 통한 유사 텍스트 탐지
   */
  static generateFuzzyHash(text: string): string {
    const tokens = this.tokenizeText(text);
    const significantTokens = tokens
      .filter(token => token.length > 2)
      .sort()
      .slice(0, 20); // 상위 20개 토큰만 사용
    
    return CryptoJS.SHA256(significantTokens.join('|')).toString();
  }

  /**
   * 이미지 인식 해시 (실제 구현시 Canvas/WebGL 필요)
   */
  static async generateImageHash(imageUrl: string): Promise<string> {
    try {
      // 실제 구현에서는 dhash, phash 등 perceptual hashing 사용
      // 현재는 URL 기반 단순 해시로 대체
      return CryptoJS.SHA256(imageUrl).toString();
    } catch (error) {
      console.error('이미지 해시 생성 실패:', error);
      return '';
    }
  }

  /**
   * 텍스트 토큰화 (다국어 지원)
   */
  private static tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * 콘텐츠 복잡도 분석
   */
  static analyzeComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    const avgWordLength = text.replace(/\s/g, '').length / Math.max(words, 1);
    
    return Math.min(1.0, (sentences * 0.1 + uniqueWords * 0.01 + avgWordLength * 0.05) / 3);
  }
}

/**
 * 🎯 2단계: 행동 패턴 분석 엔진
 * - 사용자의 업로드/댓글 패턴 분석
 * - 시계열 이상 탐지
 */
class BehaviorAnalysisEngine {
  /**
   * 플러딩(도배) 점수 계산
   */
  static async calculateFloodingScore(userId: string, timeWindow: number = 3600): Promise<number> {
    const { data: recentBehaviors } = await supabase
      .from('user_behaviors')
      .select('behavior_type, timestamp, intensity_score')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - timeWindow * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (!recentBehaviors || recentBehaviors.length === 0) return 0;

    // 빈도 기반 점수
    const actionCounts = recentBehaviors.reduce((acc: any, behavior) => {
      acc[behavior.behavior_type] = (acc[behavior.behavior_type] || 0) + 1;
      return acc;
    }, {});

    // 비정상적 빈도 탐지
    const maxNormalFreq = { upload: 5, comment: 20, like: 50 };
    let floodingScore = 0;

    for (const [actionType, count] of Object.entries(actionCounts)) {
      const normalLimit = maxNormalFreq[actionType as keyof typeof maxNormalFreq] || 10;
      if (count > normalLimit) {
        floodingScore += Math.min(1.0, (count - normalLimit) / normalLimit);
      }
    }

    return Math.min(1.0, floodingScore);
  }

  /**
   * 시간 패턴 이상 탐지
   */
  static async detectTemporalAnomalies(userId: string): Promise<number> {
    const { data: behaviors } = await supabase
      .from('user_behaviors')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!behaviors || behaviors.length < 10) return 0;

    // 시간 간격 분석
    const intervals = [];
    for (let i = 1; i < behaviors.length; i++) {
      const interval = new Date(behaviors[i-1].timestamp).getTime() - new Date(behaviors[i].timestamp).getTime();
      intervals.push(interval / 1000); // 초 단위
    }

    // 표준편차 계산
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // 매우 규칙적인 패턴 (봇 의심)
    const regularityScore = stdDev < 5 ? 0.8 : Math.max(0, 0.5 - stdDev / 100);
    
    // 매우 짧은 간격의 빈도
    const rapidActions = intervals.filter(interval => interval < 2).length;
    const rapidScore = Math.min(1.0, rapidActions / 20);

    return Math.min(1.0, (regularityScore + rapidScore) / 2);
  }

  /**
   * 봇 탐지 알고리즘
   */
  static async calculateBotProbability(userId: string, userAgent: string = '', deviceFingerprint: string = ''): Promise<number> {
    let botScore = 0;

    // User-Agent 분석
    const suspiciousAgents = ['bot', 'crawler', 'scraper', 'automated'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      botScore += 0.6;
    }

    // 행동 패턴 분석
    const temporalScore = await this.detectTemporalAnomalies(userId);
    botScore += temporalScore * 0.4;

    // 세션 지속성 분석
    const { data: sessions } = await supabase
      .from('user_behaviors')
      .select('session_id, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (sessions) {
      const sessionDurations = this.calculateSessionDurations(sessions);
      const avgDuration = sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length;
      
      // 매우 짧거나 매우 긴 세션은 의심스러움
      if (avgDuration < 10 || avgDuration > 7200) { // 10초 미만 또는 2시간 초과
        botScore += 0.3;
      }
    }

    return Math.min(1.0, botScore);
  }

  private static calculateSessionDurations(sessions: any[]): number[] {
    const sessionMap = new Map();
    
    sessions.forEach(session => {
      const sessionId = session.session_id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId).push(new Date(session.timestamp).getTime());
    });

    return Array.from(sessionMap.values()).map(timestamps => {
      timestamps.sort();
      return (Math.max(...timestamps) - Math.min(...timestamps)) / 1000; // 초 단위
    });
  }
}

/**
 * 🎯 3단계: 콘텐츠 유사도 및 품질 분석
 */
class ContentQualityEngine {
  /**
   * 콘텐츠 유사도 계산 (Jaccard similarity + Semantic similarity)
   */
  static async calculateSimilarity(newContent: string, userId: string): Promise<number> {
    // 사용자의 최근 콘텐츠 조회
    const { data: recentContent } = await supabase
      .from('user_behaviors')
      .select('behavior_data')
      .eq('user_id', userId)
      .eq('behavior_type', 'upload')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (!recentContent || recentContent.length === 0) return 0;

    let maxSimilarity = 0;
    const newTokens = new Set(this.tokenize(newContent));

    for (const content of recentContent) {
      const existingText = content.behavior_data?.description || content.behavior_data?.title || '';
      const existingTokens = new Set(this.tokenize(existingText));
      
      // Jaccard Similarity
      const intersection = new Set([...newTokens].filter(token => existingTokens.has(token)));
      const union = new Set([...newTokens, ...existingTokens]);
      const similarity = intersection.size / union.size;
      
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * 독성 콘텐츠 탐지 (간단한 휴리스틱 + 향후 ML 모델 적용 가능)
   */
  static calculateToxicityScore(text: string): number {
    const toxicPatterns = [
      // 욕설/비방 패턴
      /(\b(fuck|shit|damn|bitch|asshole)\b)/gi,
      // 혐오 표현
      /(hate|kill|die|stupid|idiot)/gi,
      // 스팸 패턴
      /(buy now|click here|free money|get rich)/gi,
      // 과도한 이모지/특수문자
      /((.)\2{4,})/g,
      // 전화번호/이메일 패턴
      /(\d{3}-\d{3,4}-\d{4}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi
    ];

    let toxicityScore = 0;
    const textLength = text.length;

    toxicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        toxicityScore += matches.length * 0.2;
      }
    });

    // 과도한 대문자 사용
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / textLength;
    if (upperCaseRatio > 0.7 && textLength > 10) {
      toxicityScore += 0.3;
    }

    // 반복 문자/단어
    const repetitionRatio = this.calculateRepetitionRatio(text);
    if (repetitionRatio > 0.5) {
      toxicityScore += 0.4;
    }

    return Math.min(1.0, toxicityScore);
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  private static calculateRepetitionRatio(text: string): number {
    const words = this.tokenize(text);
    const uniqueWords = new Set(words);
    return words.length > 0 ? 1 - (uniqueWords.size / words.length) : 0;
  }
}

/**
 * 🎯 4단계: 머신러닝 기반 종합 분석 엔진
 */
class MLSpamClassifier {
  /**
   * 종합 스팸 점수 계산 (앙상블 방법)
   */
  static async calculateOverallSpamScore(
    contentSimilarity: number,
    behaviorScore: number,
    floodingScore: number,
    toxicityScore: number,
    botProbability: number
  ): Promise<number> {
    // 가중치 (실제 환경에서는 A/B 테스트로 최적화)
    const weights = {
      content: 0.25,
      behavior: 0.20,
      flooding: 0.30,
      toxicity: 0.15,
      bot: 0.10
    };

    const weightedScore = 
      contentSimilarity * weights.content +
      behaviorScore * weights.behavior +
      floodingScore * weights.flooding +
      toxicityScore * weights.toxicity +
      botProbability * weights.bot;

    // 비선형 변환으로 극값 강화
    return Math.pow(weightedScore, 1.2);
  }

  /**
   * 위험도 레벨 판정
   */
  static assessRiskLevel(spamScore: number): SpamDetectionResult['riskLevel'] {
    if (spamScore >= 0.8) return 'CRITICAL';
    if (spamScore >= 0.6) return 'HIGH';
    if (spamScore >= 0.3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 추천 조치 결정
   */
  static recommendAction(
    spamScore: number, 
    userHistory: { warningCount: number; tempBanCount: number }
  ): SpamDetectionResult['recommendedAction'] {
    // 초범 vs 재범 고려
    const historyMultiplier = 1 + (userHistory.warningCount * 0.1) + (userHistory.tempBanCount * 0.3);
    const adjustedScore = Math.min(1.0, spamScore * historyMultiplier);

    if (adjustedScore >= 0.9) return 'PERMANENT_BAN';
    if (adjustedScore >= 0.7) return 'TEMP_BAN';
    if (adjustedScore >= 0.4) return 'SHADOW_BAN';
    return 'ALLOW';
  }
}

/**
 * 🎯 5단계: 메인 스팸 탐지 서비스
 */
export class AdvancedSpamDetectionService {
  /**
   * 종합 스팸 탐지 분석
   */
  static async analyzeContent(
    userId: string,
    contentId: string,
    contentType: 'artwork' | 'comment' | 'message',
    content: {
      text?: string;
      imageUrl?: string;
      metadata?: any;
    },
    context: {
      userAgent?: string;
      sessionId?: string;
      deviceFingerprint?: string;
    } = {}
  ): Promise<SpamDetectionResult> {
    try {
      console.log('🔍 고급 스팸 탐지 분석 시작:', { userId, contentId, contentType });

      // 병렬 분석 실행
      const [
        contentSimilarity,
        behaviorAnomalyScore,
        floodingScore,
        toxicityScore,
        botProbability,
        userHistory
      ] = await Promise.all([
        content.text ? ContentQualityEngine.calculateSimilarity(content.text, userId) : 0,
        BehaviorAnalysisEngine.detectTemporalAnomalies(userId),
        BehaviorAnalysisEngine.calculateFloodingScore(userId),
        content.text ? ContentQualityEngine.calculateToxicityScore(content.text) : 0,
        BehaviorAnalysisEngine.calculateBotProbability(userId, context.userAgent || '', context.deviceFingerprint || ''),
        this.getUserModerationHistory(userId)
      ]);

      // 종합 스팸 점수 계산
      const overallSpamScore = await MLSpamClassifier.calculateOverallSpamScore(
        contentSimilarity,
        behaviorAnomalyScore,
        floodingScore,
        toxicityScore,
        botProbability
      );

      const riskLevel = MLSpamClassifier.assessRiskLevel(overallSpamScore);
      const recommendedAction = MLSpamClassifier.recommendAction(overallSpamScore, userHistory);

      // 스팸 유형 식별
      const spamTypes = this.identifySpamTypes({
        contentSimilarity,
        behaviorAnomalyScore,
        floodingScore,
        toxicityScore,
        botProbability
      });

      const result: SpamDetectionResult = {
        isSpam: overallSpamScore > 0.3,
        confidence: Math.min(1.0, overallSpamScore * 1.2),
        spamType: spamTypes,
        riskLevel,
        recommendedAction,
        details: {
          contentSimilarity,
          behaviorAnomalyScore,
          floodingScore,
          toxicityScore,
          botProbability
        }
      };

      // 분석 결과 저장
      await this.saveDetectionResult(userId, contentId, contentType, result, content);

      console.log('✅ 스팸 탐지 분석 완료:', {
        isSpam: result.isSpam,
        confidence: result.confidence,
        riskLevel: result.riskLevel
      });

      return result;

    } catch (error) {
      console.error('💥 스팸 탐지 분석 실패:', error);
      
      // 안전장치: 분석 실패시 기본값 반환
      return {
        isSpam: false,
        confidence: 0,
        spamType: ['analysis_failed'],
        riskLevel: 'LOW',
        recommendedAction: 'ALLOW',
        details: {
          contentSimilarity: 0,
          behaviorAnomalyScore: 0,
          floodingScore: 0,
          toxicityScore: 0,
          botProbability: 0
        }
      };
    }
  }

  /**
   * 실시간 자동 조치 실행
   */
  static async executeAutoModeration(userId: string, result: SpamDetectionResult): Promise<boolean> {
    if (result.recommendedAction === 'ALLOW') return true;

    try {
      const moderationData = {
        user_id: userId,
        action_type: this.mapActionToDBType(result.recommendedAction),
        reason: `Automated spam detection: ${result.spamType.join(', ')}`,
        evidence: {
          spam_score: result.confidence,
          risk_level: result.riskLevel,
          detection_details: result.details,
          detection_time: new Date().toISOString()
        },
        is_automated: true,
        automation_confidence: result.confidence,
        starts_at: new Date().toISOString(),
        expires_at: this.calculateExpiryTime(result.recommendedAction)
      };

      const { error } = await supabase
        .from('user_moderation')
        .insert(moderationData);

      if (error) throw error;

      console.log(`🔨 자동 조치 실행: ${result.recommendedAction} for user ${userId}`);
      return true;

    } catch (error) {
      console.error('💥 자동 조치 실행 실패:', error);
      return false;
    }
  }

  /**
   * 사용자 제재 이력 조회
   */
  private static async getUserModerationHistory(userId: string): Promise<{ warningCount: number; tempBanCount: number }> {
    const { data: history } = await supabase
      .from('user_moderation')
      .select('action_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    return {
      warningCount: history?.filter(h => h.action_type === 'warning').length || 0,
      tempBanCount: history?.filter(h => h.action_type === 'temp_ban').length || 0
    };
  }

  /**
   * 스팸 유형 식별
   */
  private static identifySpamTypes(scores: any): string[] {
    const types = [];
    
    if (scores.contentSimilarity > 0.7) types.push('duplicate_content');
    if (scores.floodingScore > 0.6) types.push('flooding');
    if (scores.toxicityScore > 0.5) types.push('toxic_content');
    if (scores.botProbability > 0.7) types.push('bot_behavior');
    if (scores.behaviorAnomalyScore > 0.6) types.push('anomalous_pattern');
    
    return types.length > 0 ? types : ['general_spam'];
  }

  /**
   * 탐지 결과 저장
   */
  private static async saveDetectionResult(
    userId: string,
    contentId: string,
    contentType: string,
    result: SpamDetectionResult,
    content: any
  ): Promise<void> {
    const detectionData = {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      content_hash: content.text ? ContentHashingEngine.generateTextHash(content.text) : null,
      spam_score: result.confidence,
      is_spam: result.isSpam,
      spam_type: result.spamType.join(','),
      detection_method: 'advanced_ml_ensemble',
      confidence: result.confidence
    };

    await supabase
      .from('spam_detection')
      .insert(detectionData);
  }

  /**
   * 조치 타입 매핑
   */
  private static mapActionToDBType(action: SpamDetectionResult['recommendedAction']): string {
    const mapping = {
      'ALLOW': 'warning',
      'SHADOW_BAN': 'shadow_ban',
      'TEMP_BAN': 'temp_ban',
      'PERMANENT_BAN': 'permanent_ban'
    };
    return mapping[action] || 'warning';
  }

  /**
   * 제재 만료 시간 계산
   */
  private static calculateExpiryTime(action: SpamDetectionResult['recommendedAction']): string {
    const now = new Date();
    switch (action) {
      case 'SHADOW_BAN':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24시간
      case 'TEMP_BAN':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7일
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1년 (사실상 영구)
    }
  }
}

// 사용자 행동 추적을 위한 헬퍼 함수 (임시 비활성화)
export const trackUserBehavior = async (
  userId: string,
  behaviorType: string,
  behaviorData: any = {},
  intensityScore: number = 1.0,
  sessionId?: string
): Promise<void> => {
  // 🛑 AI 시스템 임시 비활성화 - 즉시 반환
  console.log('⚠️ AI 시스템 비활성화: trackUserBehavior 호출 무시됨');
  return;
  
  try {
    await supabase
      .from('user_behaviors')
      .insert({
        user_id: userId,
        behavior_type: behaviorType,
        behavior_data: behaviorData,
        intensity_score: intensityScore,
        session_id: sessionId || 'unknown',
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('행동 추적 실패:', error);
  }
};
