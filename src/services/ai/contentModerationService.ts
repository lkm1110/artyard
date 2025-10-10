/**
 * 🛡️ 고급 콘텐츠 조정 AI 시스템
 * 자동화된 신고 처리 및 부적절 콘텐츠 탐지
 */

import { supabase } from '../supabase';
import { AdvancedSpamDetectionService } from './spamDetectionService';

export interface ModerationRequest {
  contentId: string;
  contentType: 'artwork' | 'comment' | 'profile' | 'message';
  reporterId?: string;
  reportReason: string;
  reportCategory: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'violence' | 'fake' | 'other';
  content: {
    text?: string;
    imageUrl?: string;
    metadata?: any;
  };
  priority?: 1 | 2 | 3 | 4 | 5;
}

export interface ModerationResult {
  contentId: string;
  aiDecision: 'APPROVE' | 'REVIEW' | 'REMOVE' | 'RESTRICT';
  confidence: number;
  toxicityScore: number;
  inappropriatenessScore: number;
  violationTypes: string[];
  recommendedAction: string;
  humanReviewRequired: boolean;
  estimatedReviewTime: number; // minutes
}

/**
 * 🎯 독성 콘텐츠 탐지 엔진
 */
class ToxicityDetectionEngine {
  /**
   * 텍스트 독성 분석
   */
  static analyzeToxicity(text: string): {score: number, violations: string[]} {
    const violations: string[] = [];
    let toxicityScore = 0;

    // 욕설 및 비방 탐지
    const profanityPatterns = [
      // 영어 욕설
      /\b(fuck|shit|damn|bitch|asshole|bastard|crap)\b/gi,
      // 혐오 표현
      /\b(hate|kill|die|murder|stupid|idiot|moron|retard)\b/gi,
      // 괴롭힘 표현
      /\b(loser|pathetic|worthless|disgusting)\b/gi
    ];

    profanityPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        violations.push('profanity');
        toxicityScore += matches.length * 0.3;
      }
    });

    // 성적 콘텐츠 탐지
    const sexualPatterns = [
      /\b(sex|porn|nude|naked|xxx|adult)\b/gi,
      /\b(breast|penis|vagina|ass|boobs)\b/gi
    ];

    sexualPatterns.forEach(pattern => {
      if (text.match(pattern)) {
        violations.push('sexual_content');
        toxicityScore += 0.4;
      }
    });

    // 폭력 관련 콘텐츠
    const violencePatterns = [
      /\b(violence|violent|attack|assault|abuse|hurt|harm)\b/gi,
      /\b(weapon|gun|knife|bomb|explosive)\b/gi
    ];

    violencePatterns.forEach(pattern => {
      if (text.match(pattern)) {
        violations.push('violence');
        toxicityScore += 0.5;
      }
    });

    // 개인정보 노출
    const privacyPatterns = [
      /\b\d{3}-\d{3,4}-\d{4}\b/g, // 전화번호
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // 이메일
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g // 카드번호 형태
    ];

    privacyPatterns.forEach(pattern => {
      if (text.match(pattern)) {
        violations.push('privacy_violation');
        toxicityScore += 0.6;
      }
    });

    return {
      score: Math.min(1.0, toxicityScore),
      violations: Array.from(new Set(violations))
    };
  }

  /**
   * 이미지 부적절성 분석 (기본 휴리스틱)
   */
  static async analyzeImageContent(imageUrl: string): Promise<{score: number, violations: string[]}> {
    // 실제 구현에서는 Google Vision API, AWS Rekognition 등 사용
    // 현재는 URL 기반 간단한 분석
    
    const violations: string[] = [];
    let inappropriatenessScore = 0;

    // URL에서 부적절한 키워드 탐지
    const suspiciousKeywords = ['nude', 'sexy', 'adult', 'porn', 'xxx'];
    const urlLower = imageUrl.toLowerCase();
    
    suspiciousKeywords.forEach(keyword => {
      if (urlLower.includes(keyword)) {
        violations.push('inappropriate_image');
        inappropriatenessScore += 0.5;
      }
    });

    // 파일 확장자 검증
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExtensions.some(ext => urlLower.endsWith(ext))) {
      violations.push('invalid_format');
      inappropriatenessScore += 0.2;
    }

    return {
      score: Math.min(1.0, inappropriatenessScore),
      violations
    };
  }

  /**
   * 저작권 침해 탐지 (기본)
   */
  static analyzeCopyrightViolation(content: any): {score: number, violations: string[]} {
    const violations: string[] = [];
    let copyrightScore = 0;

    // 저작권 관련 키워드
    const copyrightIndicators = [
      'copyright', '©', 'all rights reserved', 'unauthorized use',
      'watermark', 'getty images', 'shutterstock', 'stock photo'
    ];

    const text = `${content.title} ${content.description}`.toLowerCase();
    
    copyrightIndicators.forEach(indicator => {
      if (text.includes(indicator.toLowerCase())) {
        violations.push('copyright_concern');
        copyrightScore += 0.3;
      }
    });

    return {
      score: Math.min(1.0, copyrightScore),
      violations
    };
  }
}

