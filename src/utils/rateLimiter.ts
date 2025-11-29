/**
 * Rate Limiter - API 호출 제한
 * 스팸 방지 및 서버 부하 감소
 */

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
  errorMessage?: string;
}

interface RateLimitEntry {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Rate limit 체크
   */
  canProceed(
    action: string,
    config: RateLimitConfig
  ): { allowed: boolean; retryAfter?: number; message?: string } {
    const now = Date.now();
    const key = action;
    
    // 기존 엔트리 가져오기
    let entry = this.limits.get(key);
    
    if (!entry) {
      entry = { timestamps: [], blocked: false };
      this.limits.set(key, entry);
    }

    // 블록 상태 확인
    if (entry.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
        return {
          allowed: false,
          retryAfter,
          message: config.errorMessage || `Too many requests. Retry after ${retryAfter}s`,
        };
      } else {
        // 블록 해제
        entry.blocked = false;
        entry.blockedUntil = undefined;
        entry.timestamps = [];
      }
    }

    // 시간 윈도우 내 호출만 필터링
    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < config.windowMs
    );

    // 제한 확인
    if (entry.timestamps.length >= config.maxCalls) {
      // 제한 초과 - 블록 처리
      entry.blocked = true;
      entry.blockedUntil = now + config.windowMs;
      
      const retryAfter = Math.ceil(config.windowMs / 1000);
      return {
        allowed: false,
        retryAfter,
        message: config.errorMessage || `Rate limit exceeded. Retry after ${retryAfter}s`,
      };
    }

    // 허용 - 타임스탬프 기록
    entry.timestamps.push(now);
    
    return { allowed: true };
  }

  /**
   * Rate limit 초기화 (테스트용)
   */
  reset(action?: string) {
    if (action) {
      this.limits.delete(action);
    } else {
      this.limits.clear();
    }
  }

  /**
   * 현재 상태 가져오기 (디버깅용)
   */
  getStats(action: string) {
    const entry = this.limits.get(action);
    if (!entry) return null;

    return {
      callsInWindow: entry.timestamps.length,
      blocked: entry.blocked,
      blockedUntil: entry.blockedUntil,
    };
  }
}

// 싱글톤 인스턴스
const rateLimiter = new RateLimiter();

// Rate limit 설정
export const RATE_LIMITS = {
  // 작품 업로드: 5회/분
  ARTWORK_UPLOAD: {
    maxCalls: 5,
    windowMs: 60 * 1000,
    errorMessage: 'Too many uploads. Please wait 1 minute.',
  },
  
  // 좋아요: 30회/분
  ARTWORK_LIKE: {
    maxCalls: 30,
    windowMs: 60 * 1000,
    errorMessage: 'Too many likes. Please slow down.',
  },
  
  // 북마크: 30회/분
  ARTWORK_BOOKMARK: {
    maxCalls: 30,
    windowMs: 60 * 1000,
    errorMessage: 'Too many bookmarks. Please slow down.',
  },
  
  // 댓글: 10회/분
  COMMENT_POST: {
    maxCalls: 10,
    windowMs: 60 * 1000,
    errorMessage: 'Too many comments. Please wait 1 minute.',
  },
  
  // 메시지: 20회/분
  MESSAGE_SEND: {
    maxCalls: 20,
    windowMs: 60 * 1000,
    errorMessage: 'Too many messages. Please slow down.',
  },
  
  // 검색: 30회/분
  SEARCH: {
    maxCalls: 30,
    windowMs: 60 * 1000,
    errorMessage: 'Too many searches. Please slow down.',
  },
  
  // 프로필 업데이트: 5회/분
  PROFILE_UPDATE: {
    maxCalls: 5,
    windowMs: 60 * 1000,
    errorMessage: 'Too many profile updates. Please wait 1 minute.',
  },
  
  // 팔로우: 20회/분
  FOLLOW: {
    maxCalls: 20,
    windowMs: 60 * 1000,
    errorMessage: 'Too many follow requests. Please slow down.',
  },
} as const;

/**
 * Rate limit 체크 함수
 */
export function checkRateLimit(
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; retryAfter?: number; message?: string } {
  const config = RATE_LIMITS[action];
  return rateLimiter.canProceed(action, config);
}

/**
 * Rate limit 체크 후 에러 던지기
 */
export function enforceRateLimit(action: keyof typeof RATE_LIMITS): void {
  const result = checkRateLimit(action);
  
  if (!result.allowed) {
    const error = new Error(result.message);
    error.name = 'RateLimitError';
    (error as any).retryAfter = result.retryAfter;
    throw error;
  }
}

/**
 * 사용자별 Rate Limiting (고급)
 */
export function checkUserRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; retryAfter?: number; message?: string } {
  const config = RATE_LIMITS[action];
  const key = `${userId}:${action}`;
  return rateLimiter.canProceed(key, config);
}

export default rateLimiter;

