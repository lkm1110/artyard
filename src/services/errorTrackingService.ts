/**
 * Error Tracking Service (Sentry for Supabase)
 * 프로덕션 에러 추적 및 보고
 * 
 * NOTE: Sentry는 RN 업그레이드 후 추가 예정
 */

import Constants from 'expo-constants';
// import * as Sentry from '@sentry/react-native'; // Hermes 호환성 문제
interface ErrorLog {
  timestamp: number;
  error: string;
  context?: string;
  userId?: string;
  screen?: string;
  additionalData?: Record<string, any>;
}

class ErrorTrackingService {
  private errorQueue: ErrorLog[] = [];
  private maxQueueSize = 100;
  private enabled = true;

  /**
   * 에러 캡처 및 로깅
   */
  captureError(
    error: Error | string,
    context?: string,
    additionalData?: Record<string, any>
  ) {
    if (!this.enabled) return;

    const errorLog: ErrorLog = {
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : error,
      context,
      additionalData,
    };

    // 개발 환경에서는 콘솔에 출력
    if (__DEV__) {
      console.error('🔴 Error Tracked:', {
        ...errorLog,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // 에러 큐에 추가
    this.errorQueue.push(errorLog);

    // 큐 크기 제한
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Sentry로 전송 (프로덕션) - RN 업그레이드 후 추가 예정
    // if (!__DEV__) {
    //   try {
    //     Sentry.captureException(error instanceof Error ? error : new Error(error), {
    //       contexts: {
    //         custom: {
    //           context,
    //           ...additionalData,
    //         },
    //       },
    //     });
    //   } catch (e) {
    //     console.warn('Sentry capture failed:', e);
    //   }
    // }

    // Supabase Edge Function으로 로그 전송 (옵션)
    this.sendToSupabase(errorLog);
  }

  /**
   * 예외 발생 보고
   */
  captureException(error: Error, context?: string) {
    this.captureError(error, context, {
      stack: error.stack,
      name: error.name,
    });
  }

  /**
   * 사용자 정보 설정
   */
  setUser(userId: string, email?: string) {
    // Sentry는 RN 업그레이드 후 추가 예정
    console.log('📝 User set for error tracking:', userId);
  }

  /**
   * 컨텍스트 설정 (현재 화면 등)
   */
  setContext(key: string, value: Record<string, any>) {
    // Sentry는 RN 업그레이드 후 추가 예정
  }

  /**
   * Breadcrumb 추가 (에러 발생 전 사용자 행동 추적)
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!this.enabled) return;

    if (__DEV__) {
      console.log('🍞 Breadcrumb:', message, category, data);
    }
  }

  /**
   * Supabase Edge Function으로 에러 로그 전송
   */
  private async sendToSupabase(errorLog: ErrorLog) {
    // 프로덕션에서만 전송
    if (__DEV__) return;

    try {
      // TODO: Supabase Edge Function 호출
      // await supabase.functions.invoke('log-error', {
      //   body: errorLog,
      // });
    } catch (err) {
      // 로깅 실패해도 앱은 계속 동작
      console.warn('Failed to send error log:', err);
    }
  }

  /**
   * 에러 통계 가져오기 (디버깅용)
   */
  getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      recentErrors: this.errorQueue.slice(-10),
    };
  }

  /**
   * 에러 트래킹 활성화/비활성화
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const errorTracker = new ErrorTrackingService();

// 편의 함수들
export const captureError = (
  error: Error | string,
  context?: string,
  additionalData?: Record<string, any>
) => errorTracker.captureError(error, context, additionalData);

export const captureException = (error: Error, context?: string) =>
  errorTracker.captureException(error, context);

export const setErrorUser = (userId: string, email?: string) =>
  errorTracker.setUser(userId, email);

export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>
) => errorTracker.addBreadcrumb(message, category, data);