/**
 * 🎯 자동 조정 결정 엔진
 */
class AutoModerationEngine {
  /**
   * AI 기반 조정 결정
   */
  static makeDecision(
    toxicityScore: number,
    inappropriatenessScore: number,
    spamScore: number,
    userHistory: {strikes: number, reputation: number}
  ): ModerationResult['aiDecision'] {
    
    const overallScore = Math.max(toxicityScore, inappropriatenessScore, spamScore);
    
    // 사용자 이력 고려
    const historyMultiplier = 1 + (userHistory.strikes * 0.2) - (userHistory.reputation * 0.1);
    const adjustedScore = Math.min(1.0, overallScore * historyMultiplier);

    if (adjustedScore >= 0.8) return 'REMOVE';
    if (adjustedScore >= 0.6) return 'RESTRICT';
    if (adjustedScore >= 0.3) return 'REVIEW';
    return 'APPROVE';
  }

  /**
   * 인간 검토 필요성 판단
   */
  static requiresHumanReview(
    aiDecision: ModerationResult['aiDecision'],
    confidence: number,
    violationTypes: string[]
  ): boolean {
    // 고위험 케이스
    if (violationTypes.includes('violence') || violationTypes.includes('copyright_concern')) {
      return true;
    }

    // 낮은 신뢰도
    if (confidence < 0.7 && aiDecision !== 'APPROVE') {
      return true;
    }

    // 경계선 케이스
    if (aiDecision === 'REVIEW') {
      return true;
    }

    return false;
  }

  /**
   * 예상 검토 시간 계산
   */
  static estimateReviewTime(
    contentType: string,
    violationTypes: string[],
    priority: number
  ): number {
    let baseTime = {
      artwork: 5,
      comment: 2,
      profile: 3,
      message: 1
    }[contentType] || 3;

    // 복잡성에 따른 시간 조정
    if (violationTypes.includes('copyright_concern')) baseTime *= 3;
    if (violationTypes.includes('violence')) baseTime *= 2;
    
    // 우선순위에 따른 조정
    const priorityMultiplier = Math.max(0.1, (6 - priority) / 5);
    
    return Math.round(baseTime * priorityMultiplier);
  }
}

/**
 * 🎯 신고 처리 워크플로우 엔진
 */
class ReportProcessingEngine {
  /**
   * 신고 우선순위 계산
   */
  static calculatePriority(request: ModerationRequest): number {
    let priority = 3; // 기본 우선순위

    // 카테고리별 우선순위 조정
    const categoryPriorities = {
      violence: 5,
      harassment: 4,
      inappropriate: 3,
      spam: 2,
      copyright: 3,
      fake: 2,
      other: 1
    };

    priority = categoryPriorities[request.reportCategory] || 3;

    // 신고자 신뢰도 고려
    // TODO: 신고자의 과거 신고 정확도 기반 조정

    return Math.max(1, Math.min(5, priority));
  }

  /**
   * 중복 신고 탐지
   */
  static async checkDuplicateReports(contentId: string, timeWindow: number = 24): Promise<number> {
    const { data: recentReports } = await supabase
      .from('content_moderation')
      .select('id')
      .eq('content_id', contentId)
      .gte('created_at', new Date(Date.now() - timeWindow * 60 * 60 * 1000).toISOString());

    return recentReports?.length || 0;
  }

  /**
   * 신고자 신뢰도 확인
   */
  static async getReporterCredibility(reporterId: string): Promise<{accuracy: number, totalReports: number}> {
    const { data: reportHistory } = await supabase
      .from('content_moderation')
      .select('moderator_decision, ai_recommendation')
      .eq('reporter_id', reporterId)
      .not('moderator_decision', 'is', null);

    if (!reportHistory || reportHistory.length === 0) {
      return { accuracy: 0.5, totalReports: 0 }; // 중립적 초기값
    }

    const accurateReports = reportHistory.filter(report => 
      (report.moderator_decision === 'removed' && report.ai_recommendation === 'REMOVE') ||
      (report.moderator_decision === 'approved' && report.ai_recommendation === 'APPROVE')
    ).length;

    return {
      accuracy: accurateReports / reportHistory.length,
      totalReports: reportHistory.length
    };
  }
}

/**
 * 🎯 메인 콘텐츠 조정 서비스
 */
