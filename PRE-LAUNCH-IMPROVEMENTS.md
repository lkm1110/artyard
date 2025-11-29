# 🚀 출시 전 개선사항 체크리스트

**검토 완료일**: 2025-01-XX  
**대상**: ArtYard v1.0 출시 준비

---

## 🔴 필수 (출시 전 반드시 해결)

### 1. **이미지 업로드 제한 및 검증** ❌

**현재 상태**: 제한 없음
```typescript
// src/services/imageUploadService.ts
// ❌ 파일 크기, 해상도, 파일 형식 검증 없음
```

**문제점**:
- 대용량 이미지 업로드 가능 → 서버 비용 폭발
- 악의적 파일 업로드 가능
- 저화질/고화질 통제 불가

**해결 방안**:
```typescript
// src/services/imageUploadService.ts

const IMAGE_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 800,
  minHeight: 800,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 5,
};

async function validateImage(uri: string): Promise<void> {
  // 1. 파일 크기 체크
  const { size } = await getFileInfo(uri);
  if (size > IMAGE_CONSTRAINTS.maxSizeBytes) {
    throw new Error(`Image too large. Max: 10MB`);
  }
  
  // 2. 해상도 체크
  const { width, height } = await getImageDimensions(uri);
  if (width > IMAGE_CONSTRAINTS.maxWidth || height > IMAGE_CONSTRAINTS.maxHeight) {
    throw new Error(`Image resolution too high. Max: 4096x4096`);
  }
  if (width < IMAGE_CONSTRAINTS.minWidth || height < IMAGE_CONSTRAINTS.minHeight) {
    throw new Error(`Image resolution too low. Min: 800x800`);
  }
  
  // 3. 파일 형식 체크
  const mimeType = await getMimeType(uri);
  if (!IMAGE_CONSTRAINTS.allowedFormats.includes(mimeType)) {
    throw new Error(`Invalid format. Allowed: JPEG, PNG, WebP`);
  }
}

// 4. 자동 압축 (옵션)
async function compressIfNeeded(uri: string): Promise<string> {
  const { size } = await getFileInfo(uri);
  if (size > 5 * 1024 * 1024) { // 5MB 이상이면 압축
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 2048 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
  }
  return uri;
}
```

**우선순위**: 🔴 필수

---

### 2. **에러 트래킹 서비스 통합** ⚠️

**현재 상태**: Console.log만 있음
```typescript
// src/utils/errorHandler.ts
// ✅ 에러 핸들러는 있지만 전송 안 함
```

**문제점**:
- 프로덕션 에러 추적 불가
- 사용자 문제 파악 어려움
- 버그 재현 불가

**해결 방안 (Sentry 권장)**:
```bash
npm install @sentry/react-native
```

```typescript
// App.tsx
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2, // 20% 성능 추적
  beforeSend(event) {
    // 민감 정보 필터링
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});

// 전역 에러 캐처
const ErrorBoundary = Sentry.wrap(App);
```

**대안 (무료)**:
- Bugsnag (무료 티어)
- Firebase Crashlytics (무료, 설정 간단)

**우선순위**: 🔴 필수

---

### 3. **Analytics 프로덕션 통합** ⚠️

**현재 상태**: 콘솔 로깅만
```typescript
// src/services/analyticsService.ts
// TODO: Send to analytics service in production
```

**해결 방안**:

**Option A: Firebase Analytics (무료, 추천)**
```bash
npm install @react-native-firebase/analytics
```

```typescript
// src/services/analyticsService.ts
import analytics from '@react-native-firebase/analytics';

trackEvent(eventName: string, params?: Record<string, any>) {
  if (__DEV__) {
    console.log('📊', eventName, params);
  } else {
    analytics().logEvent(eventName, params);
  }
}
```

**Option B: Mixpanel (강력, 유료)**
**Option C: Amplitude (무료 티어, 추천)**

**우선순위**: 🟡 중요

---

### 4. **Rate Limiting (API 호출 제한)** ❌

**현재 상태**: 제한 없음

**문제점**:
- 무한 스크롤 남용 가능
- 스팸 업로드 방어 불가
- Supabase 비용 폭발 위험

**해결 방안**:

**클라이언트 측**:
```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private timestamps: Record<string, number[]> = {};
  
  canProceed(action: string, maxCalls: number, windowMs: number): boolean {
    const now = Date.now();
    const calls = this.timestamps[action] || [];
    
    // 시간 윈도우 내 호출 필터링
    const recentCalls = calls.filter(t => now - t < windowMs);
    
    if (recentCalls.length >= maxCalls) {
      return false; // 제한 초과
    }
    
    this.timestamps[action] = [...recentCalls, now];
    return true;
  }
}

const limiter = new RateLimiter();

// 사용 예시
if (!limiter.canProceed('artwork_upload', 5, 60000)) {
  throw new Error('Too many uploads. Please wait 1 minute.');
}
```

**서버 측 (Supabase Edge Function)**:
```typescript
// supabase/functions/rate-limit/index.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

async function checkRateLimit(userId: string, action: string) {
  const key = `rate:${userId}:${action}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1분 TTL
  }
  
  if (count > 5) {
    throw new Error('Rate limit exceeded');
  }
}
```

**우선순위**: 🟡 중요

---

### 5. **앱 버전 관리 시스템** ⚠️

**현재 상태**: app.json에 하드코딩
```json
// app.json
"version": "1.0.1",
"buildNumber": "19"
```

**문제점**:
- 강제 업데이트 불가
- 최소 지원 버전 관리 어려움
- 점진적 배포 불가

**해결 방안**:

**1단계: DB에 버전 정보 저장**
```sql
-- database/app-versions.sql
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL, -- 'ios' or 'android'
  version TEXT NOT NULL,  -- '1.0.1'
  build_number INTEGER NOT NULL,
  min_supported_version TEXT NOT NULL, -- '1.0.0'
  force_update BOOLEAN DEFAULT false,
  release_notes TEXT,
  download_url TEXT,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_versions (platform, version, build_number, min_supported_version, force_update)
VALUES 
('ios', '1.0.1', 19, '1.0.0', false),
('android', '1.0.1', 19, '1.0.0', false);
```

**2단계: 앱 시작 시 버전 체크**
```typescript
// src/services/versionCheckService.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

async function checkAppVersion() {
  const currentVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;
  
  const { data } = await supabase
    .from('app_versions')
    .select('*')
    .eq('platform', platform)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!data) return;
  
  // 강제 업데이트 체크
  if (data.force_update && currentVersion < data.version) {
    Alert.alert(
      'Update Required',
      'Please update to the latest version to continue.',
      [
        { 
          text: 'Update', 
          onPress: () => Linking.openURL(data.download_url) 
        }
      ],
      { cancelable: false }
    );
    return;
  }
  
  // 권장 업데이트
  if (currentVersion < data.version) {
    Alert.alert(
      'Update Available',
      data.release_notes || 'New features available!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Update', onPress: () => Linking.openURL(data.download_url) }
      ]
    );
  }
}

// App.tsx에서 호출
useEffect(() => {
  checkAppVersion();
}, []);
```

**우선순위**: 🟡 중요

---

## 🟡 중요 (출시 1주일 내 해결)

### 6. **캐시 정책 명확화** ⚠️

**현재 상태**: 기본 설정
```typescript
// src/utils/queryClient.ts
staleTime: 5 * 60 * 1000, // 5분
cacheTime: 30 * 60 * 1000, // 30분
```

**개선 방안**:
```typescript
// 쿼리별로 다른 캐시 전략
const CACHE_CONFIG = {
  // 자주 변하지 않는 데이터
  static: {
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    cacheTime: 1000 * 60 * 60 * 24 * 7, // 7일
  },
  // 보통 데이터
  normal: {
    staleTime: 1000 * 60 * 5, // 5분
    cacheTime: 1000 * 60 * 30, // 30분
  },
  // 자주 변하는 데이터
  realtime: {
    staleTime: 0, // 항상 최신
    cacheTime: 1000 * 60 * 5, // 5분
  },
};

// 사용 예시
useQuery('userProfile', fetchProfile, CACHE_CONFIG.static);
useQuery('artworkFeed', fetchArtworks, CACHE_CONFIG.normal);
useQuery('notifications', fetchNotifications, CACHE_CONFIG.realtime);
```

---

### 7. **오프라인 지원 기본** ❌

**현재 상태**: 네트워크 필수

**개선 방안**:
```typescript
// src/hooks/useOfflineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedAction {
  id: string;
  type: 'like' | 'bookmark' | 'comment';
  payload: any;
  timestamp: number;
}