export class ContentModerationService {
  /**
   * 종합 콘텐츠 분석 및 조정
   */
  static async analyzeContent(request: ModerationRequest): Promise<ModerationResult> {
    console.log('🛡️ 콘텐츠 조정 분석 시작:', request.contentId);

    try {
      // 1단계: 기본 분석
      const [toxicityResult, imageResult, copyrightResult] = await Promise.all([
        request.content.text ? 
          ToxicityDetectionEngine.analyzeToxicity(request.content.text) : 
          { score: 0, violations: [] },
        request.content.imageUrl ? 
          ToxicityDetectionEngine.analyzeImageContent(request.content.imageUrl) :
          { score: 0, violations: [] },
        ToxicityDetectionEngine.analyzeCopyrightViolation(request.content)
      ]);

      // 2단계: 스팸 분석
      const spamResult = request.content.text || request.content.imageUrl ? 
        await AdvancedSpamDetectionService.analyzeContent(
          request.reporterId || 'system',
          request.contentId,
          request.contentType,
          request.content
        ) : { confidence: 0 };

      // 3단계: 사용자 이력 조회
      const userHistory = await this.getUserModerationHistory(request.contentId, request.contentType);

      // 4단계: AI 결정
      const allViolations = [
        ...toxicityResult.violations,
        ...imageResult.violations,
        ...copyrightResult.violations
      ];

      const aiDecision = AutoModerationEngine.makeDecision(
        toxicityResult.score,
        imageResult.score,
        spamResult.confidence,
        userHistory
      );

      const overallConfidence = this.calculateOverallConfidence([
        toxicityResult.score,
        imageResult.score,
        copyrightResult.score,
        spamResult.confidence
      ]);

      const humanReviewRequired = AutoModerationEngine.requiresHumanReview(
        aiDecision,
        overallConfidence,
        allViolations
      );

      const estimatedReviewTime = AutoModerationEngine.estimateReviewTime(
        request.contentType,
        allViolations,
        request.priority || 3
      );

      const result: ModerationResult = {
        contentId: request.contentId,
        aiDecision,
        confidence: overallConfidence,
        toxicityScore: toxicityResult.score,
        inappropriatenessScore: imageResult.score,
        violationTypes: allViolations,
        recommendedAction: this.generateRecommendedAction(aiDecision, allViolations),
        humanReviewRequired,
        estimatedReviewTime
      };

      // 5단계: 결과 저장
      await this.saveModerationResult(request, result);

      // 6단계: 자동 조치 실행 (필요시)
      if (!humanReviewRequired && aiDecision !== 'APPROVE') {
        await this.executeAutoModeration(request, result);
      }

      console.log('✅ 콘텐츠 조정 분석 완료:', {
        decision: aiDecision,
        confidence: overallConfidence,
        humanReview: humanReviewRequired
      });

      return result;

    } catch (error) {
      console.error('💥 콘텐츠 조정 분석 실패:', error);
      
      // 안전장치: 인간 검토로 에스컬레이션
      return {
        contentId: request.contentId,
        aiDecision: 'REVIEW',
        confidence: 0,
        toxicityScore: 0,
        inappropriatenessScore: 0,
        violationTypes: ['analysis_failed'],
        recommendedAction: 'Escalate to human review due to analysis failure',
        humanReviewRequired: true,
        estimatedReviewTime: 30
      };
    }
  }

  /**
   * 신고 접수 및 처리
   */
  static async processReport(request: ModerationRequest): Promise<{reportId: string, priority: number}> {
    console.log('📝 신고 접수:', request.contentId);

    try {
      // 중복 신고 체크
      const duplicateCount = await ReportProcessingEngine.checkDuplicateReports(request.contentId);
      
      // 신고자 신뢰도 확인
      const reporterCredibility = request.reporterId ? 
        await ReportProcessingEngine.getReporterCredibility(request.reporterId) :
        { accuracy: 0.5, totalReports: 0 };

      // 우선순위 계산
      const priority = ReportProcessingEngine.calculatePriority(request);

      // 신고 데이터 저장
      const { data: report, error } = await supabase
        .from('content_moderation')
        .insert({
          content_id: request.contentId,
          content_type: request.contentType,
          reporter_id: request.reporterId,
          report_reason: request.reportReason,
          report_category: request.reportCategory,
          priority,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // 자동 분석 트리거
      const analysisResult = await this.analyzeContent(request);
      
      // 고위험 케이스 즉시 에스컬레이션
      if (priority >= 4 || analysisResult.toxicityScore >= 0.8) {
        await this.escalateToHighPriority(report.id);
      }

      console.log('✅ 신고 처리 완료:', {
        reportId: report.id,
        priority,
        duplicates: duplicateCount,
        reporterAccuracy: reporterCredibility.accuracy
      });

      return {
        reportId: report.id,
        priority
      };

    } catch (error) {
      console.error('💥 신고 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 배치 콘텐츠 스캔
   */
  static async batchScanContent(
    contentType: 'artwork' | 'comment',
    limit: number = 100
  ): Promise<{scanned: number, flagged: number}> {
    console.log('🔍 배치 콘텐츠 스캔 시작:', contentType);

    let scanned = 0;
    let flagged = 0;

    try {
      const { data: contents } = await supabase
        .from(contentType === 'artwork' ? 'artworks' : 'comments')
        .select('id, title, description, created_at')
        .is('moderation_status', null) // 아직 스캔되지 않은 콘텐츠
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!contents) return { scanned: 0, flagged: 0 };

      for (const content of contents) {
        try {
          const request: ModerationRequest = {
            contentId: content.id,
            contentType: contentType as any,
            reportReason: 'Automated batch scan',
            reportCategory: 'other',
            content: {
              text: `${content.title || ''} ${content.description || ''}`.trim()
            }
          };

          const result = await this.analyzeContent(request);
          scanned++;

          if (result.aiDecision !== 'APPROVE') {
            flagged++;
          }

          // 결과를 콘텐츠에 저장
          await supabase
            .from(contentType === 'artwork' ? 'artworks' : 'comments')
            .update({
              moderation_status: result.aiDecision.toLowerCase(),
              moderation_score: result.confidence
            })
            .eq('id', content.id);

        } catch (error) {
          console.error(`콘텐츠 ${content.id} 스캔 실패:`, error);
        }
      }

      console.log('✅ 배치 스캔 완료:', { scanned, flagged });
      return { scanned, flagged };

    } catch (error) {
      console.error('💥 배치 스캔 실패:', error);
      return { scanned, flagged };
    }
  }

  /**
   * 헬퍼 함수들
   */
  private static async getUserModerationHistory(
    contentId: string, 
    contentType: string
  ): Promise<{strikes: number, reputation: number}> {
    
    // 콘텐츠 소유자 조회
    let userId = null;
    if (contentType === 'artwork') {
      const { data } = await supabase
        .from('artworks')
        .select('author_id')
        .eq('id', contentId)
        .single();
      userId = data?.author_id;
    }
    // TODO: 다른 콘텐츠 타입에 대한 소유자 조회

    if (!userId) return { strikes: 0, reputation: 1.0 };

    const { data: moderationHistory } = await supabase
      .from('user_moderation')
      .select('action_type, severity_level')
      .eq('user_id', userId)
      .eq('is_active', true);

    const strikes = moderationHistory?.length || 0;
    const avgSeverity = moderationHistory?.reduce((sum, mod) => sum + mod.severity_level, 0) / Math.max(1, strikes);
    const reputation = Math.max(0, 1.0 - (strikes * 0.1) - (avgSeverity * 0.1));

    return { strikes, reputation };
  }

  private static calculateOverallConfidence(scores: number[]): number {
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0.5;

    const maxScore = Math.max(...validScores);
    const avgScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    
    return (maxScore + avgScore) / 2;
  }

  private static generateRecommendedAction(
    decision: ModerationResult['aiDecision'],
    violations: string[]
  ): string {
    const actions = {
      APPROVE: 'No action needed',
      REVIEW: `Human review required for: ${violations.join(', ')}`,
      RESTRICT: `Restrict visibility due to: ${violations.join(', ')}`,
      REMOVE: `Remove content immediately due to: ${violations.join(', ')}`
    };

    return actions[decision] || 'Unknown action';
  }

  private static async saveModerationResult(
    request: ModerationRequest,
    result: ModerationResult
  ): Promise<void> {
    await supabase
      .from('content_moderation')
      .update({
        ai_toxicity_score: result.toxicityScore,
        ai_inappropriateness_score: result.inappropriatenessScore,
        ai_recommendation: result.aiDecision,
        status: result.humanReviewRequired ? 'pending' : 'resolved'
      })
      .eq('content_id', request.contentId)
      .eq('content_type', request.contentType);
  }

  private static async executeAutoModeration(
    request: ModerationRequest,
    result: ModerationResult
  ): Promise<void> {
    console.log(`🔨 자동 조치 실행: ${result.aiDecision} for ${request.contentId}`);

    if (result.aiDecision === 'REMOVE') {
      // 콘텐츠 숨김 처리
      const table = request.contentType === 'artwork' ? 'artworks' : 'comments';
      await supabase
        .from(table)
        .update({ is_hidden: true })
        .eq('id', request.contentId);
    }

    // 사용자에게 알림 발송 (TODO: 구현)
    // await this.notifyUser(request.contentId, result.aiDecision);
  }

  private static async escalateToHighPriority(reportId: string): Promise<void> {
    await supabase
      .from('content_moderation')
      .update({
        priority: 5,
        status: 'escalated'
      })
      .eq('id', reportId);

    // 관리자에게 즉시 알림 (TODO: 구현)
    console.log('🚨 고위험 케이스 에스컬레이션:', reportId);
  }
}