export function useOfflineQueue() {
  const processQueue = async () => {
    const queue = await AsyncStorage.getItem('offline_queue');
    if (!queue) return;
    
    const actions: QueuedAction[] = JSON.parse(queue);
    
    for (const action of actions) {
      try {
        await executeAction(action);
        // 성공하면 큐에서 제거
      } catch (error) {
        // 실패하면 유지
      }
    }
  };
  
  // 네트워크 복구 시 실행
  useEffect(() => {
    const subscription = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processQueue();
      }
    });
    return () => subscription();
  }, []);
}
```

---

### 8. **보안 강화**

**8.1 Supabase RLS 재검토**
```sql
-- 중요 테이블만이라도 RLS 활성화
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own addresses" ON shipping_addresses
  FOR ALL USING (user_id = auth.uid());
```

**8.2 민감 정보 로깅 제거**
```typescript
// ❌ 나쁜 예
console.log('User data:', user); // 전체 객체 로깅

// ✅ 좋은 예
console.log('User logged in:', user.id); // ID만
```

**8.3 API 키 환경변수 재확인**
```bash
# .env.production
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJ... # ⚠️ anon key만!
# SUPABASE_SERVICE_KEY는 절대 클라이언트에 포함 금지!
```

---

## 🟢 권장 (출시 후 개선)

### 9. **성능 모니터링**

```typescript
// src/utils/performanceMonitor.ts
import { performance } from 'react-native-performance';

class PerformanceMonitor {
  measureScreenLoad(screenName: string) {
    const mark = `screen_${screenName}_start`;
    performance.mark(mark);
    
    return () => {
      const measure = performance.measure(
        `screen_${screenName}`,
        mark
      );
      
      // Analytics 전송
      trackEvent('screen_load_time', {
        screen: screenName,
        duration: measure.duration,
      });
    };
  }
}
```

---

### 10. **A/B 테스트 준비**

```typescript
// src/services/abTestService.ts
class ABTestService {
  async getVariant(testName: string): Promise<'A' | 'B'> {
    const userId = await getCurrentUserId();
    const hash = hashString(userId + testName);
    return hash % 2 === 0 ? 'A' : 'B';
  }
}

// 사용 예시
const buttonColor = await abTest.getVariant('button_color') === 'A' 
  ? '#FF5733' 
  : '#3498DB';
```

---

### 11. **푸시 알림 개선**

**현재**: 기본 구현만
**개선**:
- 알림 그룹화 (좋아요 5개 → "5명이 좋아합니다")
- Rich Notification (이미지 포함)
- Deep Link (알림 클릭 → 해당 화면)

---

### 12. **검색 성능 최적화**

```sql
-- Full-text search 인덱스
CREATE INDEX idx_artworks_search ON artworks 
USING gin(to_tsvector('english', title || ' ' || description));

-- 검색 쿼리
SELECT * FROM artworks
WHERE to_tsvector('english', title || ' ' || description) 
@@ plainto_tsquery('english', $1)
LIMIT 20;
```

---

## 📋 출시 전 최종 체크리스트

```yaml
□ 이미지 업로드 제한 구현
□ Sentry/Firebase Crashlytics 연동
□ Analytics 프로덕션 통합
□ Rate Limiting 구현
□ 앱 버전 관리 시스템
□ 중요 테이블 RLS 활성화
□ 프로덕션 환경변수 설정
□ 로그에서 민감 정보 제거
□ 앱 스토어 스크린샷 준비
□ 개인정보처리방침 최종 검토
□ 이용약관 최종 검토
□ 테스트 사용자 피드백 반영
```

---

## 🎯 우선순위 요약

**지금 당장 (출시 전)**:
1. 이미지 업로드 제한 ⭐⭐⭐
2. 에러 트래킹 (최소 Firebase Crashlytics) ⭐⭐⭐
3. Rate Limiting (기본만이라도) ⭐⭐
4. 프로덕션 환경변수 확인 ⭐⭐⭐

**1주일 내**:
5. Analytics 통합 ⭐⭐
6. 앱 버전 관리 ⭐⭐
7. 캐시 정책 최적화 ⭐

**출시 후**:
8. 오프라인 지원
9. 성능 모니터링
10. A/B 테스트

---

**예상 작업 시간**: 
- 필수 항목: 1-2일
- 중요 항목: 2-3일
- 권장 항목: 1주일

**총 소요**: 약 5-7일 (출시 1주 연기 권장)

